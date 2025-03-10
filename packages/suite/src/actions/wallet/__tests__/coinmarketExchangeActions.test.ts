import { configureStore } from 'src/support/tests/configureStore';

import coinmarketReducer from 'src/reducers/wallet/coinmarketReducer';

import * as coinmarketExchangeActions from '../coinmarketExchangeActions';
import invityAPI from 'src/services/suite/invityAPI';
import { CryptoId, ExchangeTrade, ExchangeTradeQuoteRequest } from 'invity-api';

export const getInitialState = () => ({
    wallet: {
        coinmarket: coinmarketReducer(undefined, { type: 'foo' } as any),
    },
});

type State = ReturnType<typeof getInitialState>;

const mockStore = configureStore<State, any>();

const initStore = (state: State) => {
    const store = mockStore(state);
    store.subscribe(() => {
        const action = store.getActions().pop();
        const { coinmarket } = store.getState().wallet;
        store.getState().wallet = {
            coinmarket: coinmarketReducer(coinmarket, action),
        };
        // add action back to stack
        store.getActions().push(action);
    });

    return store;
};

const setFetchMock = (mocks: any) => {
    global.fetch = jest.fn().mockImplementation(url => {
        const mock = mocks[url];
        if (!mock) return;
        const p = new Promise(resolve => {
            resolve({
                ok: mock.ok,
                statusText: mock.statusText || '',
                json: () =>
                    new Promise((resolve, reject) => {
                        if (mock.reject) {
                            return reject(mock.reject);
                        }

                        return resolve(mock.response);
                    }),
            });
        });

        return p;
    });
};

describe('Coinmarket Exchange Actions', () => {
    invityAPI.createInvityAPIKey('mock');

    it('load and saveExchangeInfo', () => {
        const exchangeList = [
            {
                name: 'changenow',
                companyName: 'ChangeNOW',
                logo: 'changenow-icon.jpg',
                isActive: true,
                isFixedRate: false,
                buyTickers: ['XMR', 'BTC'],
                sellTickers: ['BTC'],
                addressFormats: {
                    BCH: 'legacy',
                    LTC: 'type3',
                },
                statusUrl: 'https://changenow.io/exchange/txs/{{orderId}}',
                kycUrl: 'https://changenow.io/faq#kyc',
                supportUrl: 'https://support.changenow.io',
                kycPolicy:
                    'Changenow enforces KYC on suspicious transactions. Refunds without KYC.',
                isRefundRequired: false,
            },
            {
                name: 'changenowfr',
                companyName: 'ChangeNOW',
                logo: 'changenowfr-icon.jpg',
                isActive: true,
                isFixedRate: true,
                buyTickers: ['ETH', 'BTC', 'BCH'],
                sellTickers: ['ETH', 'BTC'],
                addressFormats: {
                    BCH: 'legacy',
                    LTC: 'type3',
                },
                statusUrl: 'https://changenow.io/exchange/txs/{{orderId}}',
                kycUrl: 'https://changenow.io/faq#kyc',
                supportUrl: 'https://support.changenow.io',
                kycPolicy:
                    'Changenow enforces KYC on suspicious transactions. Refunds without KYC.',
                isRefundRequired: false,
            },
        ];

        setFetchMock({
            'https://exchange.trezor.io/api/v3/exchange/list': { ok: true, response: exchangeList },
        });

        const store = initStore(getInitialState());

        coinmarketExchangeActions.loadExchangeInfo().then(exchangeInfo => {
            store.dispatch(coinmarketExchangeActions.saveExchangeInfo(exchangeInfo));
            expect(store.getState().wallet.coinmarket.exchange.exchangeInfo).toEqual({
                exchangeList,
                providerInfos: { changenow: exchangeList[0], changenowfr: exchangeList[1] },
                buySymbols: new Set<string>(['XMR', 'BTC', 'ETH', 'BCH']),
                sellSymbols: new Set<string>(['BTC', 'ETH']),
            });
        });
    });

    it('saveTransactionDetailId', () => {
        const store = initStore(getInitialState());
        store.dispatch(coinmarketExchangeActions.saveTransactionId('1234-4321-4321'));
        expect(store.getState().wallet.coinmarket.exchange.transactionId).toEqual('1234-4321-4321');
    });

    it('saveQuoteRequest', () => {
        const store = initStore(getInitialState());

        const request: ExchangeTradeQuoteRequest = {
            receive: 'BTC' as CryptoId,
            send: 'LTC' as CryptoId,
            sendStringAmount: '12',
        };

        store.dispatch(coinmarketExchangeActions.saveQuoteRequest(request));
        expect(store.getState().wallet.coinmarket.exchange.quotesRequest).toEqual(request);
    });

    it('saveQuotes', () => {
        const store = initStore(getInitialState());

        const quotes: ExchangeTrade[] = [];

        store.dispatch(coinmarketExchangeActions.saveQuotes(quotes));
        expect(store.getState().wallet.coinmarket.exchange.quotes).toEqual(quotes);
    });
});
