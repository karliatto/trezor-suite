import { memo } from 'react';
import styled, { useTheme } from 'styled-components';
import { Network } from '@suite-common/wallet-config';
import { Icon, variables, SkeletonRectangle } from '@trezor/components';
import {
    AmountUnitSwitchWrapper,
    CoinBalance,
    FiatValue,
    PriceTicker,
    Translation,
    TrendTicker,
} from 'src/components/suite';
import { isTestnet } from '@suite-common/wallet-utils';
import { goto } from 'src/actions/suite/routerActions';
import { useAccountSearch, useDispatch, useLoadingSkeleton } from 'src/hooks/suite';
import { spacingsPx, typography } from '@trezor/theme';
import { AssetFiatBalance } from '@suite-common/assets';
import { AssetTableRowGrid } from './AssetTableRowGrid';
import { ArrowIcon } from '../ArrowIcon';
import { AssetCoinLogo, AssetCoinLogoSkeleton } from '../AssetCoinLogo';
import { AssetCoinName } from '../AssetCoinName';
import { CoinmarketBuyButton } from '../CoinmarketBuyButton';

const Coin = styled.div`
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
`;

const StyledCol = styled.div<{ $isLastRow?: boolean }>`
    display: flex;
    align-items: center;
    padding: 16px 0;
    border-bottom: ${({ $isLastRow, theme }) =>
        $isLastRow ? 'none' : `1px solid ${theme.borderElevation2}`};
`;

const CoinLogoWrapper = styled(StyledCol)`
    padding-left: 18px;
    text-overflow: ellipsis;
    border: none;

    ${variables.SCREEN_QUERY.MOBILE} {
        grid-column: 1 / 2;
        padding-left: 20px;
        border-bottom: none;
    }

    &:hover {
        ${Coin} {
            text-decoration: underline;
        }
    }
`;

const CoinNameWrapper = styled(StyledCol)`
    ${typography.highlight}
    overflow: hidden;
    text-overflow: ellipsis;

    ${variables.SCREEN_QUERY.MOBILE} {
        grid-column: 1 / 4;
        padding-left: 20px;
        border-bottom: none;
    }
`;

const CoinBalanceContainer = styled.div`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

const FailedCol = styled(StyledCol)`
    color: ${({ theme }) => theme.textAlertRed};
    ${typography.hint}

    ${variables.SCREEN_QUERY.MOBILE} {
        grid-column: 1 / 3;
        margin-left: 20px;
    }
`;

const CryptoBalanceWrapper = styled(StyledCol)`
    flex: 1;
    white-space: nowrap;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: ${spacingsPx.xxxs};

    ${variables.SCREEN_QUERY.MOBILE} {
        grid-column: 1 / 3;
        margin-left: 20px;
    }
`;

const FiatBalanceWrapper = styled.div``;

const ExchangeRateWrapper = styled(StyledCol)`
    font-variant-numeric: tabular-nums;
    justify-content: right;
    padding-right: ${spacingsPx.xxxl};
`;

const ExchangeRateWrapper7Days = styled(StyledCol)`
    font-variant-numeric: tabular-nums;
    padding-right: 0;
`;

const BuyButtonWrapper = styled(StyledCol)`
    justify-content: right;
`;

const StyledArrowIcon = styled(ArrowIcon)`
    margin: 0 ${spacingsPx.md};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const SkeletonRectangleLast = styled(SkeletonRectangle)`
    margin-right: ${spacingsPx.md};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledIcon = styled(Icon)`
    padding-left: 4px;
    padding-bottom: 2px;
