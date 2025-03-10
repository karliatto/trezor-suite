import { H2, Icon, Row, variables } from '@trezor/components';
import styled from 'styled-components';
import { CoinmarketCryptoAmount, CoinmarketFiatAmount } from '..';
import { spacingsPx } from '@trezor/theme';
import { SCREEN_QUERY } from '@trezor/components/src/config/variables';
import { CoinmarketCryptoAmountProps } from 'src/types/coinmarket/coinmarketOffers';
import {
    isCoinmarketExchangeOffers,
    isCoinmarketSellOffers,
    useCoinmarketOffersContext,
} from 'src/hooks/wallet/coinmarket/offers/useCoinmarketCommonOffers';
import { CryptoId } from 'invity-api';

const SummaryWrap = styled.div`
    ${SCREEN_QUERY.BELOW_TABLET} {
        padding-left: 0;
        margin-top: 0;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledIcon = styled(Icon)`
    padding: 0 ${spacingsPx.sm};
    margin: 0 ${spacingsPx.lg};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const TextWrap = styled(H2)`
    ${SCREEN_QUERY.BELOW_TABLET} {
        font-size: ${variables.FONT_SIZE.H2};
    }
`;

const CoinmarketHeaderSummary = ({
    className,
    sendAmount,
    sendCurrency,
    receiveCurrency,
    receiveAmount,
}: CoinmarketCryptoAmountProps) => {
    const context = useCoinmarketOffersContext();

    return (
        <SummaryWrap className={className}>
            <Row alignItems="center">
                {isCoinmarketSellOffers(context) && (
                    <>
                        {receiveCurrency && (
                            <TextWrap>
                                <CoinmarketCryptoAmount
                                    amount={receiveAmount}
                                    cryptoId={receiveCurrency}
                                    displayLogo
                                />
                            </TextWrap>
                        )}
                        <StyledIcon name="arrowRightLong" />
                        <TextWrap>
                            <CoinmarketFiatAmount currency={sendCurrency} />
                        </TextWrap>
                    </>
                )}

                {isCoinmarketExchangeOffers(context) && (
                    <>
                        {sendCurrency && (
                            <TextWrap>
                                <CoinmarketCryptoAmount
                                    amount={sendAmount}
                                    cryptoId={sendCurrency as CryptoId}
                                    displayLogo
                                />
                            </TextWrap>
                        )}
                        <StyledIcon name="arrowRightLong" />
                        {receiveCurrency && (
                            <TextWrap>
                                <CoinmarketCryptoAmount cryptoId={receiveCurrency} displayLogo />
                            </TextWrap>
                        )}
                    </>
                )}
            </Row>
        </SummaryWrap>
    );
};

export default CoinmarketHeaderSummary;
