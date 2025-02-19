import React from 'react';

import { VStack, CardDivider } from '@suite-native/atoms';
import { AccountKey } from '@suite-common/wallet-types';

import { AmountInputs } from './AmountInputs';
import { AddressInput } from './AddressInput';

type RecipientInputsProps = {
    index: number;
    accountKey: AccountKey;
};
export const RecipientInputs = ({ index, accountKey }: RecipientInputsProps) => {
    return (
        <VStack spacing="medium">
            <AddressInput index={index} />
            <CardDivider />
            <AmountInputs index={index} accountKey={accountKey} />
        </VStack>
    );
};
