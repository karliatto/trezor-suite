import { memo, useState } from 'react';

import styled, { useTheme } from 'styled-components';
import { ComposedChart, Tooltip, Bar, YAxis, XAxis, Line, CartesianGrid, Cell } from 'recharts';

import { Icon, variables } from '@trezor/components';
import { zIndices } from '@trezor/theme';

import { useGraph } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import {
    GraphRange,
    AggregatedAccountHistory,
    AggregatedDashboardHistory,
} from 'src/types/wallet/graph';
import { calcYDomain, calcFakeGraphDataForTimestamps, calcXDomain } from 'src/utils/wallet/graph';
import { GraphSkeleton, GraphRangeSelector } from 'src/components/suite';

import { GraphResponsiveContainer } from './GraphResponsiveContainer';
import { GraphXAxisTick } from './GraphXAxisTick';
import { GraphYAxisTick } from './GraphYAxisTick';
import { GraphBar } from './GraphBar';
import { GraphTooltipDashboard } from './GraphTooltipDashboard';
import { GraphTooltipAccount } from './GraphTooltipAccount';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    font-size: ${variables.FONT_SIZE.TINY};
    white-space: nowrap;

    /* little hack to remove first and last horizontal line from cartesian grid (lines that wrap the area of the chart) */
    .recharts-wrapper .recharts-cartesian-grid-horizontal line:first-child,
    .recharts-wrapper .recharts-cartesian-grid-horizontal line:last-child {
        stroke-opacity: 0;
    }

    /* hides circle dot in case only one month is displayed */
    .recharts-dot.recharts-line-dot {
        display: none;
    }
`;

const Toolbar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const Description = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    flex: 1;
`;

interface CommonProps {
    isLoading?: boolean;
    selectedRange: GraphRange;
    xTicks: number[];
    localCurrency: string;
    minMaxValues: [number, number];
    hideToolbar?: boolean;
    onRefresh?: () => void;
}

export interface CryptoGraphProps extends CommonProps {
    variant: 'one-asset';
    account: Account;
    data: AggregatedAccountHistory[];
    receivedValueFn: (data: AggregatedAccountHistory) => string | undefined;
    sentValueFn: (data: AggregatedAccountHistory) => string | undefined;
    balanceValueFn: (data: AggregatedAccountHistory) => string | undefined;
}

export interface FiatGraphProps extends CommonProps {
    variant: 'all-assets';
    data: AggregatedDashboardHistory[];
    receivedValueFn: (data: AggregatedDashboardHistory) => string | undefined;
    sentValueFn: (data: AggregatedDashboardHistory) => string | undefined;
    balanceValueFn: (data: AggregatedDashboardHistory) => string | undefined;
    account?: never;
}

export type TransactionsGraphProps = CryptoGraphProps | FiatGraphProps;

