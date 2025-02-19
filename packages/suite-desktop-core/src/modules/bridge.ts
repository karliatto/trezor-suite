/**
 * Bridge runner
 */
import { TrezordNode } from '@trezor/transport-bridge';
import { isDevEnv } from '@suite-common/suite-utils';
import { validateIpcMessage } from '@trezor/ipc-proxy';
import { scheduleAction } from '@trezor/utils';

import { app, ipcMain } from '../typed-electron';
import { BridgeProcess } from '../libs/processes/BridgeProcess';
import { b2t } from '../libs/utils';
import { ThreadProxy } from '../libs/thread-proxy';

import type { Dependencies } from './index';

const bridgeLegacy = app.commandLine.hasSwitch('bridge-legacy');
// bridge node is intended for internal testing
const bridgeTest = app.commandLine.hasSwitch('bridge-test');
const bridgeDev = app.commandLine.hasSwitch('bridge-dev');

const skipNewBridgeRollout = app.commandLine.hasSwitch('skip-new-bridge-rollout');

export const SERVICE_NAME = 'bridge';

type BridgeInterface = Pick<BridgeProcess, 'start' | 'startDev' | 'startTest' | 'stop' | 'status'>;

/** Wrapper around TrezordNode ThreadProxy which unifies its api with legacy BridgeProcess */
class TrezordNodeProcess implements BridgeInterface {
    private readonly proxy;

    constructor() {
        this.proxy = new ThreadProxy<TrezordNode>({ name: 'bridge', keepAlive: true });
    }

    private async startProxy(mode: 'start' | 'startDev' | 'startTest') {
        if (this.proxy.running) return;
        await this.proxy.run({ port: 21325, api: bridgeDev || bridgeTest ? 'udp' : 'usb' });
        // Call `start` again in case of respawning due to keepAlive
        this.proxy.watch('started', () => this.proxy.request(mode, []));
        await this.proxy.request(mode, []);
    }

    start() {
        return this.startProxy('start');
    }

    startDev() {
        return this.startProxy('startDev');
    }

    startTest() {
        return this.startProxy('startTest');
    }

    async stop() {
        if (!this.proxy.running) return;
        await this.proxy.request('stop', []);
        this.proxy.dispose();
    }

    status() {
        return this.proxy
            .request('status', [])
            .catch(() => ({ service: false, process: this.proxy.running }));
    }
}

const handleBridgeStatus = async (bridge: BridgeInterface) => {
    const { logger } = global;

    logger.info('bridge', `Getting status`);
    const status = await bridge.status();
    logger.info('bridge', `Toggling bridge. Status: ${JSON.stringify(status)}`);

    ipcMain.emit('bridge/status', status);

    return status;
};

const start = async (bridge: BridgeInterface) => {
    if (bridgeLegacy) {
        await bridge.start();
    } else if (bridgeDev) {
        await bridge.startDev();
    } else if (bridgeTest) {
        await bridge.startTest();
    } else {
        await bridge.start();
    }
};

const shouldUseLegacyBridge = (store: Dependencies['store']) => {
    const legacyRequestedBySettings = store.getBridgeSettings().legacy;
    const { allowPrerelease } = store.getUpdateSettings();

    // Legacy bridge explicitly requested
    if (bridgeLegacy || legacyRequestedBySettings) return true;
    // EAP or dev uses node-bridge by default
    if (allowPrerelease || isDevEnv) return false;

    // handle rollout for regular users
    if (skipNewBridgeRollout) return false;
    if (store.getBridgeSettings().newBridgeRollout === undefined) {
        const newBridgeRollout = Math.round(Math.random() * 100) / 100;
        store.setBridgeSettings({ ...store.getBridgeSettings(), newBridgeRollout });
    }
    const newBridgeRollout = store.getBridgeSettings().newBridgeRollout || 0;
    // note that this variable is duplicated with UI
    const NEW_BRIDGE_ROLLOUT_THRESHOLD = 0;
    const legacyBridgeReasonRollout = newBridgeRollout >= NEW_BRIDGE_ROLLOUT_THRESHOLD;

    return legacyBridgeReasonRollout;
};

const load = async (bridge: BridgeInterface, store: Dependencies['store']) => {
    const { logger } = global;

    ipcMain.handle('bridge/toggle', async ipcEvent => {
        validateIpcMessage(ipcEvent);

        const status = await handleBridgeStatus(bridge);
        try {
            if (status.service) {
                await bridge.stop();
            } else {
                await start(bridge);
            }

            return { success: true };
        } catch (error) {
            return { success: false, error };
        } finally {
            handleBridgeStatus(bridge);
        }
    });

    ipcMain.handle('bridge/get-status', async ipcEvent => {
        validateIpcMessage(ipcEvent);

        try {
            const status = await bridge.status();

            return { success: true, payload: status };
        } catch (error) {
            return { success: false, error };
        }
    });

    ipcMain.handle(
        'bridge/change-settings',
        (ipcEvent, payload: { doNotStartOnStartup: boolean; legacy?: boolean }) => {
            validateIpcMessage(ipcEvent);

            try {
                store.setBridgeSettings(payload);

                return { success: true };
            } catch (error) {
                return { success: false, error };
            } finally {
                ipcMain.emit('bridge/settings', store.getBridgeSettings());
            }
        },
    );

    ipcMain.handle('bridge/get-settings', ipcEvent => {
        validateIpcMessage(ipcEvent);

        try {
            return { success: true, payload: store.getBridgeSettings() };
        } catch (error) {
            return { success: false, error };
        }
    });

    if (store.getBridgeSettings().doNotStartOnStartup) {
        return;
    }

    try {
        logger.info(
            SERVICE_NAME,
            `Starting (Legacy: ${b2t(bridgeLegacy)}, Test: ${b2t(bridgeTest)}, Dev: ${b2t(bridgeDev)})`,
        );
        await start(bridge);
        handleBridgeStatus(bridge);
    } catch (err) {
        bridge.stop();
        logger.error(SERVICE_NAME, `Start failed: ${err.message}`);
    }
};

type BridgeModule = ({ store }: Pick<Dependencies, 'store'>) => {
    onLoad: () => void;
    onQuit: () => Promise<void>;
};

export const init: BridgeModule = ({ store }) => {
    let loaded = false;
    let bridge: BridgeInterface;

    const onLoad = () => {
        if (loaded) return;
        loaded = true;

        bridge = shouldUseLegacyBridge(store) ? new BridgeProcess() : new TrezordNodeProcess();

        return scheduleAction(() => load(bridge, store), { timeout: 3000 }).catch(err => {
            // Error ignored, user will see transport error afterwards
            logger.error(SERVICE_NAME, `Failed to load: ${err.message}`);
        });
    };

    const onQuit = async () => {
        await bridge?.stop();
    };

    return { onLoad, onQuit };
};
