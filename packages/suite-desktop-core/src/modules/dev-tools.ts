/**
 * Enable DevTools
 */
import { app } from 'electron';

import { isDevEnv } from '@suite-common/suite-utils';

import type { Module } from './index';

const openDevToolsFlag = app.commandLine.hasSwitch('open-devtools');

export const SERVICE_NAME = 'dev-tools';

export const init: Module = ({ mainWindowProxy }) => {
    if (isDevEnv || openDevToolsFlag) {
        mainWindowProxy.getInstance()?.webContents.openDevTools();
    }
};
