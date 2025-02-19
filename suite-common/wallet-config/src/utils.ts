import { networks, networksCompatibility } from './networksConfig';
import { AccountType, Network, NetworkFeature, Networks, NetworkSymbol } from './types';

/**
 * array from `networks` as a `Network[]` type instead of inferred type
 */
export const networksCollection: Network[] = Object.values(networks);

/**
 * @deprecated See `networksCompatibility`
 */
export const getMainnetsCompatible = (debug = false, bnb = false) =>
    networksCompatibility.filter(
        n =>
            !n.accountType &&
            !n.testnet &&
            (!n.isDebugOnlyNetwork || debug) &&
            (bnb || n.symbol !== 'bnb'),
    );

/**
 * @deprecated See `networksCompatibility`
 */
export const getTestnetsCompatible = (debug = false) =>
    networksCompatibility.filter(
        n => !n.accountType && n.testnet === true && (!n.isDebugOnlyNetwork || debug),
    );

export const getMainnets = (debug = false, bnb = false) =>
    networksCollection.filter(
        n => !n.testnet && (!n.isDebugOnlyNetwork || debug) && (bnb || n.symbol !== 'bnb'),
    );

export const getTestnets = (debug = false) =>
    networksCollection.filter(n => n.testnet === true && (!n.isDebugOnlyNetwork || debug));

export const getTestnetSymbols = () => getTestnets().map(n => n.symbol);

export const isBlockbookBasedNetwork = (symbol: NetworkSymbol) =>
    networks[symbol]?.customBackends.some(backend => backend === 'blockbook');

export const isDebugOnlyAccountType = (
    accountType: AccountType,
    symbol?: NetworkSymbol,
): boolean => {
    if (!symbol) return false;

    const network = (networks as Networks)?.[symbol];

    if (!network) return false;

    const accountTypeInfo = network.accountTypes[accountType];

    return !!accountTypeInfo?.isDebugOnlyAccountType;
};

export const getNetworkType = (symbol: NetworkSymbol) => networks[symbol]?.networkType;

// Takes into account just network features, not features for specific accountTypes.
export const getNetworkFeatures = (symbol: NetworkSymbol): NetworkFeature[] =>
    networks[symbol]?.features;

export const getCoingeckoId = (symbol: NetworkSymbol) => networks[symbol]?.coingeckoId;

export const isNetworkSymbol = (symbol: NetworkSymbol | string): symbol is NetworkSymbol =>
    networks.hasOwnProperty(symbol);

/**
 * Get network object by symbol as a generic `Network` type.
 * If you need the exact inferred type, use `networks[symbol]` directly.
 * @param symbol
 */
export const getNetwork = (symbol: NetworkSymbol): Network => networks[symbol];

export const getNetworkOptional = (symbol?: string) =>
    symbol && isNetworkSymbol(symbol) ? getNetwork(symbol) : undefined;

export const isAccountOfNetwork = (
    network: Network,
    accountType: string,
): accountType is AccountType =>
    network.accountTypes.hasOwnProperty(accountType) || accountType === 'normal';

export const getNetworkByCoingeckoId = (coingeckoId: string) =>
    networksCollection.find(n => n.coingeckoId === coingeckoId);

export const getNetworkByCoingeckoNativeId = (coingeckoId: string) =>
    networksCollection.find(n => n.coingeckoNativeId === coingeckoId);
