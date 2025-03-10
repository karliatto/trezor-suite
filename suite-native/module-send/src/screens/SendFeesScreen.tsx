import { useSelector } from 'react-redux';

import { SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';
import { VStack } from '@suite-native/atoms';
import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';

import { SendFeesForm } from '../components/SendFeesForm';
import { SendScreen } from '../components/SendScreen';
import { RecipientsSummary } from '../components/RecipientsSummary';
import { AccountBalanceScreenHeader } from '../components/SendScreenSubHeader';

export const SendFeesScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendFees>) => {
    const { accountKey, feeLevels } = params;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return;

    return (
        <SendScreen screenHeader={<AccountBalanceScreenHeader accountKey={accountKey} />}>
            <VStack spacing="extraLarge" flex={1}>
                <RecipientsSummary accountKey={accountKey} />
                <SendFeesForm accountKey={accountKey} feeLevels={feeLevels} />
            </VStack>
        </SendScreen>
    );
};