`;

interface AssetTableProps {
    network: Network;
    failed: boolean;
    cryptoValue: string;
    isLastRow?: boolean;
    assetsFiatBalances: AssetFiatBalance[];
}

export const AssetRow = memo(
    ({ network, failed, cryptoValue, isLastRow, assetsFiatBalances }: AssetTableProps) => {
        const { symbol } = network;
        const dispatch = useDispatch();
        const theme = useTheme();
        const { setCoinFilter, setSearchString } = useAccountSearch();

        const handleRowClick = () => {
            dispatch(
                goto('wallet-index', {
                    params: {
                        symbol,
                        accountIndex: 0,
                        accountType: 'normal',
                    },
                }),
            );
            // activate coin filter and reset account search string
            setCoinFilter(symbol);
            setSearchString(undefined);
        };

        return (
            <AssetTableRowGrid onClick={handleRowClick}>
                <CoinLogoWrapper>
                    <AssetCoinLogo
                        symbol={network.symbol}
                        assetsFiatBalances={assetsFiatBalances}
                    />
                </CoinLogoWrapper>

                <CoinNameWrapper $isLastRow={isLastRow}>
                    <AssetCoinName network={network} />
                </CoinNameWrapper>

                {!failed ? (
                    <CryptoBalanceWrapper
                        $isLastRow={isLastRow}
                        data-testid={`@asset-card/${symbol}/balance`}
                    >
                        <FiatBalanceWrapper>
                            <FiatValue amount={cryptoValue} symbol={symbol} />
                        </FiatBalanceWrapper>

                        <CoinBalanceContainer>
                            <AmountUnitSwitchWrapper symbol={symbol}>
                                <CoinBalance value={cryptoValue} symbol={symbol} />
                            </AmountUnitSwitchWrapper>
                        </CoinBalanceContainer>
                    </CryptoBalanceWrapper>
                ) : (
                    <FailedCol $isLastRow={isLastRow}>
                        <Translation id="TR_DASHBOARD_ASSET_FAILED" />

                        <StyledIcon
                            name="warningTriangle"
                            color={theme.legacy.TYPE_RED}
                            size={14}
                        />
                    </FailedCol>
                )}
                <ExchangeRateWrapper $isLastRow={isLastRow}>
                    {!isTestnet(symbol) && <PriceTicker symbol={symbol} />}
                </ExchangeRateWrapper>
                <ExchangeRateWrapper7Days $isLastRow={isLastRow}>
                    {!isTestnet(symbol) && <TrendTicker symbol={symbol} />}
                </ExchangeRateWrapper7Days>
                <BuyButtonWrapper $isLastRow={isLastRow}>
                    {!isTestnet(symbol) && (
                        <CoinmarketBuyButton
                            symbol={symbol}
                            data-testid={`@dashboard/assets/table/${symbol}/buy-button`}
                        />
                    )}
                    <StyledArrowIcon size={16} name="arrowRight" color={theme.iconSubdued} />
                </BuyButtonWrapper>
            </AssetTableRowGrid>
        );
    },
);

export const AssetRowSkeleton = (props: { animate?: boolean }) => {
    const { shouldAnimate } = useLoadingSkeleton();

    const animate = props.animate ?? shouldAnimate;

    return (
        <AssetTableRowGrid>
            <CoinLogoWrapper>
                <AssetCoinLogoSkeleton />
            </CoinLogoWrapper>
            <CoinNameWrapper $isLastRow>
                <Coin>
                    <SkeletonRectangle animate={animate} width={150} />
                </Coin>
            </CoinNameWrapper>
            <CryptoBalanceWrapper $isLastRow>
                <SkeletonRectangle animate={animate} width={100} />
            </CryptoBalanceWrapper>

            <ExchangeRateWrapper $isLastRow>
                <SkeletonRectangle animate={animate} />
            </ExchangeRateWrapper>
            <ExchangeRateWrapper $isLastRow>
                <SkeletonRectangle animate={animate} width={50} />
            </ExchangeRateWrapper>
            <BuyButtonWrapper $isLastRow>
                <SkeletonRectangleLast animate={animate} width={58} height={38} borderRadius={19} />
            </BuyButtonWrapper>
        </AssetTableRowGrid>
    );
};
