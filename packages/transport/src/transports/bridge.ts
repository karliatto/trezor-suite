import { versionUtils, createDeferred, Deferred, createTimeoutPromise } from '@trezor/utils';
import {
    PROTOCOL_MALFORMED,
    bridge as protocolBridge,
    v1 as protocolV1,
    TransportProtocol,
} from '@trezor/protocol';
import { bridgeApiCall } from '../utils/bridgeApiCall';
import * as bridgeApiResult from '../utils/bridgeApiResult';
import { createProtocolMessage } from '../utils/bridgeProtocolMessage';
import { buildMessage } from '../utils/send';
import { receiveAndParse } from '../utils/receive';
import {
    AbstractTransport,
    AbstractTransportParams,
    AbstractTransportMethodParams,
} from './abstract';

import * as ERRORS from '../errors';
import {
    AnyError,
    AsyncResultWithTypedError,
    Descriptor,
    Session,
    BridgeProtocolMessage,
} from '../types';

const DEFAULT_URL = 'http://127.0.0.1:21325';

type BridgeEndpoint =
    | '/'
    | '/listen'
    | '/acquire'
    | '/post'
    | '/call'
    | '/enumerate'
    | '/release'
    | '/read';

type BridgeCommonErrors =
    | typeof ERRORS.HTTP_ERROR
    | typeof ERRORS.WRONG_RESULT_TYPE
    | typeof ERRORS.UNEXPECTED_ERROR;

type R = Extract<
    ReturnType<
        | (typeof bridgeApiResult)['acquire']
        | (typeof bridgeApiResult)['call']
        | (typeof bridgeApiResult)['empty']
        | (typeof bridgeApiResult)['devices']
        | (typeof bridgeApiResult)['info']
    >,
    { success: true }
>['payload'];

type IncompleteRequestOptions = {
    params?: string;
    body?: any;
    timeout?: number;
    signal?: AbortController['signal'];
};

type BridgeConstructorParameters = AbstractTransportParams & {
    // bridge url
    url?: string;
    latestVersion?: string;
};

export class BridgeTransport extends AbstractTransport {
    /**
     * information about  the latest version of trezord.
     */
    private latestVersion?: string;
    private useProtocolMessages: boolean = false;
    /**
     * url of trezord server.
     */
    private url: string;

    /**
     * means that /acquire call is in progress. this is used to postpone /listen call so that it can be
     * fired with updated descriptor
     */
    protected acquirePromise?: Deferred<boolean>;

    public name = 'BridgeTransport' as const;

    constructor(params: BridgeConstructorParameters) {
        const { url = DEFAULT_URL, latestVersion, ...args } = params || {};
        super(args);
        this.url = url;
        this.latestVersion = latestVersion;
    }

