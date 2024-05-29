import styled, { css } from 'styled-components';
import { Card, Dropdown, IconButton, ButtonGroup, Button } from '@trezor/components';
import {
    FiatValue,
    FormattedCryptoAmount,
    PriceTicker,
    Translation,
    TrendTicker,
    TrezorLink,
} from 'src/components/suite';
import { useDispatch, useLayoutSize } from 'src/hooks/suite';
import { spacingsPx, typography } from '@trezor/theme';
import { TokenAddress } from '@suite-common/wallet-types';
import { EventType, analytics } from '@trezor/suite-analytics';
import { goto } from 'src/actions/suite/routerActions';
import { Network } from '@suite-common/wallet-config';
import {
    DefinitionType,
    EnhancedTokenInfo,
    TokenManagementAction,
    tokenDefinitionsActions,
} from '@suite-common/token-definitions';
import { BlurUrls } from './UrlBlur';

const Table = styled(Card)`
    padding-bottom: ${spacingsPx.md};
    word-break: break-all;
`;

const Columns = styled.div`
    display: flex;
    padding: 0 ${spacingsPx.lg};
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};
`;

const ColName = styled.div`
    ${typography.hint}
    margin: ${spacingsPx.md} 0;
    color: ${({ theme }) => theme.textSubdued};
    width: 20%;
`;

const Cell = styled.div<{ $isActions?: boolean; $isBigger?: boolean }>`
    ${typography.hint}
    align-items: center;
    padding: 10px ${spacingsPx.sm} 10px 0;
    width: ${({ $isBigger }) => ($isBigger ? `60%` : '20%')};
    gap: ${spacingsPx.xxs};

    ${({ $isActions }) =>
        $isActions &&
        css`
            display: flex;
            justify-content: flex-end;
            text-align: right;
            width: 20%;
        `}
`;

const Token = styled.div`
    display: flex;
    align-items: center;
    padding: ${spacingsPx.xs} 0;
    border-bottom: 1px solid ${({ theme }) => theme.borderElevation2};
    margin: 0 ${spacingsPx.lg};
    min-height: 81px;

    &:last-child {
        border-bottom: none;
    }
`;

const TokenName = styled.span`
    ${typography.body}
`;

const Amount = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledFiatValue = styled(FiatValue)`
    ${typography.body}
`;

const PriceTickerWrapper = styled.div`
    display: flex;
    justify-content: flex-start;
    width: 100%;
`;

const StyledFormattedCryptoAmount = styled(FormattedCryptoAmount)`
    ${typography.hint}
    color: ${({ theme }) => theme.textSubdued};
`;

const StyledTrezorLink = styled(TrezorLink)`
    ${typography.hint}
`;

const DropdownFooter = styled.div`
    display: flex;
    flex-direction: column;
    border-top: 1px solid ${({ theme }) => theme.borderElevation2};
    padding: ${spacingsPx.xs} ${spacingsPx.sm} 0 ${spacingsPx.sm};
    margin-top: ${spacingsPx.xxs};
`;

const FooterTitle = styled.div`
    ${typography.label};
    color: ${({ theme }) => theme.textSubdued};
`;

const ContractAddress = styled.div`
    ${typography.hint};
    color: ${({ theme }) => theme.textDefault};
    max-width: 175px;
    word-break: break-all;
`;

interface TokenListProps {
    tokens: EnhancedTokenInfo[];
    network: Network;
    tokenStatusType: TokenManagementAction;
    hideRates?: boolean;
}

