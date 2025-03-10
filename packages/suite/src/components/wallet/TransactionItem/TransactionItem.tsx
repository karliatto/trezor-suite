import { memo, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { AnimatePresence } from 'framer-motion';
import { selectIsPhishingTransaction } from '@suite-common/wallet-core';
import { variables, Button, Card, Link } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { openModal } from 'src/actions/suite/modalActions';
import { formatNetworkAmount, isTestnet, isTxFeePaid } from '@suite-common/wallet-utils';
import { AccountLabels } from 'src/types/suite/metadata';
import { WalletAccountTransaction } from 'src/types/wallet';
import { AccountType, Network } from '@suite-common/wallet-config';
import { TransactionTypeIcon } from './TransactionTypeIcon';
import { TransactionHeading } from './TransactionHeading';
import {
    TransactionTarget,
    TokenTransfer,
    InternalTransfer,
} from './TransactionTarget/TransactionTarget';
import { FeeRow, WithdrawalRow, DepositRow, CoinjoinRow } from './TransactionRow';
import {
    Content,
    Description,
    NextRow,
    TargetsWrapper,
    TimestampWrapper,
    TxTypeIconWrapper,
} from './CommonComponents';
import { useAnchor } from 'src/hooks/suite/useAnchor';
import { AccountTransactionBaseAnchor } from 'src/constants/suite/anchors';
import { anchorOutlineStyles } from 'src/utils/suite/anchor';
import { TransactionTimestamp } from 'src/components/wallet/TransactionTimestamp';
import { SUBPAGE_NAV_HEIGHT } from 'src/constants/suite/layout';
import { BlurWrapper } from './TransactionItemBlurWrapper';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { getInstantStakeType } from 'src/utils/suite/stake';
import { isStakeTypeTx } from '@suite-common/suite-utils';
import { Tooltip } from '@trezor/components';
import { HELP_CENTER_REPLACE_BY_FEE } from '@trezor/urls';

// eslint-disable-next-line local-rules/no-override-ds-component
const Wrapper = styled(Card)<{
    $isPending: boolean;
    $shouldHighlight: boolean;
    $isPhishingTransaction: boolean;
}>`
    opacity: ${({ $isPhishingTransaction }) => $isPhishingTransaction && 0.6};

    ${({ $isPending }) =>
        $isPending &&
        css`
            border-left: 8px solid ${({ theme }) => theme.legacy.TYPE_ORANGE};
            padding-left: 16px;

            @media (max-width: ${variables.SCREEN_SIZE.SM}) {
                padding: 0 8px;
            }
        `}

    /* height of secondary panel and a gap between transactions and graph */
    scroll-margin-top: calc(${SUBPAGE_NAV_HEIGHT} + 115px);

    ${anchorOutlineStyles}
`;

const Body = styled.div`
    display: flex;
    width: 100%;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const ExpandButton = styled(Button)`
    justify-content: flex-start;
    align-self: flex-start;
    margin-top: 8px;
`;

const StyledFeeRow = styled(FeeRow)<{ $noInputsOutputs?: boolean }>`
    margin-top: ${({ $noInputsOutputs }) => ($noInputsOutputs ? '0px' : '20px')};
`;

const DEFAULT_LIMIT = 3;

interface TransactionItemProps {
    transaction: WalletAccountTransaction;
    isPending: boolean;
    isActionDisabled?: boolean; // Used in "chained transactions" transaction detail modal
    accountMetadata?: AccountLabels;
    accountKey: string;
    network: Network;
    accountType: AccountType;
    className?: string;
    disableBumpFee?: boolean;
    index: number;
}

export const TransactionItem = memo(
    ({
        transaction,
        accountKey,
        accountMetadata,
        isActionDisabled,
        isPending,
        network,
        accountType,
        className,
        disableBumpFee,
        index,
    }: TransactionItemProps) => {
        const [limit, setLimit] = useState(0);
        const [txItemIsHovered, setTxItemIsHovered] = useState(false);
        const [nestedItemIsHovered, setNestedItemIsHovered] = useState(false);

        const { descriptor: address, symbol } = useSelector(selectSelectedAccount) || {};

        const networkFeatures = network.accountTypes[accountType]?.features ?? network.features;

        const dispatch = useDispatch();
        const { anchorRef, shouldHighlight } = useAnchor(
            `${AccountTransactionBaseAnchor}/${transaction.txid}`,
        );

        const { type, targets, tokens, internalTransfers, ethereumSpecific } = transaction;

        const txSignature = ethereumSpecific?.parsedData?.methodId;

        const isUnknown = type === 'unknown';

        // Filter out internal transfers that are instant staking transactions
        const filteredInternalTransfers = useMemo(() => {
            return internalTransfers.filter(t => {
                const stakeType = getInstantStakeType(t, address, symbol);

                return stakeType !== 'stake';
            });
        }, [internalTransfers, address, symbol]);

        const isStakingTx: boolean = useMemo(() => isStakeTypeTx(txSignature), [txSignature]);

        const useFiatValues = !isTestnet(transaction.symbol);
        const useSingleRowLayout =
            !isUnknown &&
            !isStakingTx &&
            (targets.length === 1 || transaction.type === 'self') &&
            !tokens.length &&
            !filteredInternalTransfers.length &&
            transaction.cardanoSpecific?.subtype !== 'withdrawal' &&
            transaction.cardanoSpecific?.subtype !== 'stake_registration';

        const noInputsOutputs =
            (!tokens.length && !filteredInternalTransfers.length && !targets.length) ||
            type === 'failed';

        const fee = formatNetworkAmount(transaction.fee, transaction.symbol);
        const showFeeRow = isTxFeePaid(transaction);

        // join together regular targets, internal and token transfers
        const allOutputs: (
            | { type: 'token'; payload: (typeof tokens)[number] }
            | { type: 'internal'; payload: (typeof filteredInternalTransfers)[number] }
            | { type: 'target'; payload: WalletAccountTransaction['targets'][number] }
        )[] = [
            ...targets.map(t => ({ type: 'target' as const, payload: t })),
            ...filteredInternalTransfers.map(t => ({ type: 'internal' as const, payload: t })),
            ...tokens.map(t => ({ type: 'token' as const, payload: t })),
        ];

        const previewTargets = allOutputs.slice(0, DEFAULT_LIMIT);
        const isExpandable = allOutputs.length - DEFAULT_LIMIT > 0;
        const toExpand = allOutputs.length - DEFAULT_LIMIT - limit;

        const openTxDetailsModal = (rbfForm?: boolean) => {
            if (isActionDisabled) return; // open explorer
            dispatch(
                openModal({
                    type: 'transaction-detail',
                    tx: { ...transaction, internalTransfers: filteredInternalTransfers },
                    rbfForm,
                }),
            );
        };
        const isPhishingTransaction = useSelector(state =>
            selectIsPhishingTransaction(state, transaction.txid, accountKey),
        );

        const dataTestBase = `@transaction-item/${index}${
            transaction.deadline ? '/prepending' : ''
        }`;

        const BumpFeeButton = ({ isDisabled }: { isDisabled: boolean }) => (
            <Button
                variant="tertiary"
                onClick={() => openTxDetailsModal(true)}
                isDisabled={isDisabled}
            >
                <Translation id="TR_BUMP_FEE" />
            </Button>
        );

        const DisabledBumpFeeButtonWithTooltip = () => (
            <Tooltip
                content={
                    <div>
                        <Translation
                            id="TR_BUMP_FEE_DISABLED_TOOLTIP"
                            values={{
                                a: chunks => (
                                    <Link
                                        href={HELP_CENTER_REPLACE_BY_FEE}
                                        variant="nostyle"
                                        icon="externalLink"
                                        type="hint"
                                    >
                                        {chunks}
                                    </Link>
                                ),
                            }}
                        />
                    </div>
                }
            >
                <BumpFeeButton isDisabled={true} />
            </Tooltip>
        );

        // we are using slightly different layout for 1 targets txs to better match the design
        // the only difference is that crypto amount is in the same row as tx heading/description
        // fiat amount is in the second row along with address
        // multiple targets txs still use more simple layout
        return (
            <Wrapper
                onMouseEnter={() => setTxItemIsHovered(true)}
                onMouseLeave={() => setTxItemIsHovered(false)}
                $isPending={isPending}
                ref={anchorRef}
                $shouldHighlight={shouldHighlight}
                $isPhishingTransaction={isPhishingTransaction}
                className={className}
            >
                <Body>
                    <TxTypeIconWrapper
                        onMouseEnter={() => setNestedItemIsHovered(true)}
                        onMouseLeave={() => setNestedItemIsHovered(false)}
                        onClick={() => openTxDetailsModal()}
                    >
                        <TransactionTypeIcon type={transaction.type} isPending={isPending} />
                    </TxTypeIconWrapper>

                    <Content>
                        <Description>
                            <TransactionHeading
                                transaction={transaction}
                                isPending={isPending}
                                useSingleRowLayout={useSingleRowLayout}
                                txItemIsHovered={txItemIsHovered}
                                nestedItemIsHovered={nestedItemIsHovered}
                                onClick={() => openTxDetailsModal()}
                                isPhishingTransaction={isPhishingTransaction}
                                dataTestBase={dataTestBase}
                            />
                        </Description>
                        <NextRow>
                            <TimestampWrapper
                                onMouseEnter={() => setNestedItemIsHovered(true)}
                                onMouseLeave={() => setNestedItemIsHovered(false)}
                                onClick={() => openTxDetailsModal()}
                            >
                                <TransactionTimestamp transaction={transaction} />
                            </TimestampWrapper>
                            <TargetsWrapper>
                                {!isUnknown && type !== 'failed' && previewTargets.length ? (
                                    <>
                                        {previewTargets.map((t, i) => (
                                            <BlurWrapper $isBlurred={isPhishingTransaction} key={i}>
                                                {t.type === 'target' && (
                                                    <TransactionTarget
                                                        // render first n targets, n = DEFAULT_LIMIT
                                                        target={t.payload}
                                                        transaction={transaction}
                                                        singleRowLayout={useSingleRowLayout}
                                                        isFirst={i === 0}
                                                        isLast={
                                                            limit > 0
                                                                ? false
                                                                : i === previewTargets.length - 1
                                                        } // if list of targets is expanded we won't get last item here
                                                        accountMetadata={accountMetadata}
                                                        accountKey={accountKey}
                                                        isActionDisabled={isActionDisabled}
                                                        isPhishingTransaction={
                                                            isPhishingTransaction
                                                        }
                                                    />
                                                )}
                                                {t.type === 'token' && (
                                                    <TokenTransfer
                                                        transfer={t.payload}
                                                        transaction={transaction}
                                                        singleRowLayout={useSingleRowLayout}
                                                        isFirst={i === 0}
                                                        isLast={
                                                            limit > 0
                                                                ? false
                                                                : i === previewTargets.length - 1
                                                        }
                                                        isPhishingTransaction={
                                                            isPhishingTransaction
                                                        }
                                                    />
                                                )}
                                                {t.type === 'internal' && (
                                                    <InternalTransfer
                                                        transfer={t.payload}
                                                        transaction={transaction}
                                                        singleRowLayout={useSingleRowLayout}
                                                        isFirst={i === 0}
                                                        isLast={
                                                            limit > 0
                                                                ? false
                                                                : i === previewTargets.length - 1
                                                        }
                                                    />
                                                )}
                                            </BlurWrapper>
                                        ))}
                                        <AnimatePresence initial={false}>
                                            {limit > 0 &&
                                                allOutputs
                                                    .slice(DEFAULT_LIMIT, DEFAULT_LIMIT + limit)
                                                    .map((t, i) => (
                                                        <BlurWrapper
                                                            $isBlurred={isPhishingTransaction}
                                                            key={i}
                                                        >
                                                            {t.type === 'target' && (
                                                                <TransactionTarget
                                                                    target={t.payload}
                                                                    transaction={transaction}
                                                                    useAnimation
                                                                    isLast={
                                                                        // if list is not fully expanded, an index of last is limit (num of currently showed items) - 1,
                                                                        // otherwise the index is calculated as num of all targets - num of targets that are always shown (DEFAULT_LIMIT) - 1
                                                                        allOutputs.length >
                                                                        limit + DEFAULT_LIMIT
                                                                            ? i === limit - 1
                                                                            : i ===
                                                                              allOutputs.length -
                                                                                  DEFAULT_LIMIT -
                                                                                  1
                                                                    }
                                                                    accountMetadata={
                                                                        accountMetadata
                                                                    }
                                                                    accountKey={accountKey}
                                                                    isPhishingTransaction={
                                                                        isPhishingTransaction
                                                                    }
                                                                />
                                                            )}
                                                            {t.type === 'token' && (
                                                                <TokenTransfer
                                                                    transfer={t.payload}
                                                                    transaction={transaction}
                                                                    useAnimation
                                                                    isLast={
                                                                        i ===
                                                                        allOutputs.length -
                                                                            DEFAULT_LIMIT -
                                                                            1
                                                                    }
                                                                    isPhishingTransaction={
                                                                        isPhishingTransaction
                                                                    }
                                                                />
                                                            )}
                                                            {t.type === 'internal' && (
                                                                <InternalTransfer
                                                                    transfer={t.payload}
                                                                    transaction={transaction}
                                                                    useAnimation
                                                                    isLast={
                                                                        i ===
                                                                        allOutputs.length -
                                                                            DEFAULT_LIMIT -
                                                                            1
                                                                    }
                                                                />
                                                            )}
                                                        </BlurWrapper>
                                                    ))}
                                        </AnimatePresence>
                                    </>
                                ) : null}

                                {type === 'joint' && (
                                    <CoinjoinRow
                                        transaction={transaction}
                                        useFiatValues={useFiatValues}
                                    />
                                )}

                                {transaction.cardanoSpecific?.withdrawal && (
                                    <WithdrawalRow
                                        transaction={transaction}
                                        useFiatValues={useFiatValues}
                                        isFirst
                                        isLast
                                    />
                                )}

                                {transaction.cardanoSpecific?.deposit && (
                                    <DepositRow
                                        transaction={transaction}
                                        useFiatValues={useFiatValues}
                                        isFirst
                                        isLast
                                    />
                                )}

                                {showFeeRow && (
                                    <BlurWrapper $isBlurred={isPhishingTransaction}>
                                        <StyledFeeRow
                                            fee={fee}
                                            transaction={transaction}
                                            useFiatValues={useFiatValues}
                                            $noInputsOutputs={noInputsOutputs}
                                            isFirst
                                            isLast
                                        />
                                    </BlurWrapper>
                                )}

                                {isExpandable && (
                                    <ExpandButton
                                        variant="tertiary"
                                        icon={toExpand > 0 ? 'chevronDown' : 'chevronUp'}
                                        iconAlignment="right"
                                        onClick={e => {
                                            setLimit(toExpand > 0 ? limit + 20 : 0);
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                    >
                                        <Translation
                                            id={
                                                toExpand > 0
                                                    ? 'TR_SHOW_MORE_ADDRESSES'
                                                    : 'TR_SHOW_LESS'
                                            }
                                            values={{ count: toExpand }}
                                        />
                                    </ExpandButton>
                                )}
                            </TargetsWrapper>
                        </NextRow>
                        {!isActionDisabled &&
                            transaction.rbfParams &&
                            networkFeatures?.includes('rbf') &&
                            !transaction?.deadline && (
                                <NextRow>
                                    {disableBumpFee ? (
                                        <DisabledBumpFeeButtonWithTooltip />
                                    ) : (
                                        <BumpFeeButton isDisabled={false} />
                                    )}
                                </NextRow>
                            )}
                    </Content>
                </Body>
            </Wrapper>
        );
    },
);