export const TransactionsGraph = memo(
    ({
        account,
        balanceValueFn,
        data,
        hideToolbar,
        isLoading,
        localCurrency,
        minMaxValues,
        onRefresh,
        receivedValueFn,
        selectedRange,
        sentValueFn,
        variant,
        xTicks,
    }: TransactionsGraphProps) => {
        const [maxYTickWidth, setMaxYTickWidth] = useState(20);

        const theme = useTheme();
        const { selectedView } = useGraph();
        const yDomain = calcYDomain(
            variant === 'all-assets' ? 'fiat' : 'crypto',
            selectedView,
            minMaxValues,
            account?.formattedBalance,
        );

        const setWidth = (n: number) => {
            setMaxYTickWidth(prevValue => (prevValue > n ? prevValue : n));
        };

        const rightMargin = Math.max(0, maxYTickWidth - 50) + 10; // 50 is the default spacing

        // calculate fake data for full interval (eg. 1 year) even for ticks/timestamps without txs
        const extendedDataForInterval =
            variant === 'one-asset'
                ? calcFakeGraphDataForTimestamps(xTicks, data, account.formattedBalance)
                : calcFakeGraphDataForTimestamps(xTicks, data);

        const hoveredIndex = -1;
        const [hovered, setHovered] = useState(hoveredIndex);
        const isBarColored = (index: number) => [-1, index].includes(hovered);

        const tooltipContentProps = {
            selectedRange,
            localCurrency,
            extendedDataForInterval,
            onShow: (index: number) => setHovered(index),
        };

        return (
            <Wrapper>
                {!hideToolbar && (
                    <Toolbar>
                        <GraphRangeSelector align="bottom-right" />
                        {onRefresh && <Icon size={14} name="refresh" onClick={onRefresh} />}
                    </Toolbar>
                )}
                <Description>
                    {isLoading && <GraphSkeleton animate />}

                    {!isLoading && data && (
                        <GraphResponsiveContainer height="100%" width="100%">
                            <ComposedChart
                                data={extendedDataForInterval}
                                barGap={0}
                                // stackOffset="sign"
                                margin={{
                                    top: 10,
                                    bottom: 30,
                                    right: rightMargin,
                                    left: 20,
                                }}
                                onMouseLeave={() => setHovered(-1)}
                            >
                                <CartesianGrid
                                    vertical={false}
                                    stroke={theme.legacy.STROKE_LIGHT_GREY}
                                />

                                <XAxis
                                    // xAxisId="primary"
                                    dataKey="time"
                                    type="number"
                                    domain={calcXDomain(xTicks, data, selectedRange)}
                                    // width={10}
                                    stroke={theme.legacy.STROKE_LIGHT_GREY}
                                    interval="preserveEnd"
                                    tick={<GraphXAxisTick selectedRange={selectedRange} />}
                                    ticks={xTicks}
                                    tickLine={false}
                                    onMouseEnter={() => setHovered(-1)}
                                />

                                <YAxis
                                    type="number"
                                    orientation="right"
                                    scale={selectedView}
                                    domain={yDomain}
                                    allowDataOverflow={selectedView === 'log'}
                                    stroke="transparent"
                                    tick={
                                        variant === 'one-asset' ? (
                                            <GraphYAxisTick
                                                symbol={account.symbol}
                                                setWidth={setWidth}
                                            />
                                        ) : (
                                            <GraphYAxisTick
                                                localCurrency={localCurrency}
                                                setWidth={setWidth}
                                            />
                                        )
                                    }
                                    onMouseEnter={() => setHovered(-1)}
                                />
                                <Tooltip
                                    position={{ y: 0, x: 0 }}
                                    wrapperStyle={{ zIndex: zIndices.tooltip }}
                                    cursor={{ stroke: theme.legacy.BG_TOOLTIP, strokeWidth: 1 }}
                                    content={
                                        variant === 'one-asset' ? (
                                            <GraphTooltipAccount
                                                symbol={account.symbol}
                                                sentValueFn={sentValueFn}
                                                receivedValueFn={receivedValueFn}
                                                balanceValueFn={balanceValueFn}
                                                {...tooltipContentProps}
                                            />
                                        ) : (
                                            <GraphTooltipDashboard
                                                sentValueFn={sentValueFn}
                                                receivedValueFn={receivedValueFn}
                                                {...tooltipContentProps}
                                            />
                                        )
                                    }
                                />

                                {variant === 'one-asset' && (
                                    <Line
                                        type="linear"
                                        dataKey={(data: any) =>
                                            selectedView === 'log'
                                                ? Number(balanceValueFn(data)) || yDomain[0]
                                                : Number(balanceValueFn(data))
                                        }
                                        stroke={theme.legacy.TYPE_ORANGE}
                                        dot={false}
                                        activeDot={false}
                                    />
                                )}
                                <defs>
                                    <linearGradient
                                        id="greenGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="100%"
                                        spreadMethod="reflect"
                                    >
                                        <stop
                                            offset="0"
                                            stopColor={theme.legacy.GRADIENT_GREEN_START}
                                        />
                                        <stop
                                            offset="1"
                                            stopColor={theme.legacy.GRADIENT_GREEN_END}
                                        />
                                    </linearGradient>
                                </defs>
                                <defs>
                                    <linearGradient
                                        id="redGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="100%"
                                        spreadMethod="reflect"
                                    >
                                        <stop
                                            offset="0"
                                            stopColor={theme.legacy.GRADIENT_RED_START}
                                        />
                                        <stop
                                            offset="1"
                                            stopColor={theme.legacy.GRADIENT_RED_END}
                                        />
                                    </linearGradient>
                                </defs>
                                <defs>
                                    <filter id="shadow" x="-2" y="-10" width="50" height="50">
                                        <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                                        <feOffset dx="0" dy="-5" result="offsetblur" />
                                        <feFlood floodColor="rgb(0,0,0)" floodOpacity="0.1" />
                                        <feComposite in2="offsetblur" operator="in" />
                                        <feMerge>
                                            <feMergeNode in="offsetBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <Bar
                                    dataKey={(data: any) => Number(receivedValueFn(data) ?? 0)}
                                    barSize={selectedRange.label === 'all' ? 8 : 16}
                                    shape={<GraphBar variant="received" />}
                                >
                                    {extendedDataForInterval.map((entry, index) => (
                                        <Cell
                                            key={`cell-${entry}`}
                                            filter={isBarColored(index) ? 'url(#shadow)' : ''}
                                            fill={
                                                isBarColored(index)
                                                    ? 'url(#greenGradient)'
                                                    : '#aeaeae'
                                            }
                                        />
                                    ))}
                                </Bar>
                                <Bar
                                    dataKey={(data: any) => Number(sentValueFn(data) ?? 0)}
                                    barSize={selectedRange.label === 'all' ? 8 : 16}
                                    shape={<GraphBar variant="sent" />}
                                >
                                    {extendedDataForInterval.map((entry, index) => (
                                        <Cell
                                            key={`cell-${entry}`}
                                            filter={isBarColored(index) ? 'url(#shadow)' : ''}
                                            fill={
                                                isBarColored(index)
                                                    ? 'url(#redGradient)'
                                                    : '#dfdfdf'
                                            }
                                        />
                                    ))}
                                </Bar>
                            </ComposedChart>
                        </GraphResponsiveContainer>
                    )}
                </Description>
            </Wrapper>
        );
    },
);