export const TokenList = ({ tokens, network, tokenStatusType, hideRates }: TokenListProps) => {
    const dispatch = useDispatch();
    const { isMobileLayout } = useLayoutSize();

    const goToWithAnalytics = (...[routeName, options]: Parameters<typeof goto>) => {
        if (network.networkType) {
            analytics.report({
                type: EventType.AccountsActions,
                payload: { symbol: network.symbol, action: routeName },
            });
        }
        dispatch(goto(routeName, options));
    };

    const explorerUrl =
        network.networkType === 'cardano' ? network.explorer.token : network.explorer.account;
    const explorerUrlQueryString = network.explorer.queryString;

    return (
        <Table paddingType="none">
            <Columns>
                <ColName>
                    <Translation id="TR_TOKEN" />
                </ColName>
                <ColName>
                    <Translation id="AMOUNT" />
                </ColName>
                {!hideRates && (
                    <>
                        <ColName>
                            <Translation id="TR_EXCHANGE_RATE" />
                        </ColName>
                        <ColName>
                            <Translation id="TR_7D_CHANGE" />
                        </ColName>
                    </>
                )}
            </Columns>
            {tokens.map(t => (
                <Token key={t.contract}>
                    <Cell>
                        <TokenName>
                            <BlurUrls text={t.name} />
                        </TokenName>
                    </Cell>
                    <Cell $isBigger={hideRates}>
                        <Amount>
                            {!hideRates && (
                                <StyledFiatValue
                                    amount={t.balance || '1'}
                                    symbol={network.symbol}
                                    tokenAddress={t.contract as TokenAddress}
                                    showLoadingSkeleton
                                />
                            )}
                            <StyledFormattedCryptoAmount value={t.balance} symbol={t.symbol} />
                        </Amount>
                    </Cell>
                    {!hideRates && (
                        <>
                            <Cell>
                                <PriceTickerWrapper>
                                    <PriceTicker
                                        symbol={network.symbol}
                                        contractAddress={t.contract as TokenAddress}
                                    />
                                </PriceTickerWrapper>
                            </Cell>
                            <Cell>
                                <TrendTicker
                                    symbol={network.symbol}
                                    contractAddress={t.contract as TokenAddress}
                                />
                            </Cell>
                        </>
                    )}

                    <Cell $isActions>
                        <Dropdown
                            alignMenu="bottom-right"
                            items={[
                                {
                                    key: 'export',
                                    options: [
                                        {
                                            label: <Translation id="TR_NAV_SEND" />,
                                            onClick: () => {
                                                goToWithAnalytics('wallet-send', {
                                                    preserveParams: true,
                                                });
                                            },
                                            isHidden:
                                                tokenStatusType === TokenManagementAction.HIDE
                                                    ? !isMobileLayout
                                                    : true,
                                        },
                                        {
                                            label: <Translation id="TR_NAV_RECEIVE" />,
                                            onClick: () => {
                                                goToWithAnalytics('wallet-receive', {
                                                    preserveParams: true,
                                                });
                                            },
                                            isHidden:
                                                tokenStatusType === TokenManagementAction.HIDE
                                                    ? !isMobileLayout
                                                    : true,
                                        },
                                        {
                                            label: (
                                                <Translation
                                                    id={
                                                        tokenStatusType ===
                                                        TokenManagementAction.SHOW
                                                            ? 'TR_UNHIDE_TOKEN'
                                                            : 'TR_HIDE_TOKEN'
                                                    }
                                                />
                                            ),
                                            onClick: () =>
                                                dispatch(
                                                    tokenDefinitionsActions.setTokenStatus({
                                                        networkSymbol: network.symbol,
                                                        contractAddress: t.contract,
                                                        status: tokenStatusType,
                                                        type: DefinitionType.COIN,
                                                    }),
                                                ),
                                            isHidden:
                                                tokenStatusType === TokenManagementAction.SHOW &&
                                                !isMobileLayout,
                                        },
                                        {
                                            label: (
                                                <StyledTrezorLink
                                                    variant="nostyle"
                                                    href={`${explorerUrl}${t.contract}${explorerUrlQueryString}`}
                                                >
                                                    <Translation id="TR_VIEW_IN_EXPLORER" />
                                                </StyledTrezorLink>
                                            ),
                                        },
                                    ],
                                },
                            ]}
                            footer={
                                <DropdownFooter>
                                    <FooterTitle>
                                        <Translation id="TR_CONTRACT_ADDRESS" />
                                    </FooterTitle>
                                    <ContractAddress>{t.contract}</ContractAddress>
                                </DropdownFooter>
                            }
                        />
                        {!isMobileLayout &&
                            (tokenStatusType === TokenManagementAction.SHOW ? (
                                <Button
                                    icon="EYE_SLASH"
                                    onClick={() =>
                                        dispatch(
                                            tokenDefinitionsActions.setTokenStatus({
                                                networkSymbol: network.symbol,
                                                contractAddress: t.contract,
                                                status: TokenManagementAction.SHOW,
                                                type: DefinitionType.COIN,
                                            }),
                                        )
                                    }
                                    variant="tertiary"
                                    size="small"
                                >
                                    <Translation id="TR_UNHIDE" />
                                </Button>
                            ) : (
                                <ButtonGroup size="small" variant="tertiary">
                                    <IconButton
                                        label={<Translation id="TR_NAV_SEND" />}
                                        key="token-send"
                                        variant="tertiary"
                                        icon="SEND"
                                        onClick={() => {
                                            goToWithAnalytics('wallet-send', {
                                                preserveParams: true,
                                            });
                                        }}
                                    />
                                    <IconButton
                                        label={<Translation id="TR_NAV_RECEIVE" />}
                                        key="token-receive"
                                        variant="tertiary"
                                        icon="RECEIVE"
                                        onClick={() => {
                                            goToWithAnalytics('wallet-receive', {
                                                preserveParams: true,
                                            });
                                        }}
                                    />
                                </ButtonGroup>
                            ))}
                    </Cell>
                </Token>
            ))}
        </Table>
    );
};