    public init({ signal }: AbstractTransportMethodParams<'init'> = {}) {
        return this.scheduleAction(
            async signal => {
                const response = await this.post('/', {
                    signal,
                });

                if (!response.success) {
                    return response;
                }

                this.version = response.payload.version;

                if (this.latestVersion) {
                    this.isOutdated = versionUtils.isNewer(this.latestVersion, this.version);
                }
                this.useProtocolMessages = !!response.payload.protocolMessages;

                this.stopped = false;

                return this.success(undefined);
            },
            { signal },
        );
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L373
    public listen() {
        if (this.listening) {
            return this.error({ error: ERRORS.ALREADY_LISTENING });
        }

        this.listening = true;
        this.listenLoop();

        return this.success(undefined);
    }

    private async listenLoop() {
        while (!this.stopped) {
            const listenTimestamp = Date.now();

            const response = await this.post('/listen', {
                body: this.descriptors,
                signal: this.abortController.signal,
            });

            if (!response.success) {
                const time = Date.now() - listenTimestamp;
                if (time <= 1100) {
                    this.emit('transport-error', response.error);
                    break;
                }
                await createTimeoutPromise(1000);
            } else {
                const acquirePromiseResult = (await this.acquirePromise?.promise) ?? true;
                delete this.acquirePromise;

                if (acquirePromiseResult) {
                    this.handleDescriptorsChange(response.payload);
                }
            }
        }
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L235
    public enumerate({ signal }: AbstractTransportMethodParams<'enumerate'> = {}) {
        return this.scheduleAction(signal => this.post('/enumerate', { signal }), { signal });
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L420
    public acquire({ input, signal }: AbstractTransportMethodParams<'acquire'>) {
        return this.scheduleAction(
            async signal => {
                const previous = input.previous == null ? 'null' : input.previous;

                if (this.listening) {
                    // listenPromise is resolved on next listen
                    this.listenPromise[input.path] = createDeferred();
                }

                // it is not quaranteed that /listen response will arrive after /acquire response (although in majority of cases it does)
                // so, in order to be able to keep the logic "acquire -> wait for listen response -> return from acquire" we need to wait
                // for /acquire response before resolving listenPromise
                this.acquirePromise = createDeferred();

                const response = await this.post('/acquire', {
                    params: `${input.path}/${previous}`,
                    signal,
                });

                if (!response.success) {
                    if (this.listenPromise[input.path]) {
                        delete this.listenPromise[input.path];
                    }
                    this.acquirePromise.resolve(response.success);

                    return response;
                }

                this.acquirePromise.resolve(response.success);
                this.acquiredUnconfirmed[input.path] = response.payload;

                if (!this.listenPromise[input.path]) {
                    return this.success(response.payload);
                }

                return this.listenPromise[input.path].promise.finally(() => {
                    delete this.listenPromise[input.path];
                });
            },
            { signal },
            [ERRORS.DEVICE_DISCONNECTED_DURING_ACTION, ERRORS.SESSION_WRONG_PREVIOUS],
        );
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L354
    public release({ path, session, onClose, signal }: AbstractTransportMethodParams<'release'>) {
        return this.scheduleAction(
            signal => {
                if (this.listening && !onClose) {
                    this.releaseUnconfirmed[path] = session;
                    this.listenPromise[path] = createDeferred();
                }

                const releasePromise = this.post('/release', {
                    params: session,
                    signal,
                });

                if (onClose) {
                    return Promise.resolve(this.success(undefined));
                }

                if (!this.listenPromise[path]) {
                    return releasePromise;
                }

                return this.listenPromise[path].promise
                    .then(() => this.success(undefined))
                    .finally(() => {
                        delete this.listenPromise[path];
                    });
            },
            { signal },
        );
    }

    public releaseDevice() {
        return Promise.resolve(this.success(undefined));
    }

    private getProtocol(customProtocol?: TransportProtocol) {
        if (!this.useProtocolMessages) {
            // custom protocols not supported by legacy bridge
            return protocolBridge;
        }

        return customProtocol || protocolV1;
    }

    private getRequestBody(body: Buffer, protocol: TransportProtocol) {
        return createProtocolMessage(body, this.useProtocolMessages ? protocol : undefined);
    }

    // https://github.dev/trezor/trezord-go/blob/f559ee5079679aeb5f897c65318d3310f78223ca/core/core.go#L534
    public call({
        session,
        name,
        data,
        protocol: customProtocol,
        signal,
    }: AbstractTransportMethodParams<'call'>) {
        return this.scheduleAction(
            async signal => {
                const protocol = this.getProtocol(customProtocol);
                const bytes = buildMessage({
                    messages: this.messages,
                    name,
                    data,
                    encode: protocol.encode,
                });
                const response = await this.post(`/call`, {
                    params: session,
                    body: this.getRequestBody(bytes, protocol),
                    signal,
                });
                if (!response.success) {
                    return response;
                }

                return receiveAndParse(
                    this.messages,
                    () => Promise.resolve(this.success(Buffer.from(response.payload.data, 'hex'))),
                    protocol,
                );
            },
            { signal, timeout: undefined },
        );
    }

    public send({
        session,
        name,
        data,
        protocol: customProtocol,
        signal,
    }: AbstractTransportMethodParams<'send'>) {
        return this.scheduleAction(
            async signal => {
                const protocol = this.getProtocol(customProtocol);
                const bytes = buildMessage({
                    messages: this.messages,
                    name,
                    data,
                    encode: protocol.encode,
                });
                const response = await this.post('/post', {
                    params: session,
                    body: this.getRequestBody(bytes, protocol),
                    signal,
                });
                if (!response.success) {
                    return response;
                }

                return this.success(undefined);
            },
            { signal },
        );
    }

    public receive({
        session,
        protocol: customProtocol,
        signal,
    }: AbstractTransportMethodParams<'receive'>) {
        return this.scheduleAction(
            async signal => {
                const protocol = this.getProtocol(customProtocol);
                const response = await this.post('/read', {
                    params: session,
                    body: this.getRequestBody(Buffer.alloc(0), protocol),
                    signal,
                });

                if (!response.success) {
                    return response;
                }

                return receiveAndParse(
                    this.messages,
                    () => Promise.resolve(this.success(Buffer.from(response.payload.data, 'hex'))),
                    protocol,
                );
            },
            { signal, timeout: undefined },
        );
    }

    public stop() {
        super.stop();
        this.acquirePromise = undefined;
    }

    /**
     * All bridge endpoints use POST methods
     * For documentation, look here: https://github.com/trezor/trezord-go#api-documentation
     */
    private async post(
        endpoint: '/',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<
        Exclude<ReturnType<typeof bridgeApiResult.info>, { success: false }>['payload'],
        BridgeCommonErrors
    >;
    private async post(
        endpoint: '/acquire',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<
        Session,
        | BridgeCommonErrors
        | typeof ERRORS.DEVICE_NOT_FOUND
        | typeof ERRORS.SESSION_WRONG_PREVIOUS
        | typeof ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE
    >;
    private async post(
        endpoint: '/call' | '/post' | '/read',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<
        BridgeProtocolMessage,
        | BridgeCommonErrors
        | typeof ERRORS.DEVICE_DISCONNECTED_DURING_ACTION
        | typeof PROTOCOL_MALFORMED
        | typeof ERRORS.OTHER_CALL_IN_PROGRESS
    >;
    private async post(
        endpoint: '/release',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<undefined, BridgeCommonErrors | typeof ERRORS.SESSION_NOT_FOUND>;
    private async post(
        endpoint: '/listen',
        options?: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<Descriptor[], BridgeCommonErrors>;
    private async post(
        endpoint: '/enumerate',
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<Descriptor[], BridgeCommonErrors>;
    private async post(
        endpoint: BridgeEndpoint,
        options: IncompleteRequestOptions,
    ): AsyncResultWithTypedError<R, AnyError> {
        const response = await bridgeApiCall({
            ...options,
            method: 'POST',
            url: `${this.url + endpoint}${options?.params ? `/${options.params}` : ''}`,
            skipContentTypeHeader: true,
        });

        if (!response.success) {
            if (response.error === ERRORS.UNEXPECTED_ERROR) {
                return response;
            }
            if (response.error === ERRORS.HTTP_ERROR) {
                return this.error({ error: response.error });
            }

            switch (endpoint) {
                case '/':
                    return this.unknownError(response.error);
                case '/acquire':
                    return this.unknownError(response.error, [
                        ERRORS.SESSION_WRONG_PREVIOUS,
                        ERRORS.DEVICE_NOT_FOUND,
                        ERRORS.INTERFACE_UNABLE_TO_OPEN_DEVICE,
                        ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                    ]);
                case '/read':
                case '/call':
                    return this.unknownError(response.error, [
                        ERRORS.SESSION_NOT_FOUND,
                        ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                        ERRORS.OTHER_CALL_IN_PROGRESS,
                        PROTOCOL_MALFORMED,
                    ]);
                case '/enumerate':
                case '/listen':
                    return this.unknownError(response.error);
                case '/post':
                    return this.unknownError(response.error, [
                        ERRORS.SESSION_NOT_FOUND,
                        ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                        ERRORS.OTHER_CALL_IN_PROGRESS,
                        PROTOCOL_MALFORMED,
                    ]);
                case '/release':
                    return this.unknownError(response.error, [
                        ERRORS.SESSION_NOT_FOUND,
                        ERRORS.DEVICE_DISCONNECTED_DURING_ACTION,
                    ]);
                default:
                    return this.error({
                        error: ERRORS.WRONG_RESULT_TYPE,
                        message: 'just for type safety, should never happen',
                    });
                // should never get here
            }
        }

        switch (endpoint) {
            case '/':
                return bridgeApiResult.info(response.payload);
            case '/acquire':
                return bridgeApiResult.acquire(response.payload);
            case '/read':
            case '/call':
                return bridgeApiResult.call(response.payload);
            case '/post':
                return bridgeApiResult.post(response.payload);
            case '/enumerate':
            case '/listen':
                return bridgeApiResult.devices(response.payload);
            case '/release':
                return bridgeApiResult.empty(response.payload);
            default:
                return this.error({
                    error: ERRORS.WRONG_RESULT_TYPE,
                    message: 'just for type safety, should never happen',
                });
            // should never get here
        }
    }
}
