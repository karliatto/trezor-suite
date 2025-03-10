export const VERSION = '9.4.1-beta.1';

const versionN = VERSION.split('.').map(s => parseInt(s, 10));

const isBeta = VERSION.includes('beta');

export const DEFAULT_DOMAIN = isBeta
    ? `https://connect.trezor.io/${VERSION}/`
    : `https://connect.trezor.io/${versionN[0]}/`;

// Increment with content script changes
export const CONTENT_SCRIPT_VERSION = 1;
