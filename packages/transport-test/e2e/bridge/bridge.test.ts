import * as messages from '@trezor/protobuf/messages.json';
import { BridgeTransport, Descriptor, Session } from '@trezor/transport';

import { controller as TrezorUserEnvLink, env } from './controller';
import { pathLength, descriptor as expectedDescriptor } from './expect';
import { assertSuccess } from '../api/utils';

const emulatorStartOpts = { model: 'T2T1', version: '2-main', wipe: true } as const;

describe('bridge', () => {
    let bridge: BridgeTransport;
    let descriptors: Descriptor[];
    let session: Session;

    beforeAll(async () => {
        await TrezorUserEnvLink.connect();
        await TrezorUserEnvLink.startEmu(emulatorStartOpts);
        await TrezorUserEnvLink.startBridge();

        bridge = new BridgeTransport({ messages });
        await bridge.init();

        const enumerateResult = await bridge.enumerate();
        assertSuccess(enumerateResult);
        expect(enumerateResult).toMatchObject({
            success: true,
            payload: [
                {
                    path: expect.any(String),
                    session: null,
                    product: expectedDescriptor.product,
                },
            ],
        });

        const { path } = enumerateResult.payload[0];
        expect(path.length).toEqual(pathLength);

        descriptors = enumerateResult.payload;

        const acquireResult = await bridge.acquire({
            input: { path: descriptors[0].path, previous: session },
        });
        assertSuccess(acquireResult);
        expect(acquireResult).toEqual({
            success: true,
            payload: '1',
        });
        session = acquireResult.payload;
    });

    afterAll(async () => {
        await TrezorUserEnvLink.stopEmu();
        await TrezorUserEnvLink.stopBridge();
        TrezorUserEnvLink.disconnect();
    });

    test(`call(GetFeatures)`, async () => {
        const message = await bridge.call({ session, name: 'GetFeatures', data: {} });
        expect(message).toMatchObject({
            success: true,
            payload: {
                type: 'Features',
                message: {
                    vendor: 'trezor.io',
                },
            },
        });
    });

    test(`send(GetFeatures) - receive`, async () => {
        const sendResponse = await bridge.send({ session, name: 'GetFeatures', data: {} });
        expect(sendResponse).toEqual({ success: true, payload: undefined });

        const receiveResponse = await bridge.receive({ session });

        expect(receiveResponse).toMatchObject({
            success: true,
            payload: {
                type: 'Features',
                message: {
                    vendor: 'trezor.io',
                },
            },
        });
    });

    test(`call(RebootToBootloader) - send(Cancel) - receive`, async () => {
        // initiate RebootToBootloader procedure on device (it works regardless device is wiped or not)
        const callResponse = await bridge.call({
            session,
            name: 'RebootToBootloader',
            data: {},
        });
        expect(callResponse).toMatchObject({
            success: true,
            payload: {
                type: 'ButtonRequest',
            },
        });

        // cancel RebootToBootloader procedure
        await bridge.send({ session, name: 'Cancel', data: {} });

        // receive response
        const receiveResponse = await bridge.receive({ session });

        expect(receiveResponse).toMatchObject({
            success: true,
            payload: {
                type: 'Failure',
                message: {
                    code: 'Failure_ActionCancelled',
                },
            },
        });

        // validate that we can continue with communication
        const message = await bridge.call({
            session,
            name: 'GetFeatures',
            data: {},
        });
        expect(message).toMatchObject({
            success: true,
            payload: {
                type: 'Features',
                message: {
                    vendor: 'trezor.io',
                },
            },
        });
    });

    // todo: udp not implemented correctly yet in new bridge
    if (!env.USE_NODE_BRIDGE || env.USE_HW) {
        test(`send(RebootToBootloader) - send(Cancel) - receive`, async () => {
            // special case - a procedure on device is initiated by SEND method.
            await bridge.send({ session, name: 'RebootToBootloader', data: {} });

            // cancel RebootToBootloader procedure
            await bridge.send({ session, name: 'Cancel', data: {} });

            // receive response
            const receiveResponse1 = await bridge.receive({ session });

            // we did 2x send, but no read. it means that now the next receive read the response from the first send
            expect(receiveResponse1).toMatchObject({
                success: true,
                payload: {
                    type: 'ButtonRequest',
                },
            });

            // and the next receive read the response from the second send
            const receiveResponse2 = await bridge.receive({ session });
            expect(receiveResponse2).toMatchObject({
                success: true,
                payload: {
                    message: {
                        code: 'Failure_ActionCancelled',
                    },
                    type: 'Failure',
                },
            });
        });
    }

    test(`concurrent acquire`, async () => {
        const { path } = descriptors[0];
        const results = await Promise.all([
            bridge.acquire({ input: { path, previous: session } }),
            bridge.acquire({ input: { path, previous: session } }),
        ]);
        expect(results).toIncludeAllPartialMembers([
            { success: true, payload: `${Number.parseInt(session) + 1}` },
            { success: false, error: 'wrong previous session' },
        ]);
        assertSuccess(results[0]);
        session = results[0].payload;
    });

    // todo: udp not implemented correctly yet in new bridge
    if (!env.USE_NODE_BRIDGE || env.USE_HW) {
        test(`concurrent receive - other call in progress`, async () => {
            await bridge.send({ session, name: 'GetFeatures', data: {} });

            const results = await Promise.all([
                bridge.receive({ session }),
                bridge.receive({ session }),
            ]);

            expect(results).toIncludeAllPartialMembers([
                { success: true, payload: { type: 'Features', message: expect.any(Object) } },
                { success: false, error: 'other call in progress' },
            ]);
        });
    }

    test(`concurrent call - other call in progress`, async () => {
        const results = await Promise.all([
            bridge.call({ session, name: 'GetFeatures', data: {} }),
            bridge.call({ session, name: 'GetFeatures', data: {} }),
        ]);
        expect(results).toIncludeAllPartialMembers([
            { success: true, payload: { type: 'Features', message: expect.any(Object) } },
            { success: false, error: 'other call in progress' },
        ]);
    });

    test(`concurrent receive and send`, async () => {
        const results = await Promise.all([
            bridge.receive({ session }),
            bridge.send({ session, name: 'GetFeatures', data: {} }),
        ]);

        expect(results).toIncludeAllPartialMembers([
            { success: true, payload: { type: 'Features', message: expect.any(Object) } },
            { success: true, payload: undefined },
        ]);
    });

    test(`concurrent send and receive`, async () => {
        const results = await Promise.all([
            bridge.send({ session, name: 'GetFeatures', data: {} }),
            bridge.receive({ session }),
        ]);

        expect(results).toIncludeAllPartialMembers([
            { success: true, payload: undefined },
            { success: true, payload: { type: 'Features', message: expect.any(Object) } },
        ]);
    });

    test(`concurrent send`, async () => {
        const results = await Promise.all([
            bridge.send({ session, name: 'GetFeatures', data: {} }),
            bridge.send({ session, name: 'GetFeatures', data: {} }),
        ]);
        await bridge.receive({ session });
        await bridge.receive({ session });
        expect(results).toMatchObject([
            { success: true, payload: undefined },
            { success: true, payload: undefined },
        ]);
    });

    test(`concurrent send and call`, async () => {
        const results = await Promise.all([
            bridge.send({ session, name: 'GetFeatures', data: {} }),
            bridge.call({ session, name: 'GetFeatures', data: {} }),
        ]);

        expect(results).toIncludeAllPartialMembers([
            { success: true, payload: undefined },
            { success: true, payload: { type: 'Features', message: expect.any(Object) } },
        ]);
    });

    // todo: udp not implemented correctly yet in new bridge
    if (!env.USE_NODE_BRIDGE || env.USE_HW) {
        test('acquire (wrong session) and concurrent call. what has priority in error handling?', async () => {
            const results = await Promise.all([
                // send a session which is wrong
                bridge.call({ session: '123', name: 'GetFeatures', data: {} }),
                // and send two conflicting calls at the same time
                bridge.call({ session, name: 'GetFeatures', data: {} }),
                bridge.call({ session, name: 'GetFeatures', data: {} }),
            ]);

            expect(results[0]).toMatchObject({
                success: false,
                error: 'session not found',
                message: undefined,
            });

            expect([results[1], results[2]]).toIncludeAllPartialMembers([
                { success: true, payload: { type: 'Features', message: expect.any(Object) } },
                { success: false, error: 'other call in progress' },
            ]);
        });
    }

    test('concurrent enumerate', async () => {
        const results = await Promise.all([bridge.enumerate(), bridge.enumerate()]);
        expect(results).toIncludeAllPartialMembers([
            { success: true, payload: expect.any(Array) },
            { success: true, payload: expect.any(Array) },
        ]);
    });

    test('call and enumerate', async () => {
        const results = await Promise.all([
            bridge.call({ session, name: 'GetFeatures', data: {} }),
            bridge.enumerate(),
        ]);
        expect(results).toIncludeAllPartialMembers([
            { success: true, payload: { type: 'Features', message: expect.any(Object) } },
            { success: true, payload: expect.any(Array) },
        ]);
    });

    // todo: udp not implemented correctly yet in new bridge
    if (!env.USE_NODE_BRIDGE || env.USE_HW) {
        test('send and enumerate, receive and enumerate', async () => {
            const results = await Promise.all([
                bridge.send({ session, name: 'GetFeatures', data: {} }),
                bridge.enumerate(),
            ]);
            expect(results).toIncludeAllPartialMembers([
                { success: true, payload: undefined },
                { success: true, payload: expect.any(Array) },
            ]);

            await Promise.all([bridge.receive({ session }), bridge.enumerate()]);
        });
    }
});
