import { forwardRef, useCallback, useEffect, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';

import { useSetAtom } from 'jotai';

import { useGraphForAllDeviceAccounts, Graph, TimeSwitch } from '@suite-native/graph';
import { selectFiatCurrencyCode } from '@suite-native/settings';
import { VStack } from '@suite-native/atoms';
import { useIsDiscoveryDurationTooLong } from '@suite-native/discovery';

import { PortfolioGraphHeader } from './PortfolioGraphHeader';
import { referencePointAtom, selectedPointAtom } from '../portfolioGraphAtoms';

export type PortfolioGraphRef = {
    refetchGraph: () => Promise<void>;
};

export const PortfolioGraph = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const fiatCurrencyCode = useSelector(selectFiatCurrencyCode);
    const loadingTakesLongerThanExpected = useIsDiscoveryDurationTooLong();

    const {
        graphPoints,
        error,
        isLoading,
        isAnyMainnetAccountPresent,
        refetch,
        onSelectTimeFrame,
        timeframe,
    } = useGraphForAllDeviceAccounts({
        fiatCurrency: fiatCurrencyCode,
    });

    const setSelectedPoint = useSetAtom(selectedPointAtom);
    const setReferencePoint = useSetAtom(referencePointAtom);

    const lastPoint = graphPoints[graphPoints.length - 1];
    const firstPoint = graphPoints[0];

    const setInitialSelectedPoints = useCallback(() => {
        if (lastPoint && firstPoint) {
            setSelectedPoint(lastPoint);
            setReferencePoint(firstPoint);
        }
    }, [lastPoint, firstPoint, setSelectedPoint, setReferencePoint]);

    useEffect(setInitialSelectedPoints, [setInitialSelectedPoints]);

    useImperativeHandle(
        ref,
        () => ({
            refetchGraph: refetch,
        }),
        [refetch],
    );

    return (
        <VStack spacing="large" testID="@home/portfolio/graph">
            {isAnyMainnetAccountPresent ? <PortfolioGraphHeader /> : null}
            <Graph
                points={graphPoints}
                loading={isLoading}
                loadingTakesLongerThanExpected={loadingTakesLongerThanExpected}
                onPointSelected={setSelectedPoint}
                onGestureEnd={setInitialSelectedPoints}
                onTryAgain={refetch}
                error={error}
            />
            <TimeSwitch selectedTimeFrame={timeframe} onSelectTimeFrame={onSelectTimeFrame} />
        </VStack>
    );
});
