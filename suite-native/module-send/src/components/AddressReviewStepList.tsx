import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import { isRejected } from '@reduxjs/toolkit';
import { useNavigation, useRoute } from '@react-navigation/native';

import {
    SendStackParamList,
    SendStackRoutes,
    StackNavigationProps,
    StackProps,
} from '@suite-native/navigation';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useToast } from '@suite-native/toasts';
import { AccountsRootState, DeviceRootState, SendRootState } from '@suite-common/wallet-core';
import { nativeSpacings } from '@trezor/theme';

import { signTransactionNativeThunk as signTransactionThunk } from '../sendFormThunks';
import { selectIsFirstTransactionAddressConfirmed } from '../selectors';
import { SlidingFooterOverlay } from '../components/SlidingFooterOverlay';
import { AddressReviewStep } from '../components/AddressReviewStep';
import { CompareAddressHelpButton } from '../components/CompareAddressHelpButton';
import { AddressOriginHelpButton } from '../components/AddressOriginHelpButton';

const NUMBER_OF_STEPS = 3;
const OVERLAY_INITIAL_POSITION = 75;
const LIST_VERTICAL_SPACING = nativeSpacings.medium;

type RouteProps = StackProps<SendStackParamList, SendStackRoutes.SendAddressReview>['route'];
type NavigationProps = StackNavigationProps<SendStackParamList, SendStackRoutes.SendAddressReview>;

export const AddressReviewStepList = () => {
    const route = useRoute<RouteProps>();
    const navigation = useNavigation<NavigationProps>();
    const { showToast } = useToast();
    const dispatch = useDispatch();

    const [childHeights, setChildHeights] = useState<number[]>([]);
    const [stepIndex, setStepIndex] = useState(0);

    const areAllStepsDone = stepIndex === NUMBER_OF_STEPS - 1;
    const isLayoutReady = childHeights.length === NUMBER_OF_STEPS;
    const { accountKey, transaction } = route.params;

    const isAddressConfirmed = useSelector(
        (state: AccountsRootState & DeviceRootState & SendRootState) =>
            selectIsFirstTransactionAddressConfirmed(state, accountKey),
    );

    useEffect(() => {
        if (isAddressConfirmed) {
            navigation.navigate(SendStackRoutes.SendOutputsReview, { accountKey });
        }
    }, [isAddressConfirmed, accountKey, navigation]);

    const handleReadItemListHeight = (event: LayoutChangeEvent, index: number) => {
        const { height } = event.nativeEvent.layout;
        setChildHeights(prevHeights => {
            const newHeights = [...prevHeights];
            newHeights[index] = height + LIST_VERTICAL_SPACING;

            return newHeights;
        });
    };

    const handleNextStep = async () => {
        setStepIndex(prevStepIndex => prevStepIndex + 1);

        if (stepIndex === NUMBER_OF_STEPS - 2) {
            const response = await dispatch(
                signTransactionThunk({
                    accountKey,
                    feeLevel: transaction,
                }),
            );

            if (isRejected(response)) {
                // TODO: display error message based on the error code
                showToast({
                    variant: 'error',
                    message: 'Something went wrong',
                    icon: 'closeCircle',
                });

                navigation.popToTop();
            }
        }
    };

    return (
        <>
            <View>
                <VStack spacing={LIST_VERTICAL_SPACING}>
                    <AddressReviewStep
                        stepNumber={1}
                        onLayout={event => handleReadItemListHeight(event, 0)}
                        translationId="moduleSend.review.address.step1"
                        rightIcon={<AddressOriginHelpButton />}
                    />

                    <AddressReviewStep
                        stepNumber={2}
                        onLayout={event => handleReadItemListHeight(event, 1)}
                        translationId="moduleSend.review.address.step2"
                        rightIcon={<CompareAddressHelpButton />}
                    />
                    <AddressReviewStep
                        translationId="moduleSend.review.address.step3"
                        onLayout={event => handleReadItemListHeight(event, 2)}
                    />
                </VStack>
            </View>
            {!areAllStepsDone && (
                <SlidingFooterOverlay
                    isLayoutReady={isLayoutReady}
                    currentStepIndex={stepIndex}
                    stepHeights={childHeights}
                    initialOffset={OVERLAY_INITIAL_POSITION}
                >
                    <Button onPress={handleNextStep}>
                        <Translation id="generic.buttons.next" />
                    </Button>
                </SlidingFooterOverlay>
            )}
        </>
    );
};
