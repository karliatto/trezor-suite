import React from 'react';
import styled from 'styled-components';
import { AccountInfo, AccountAddress } from 'trezor-connect';
import { Translation, HiddenPlaceholder } from '@suite-components';
import { variables, Select } from '@trezor/components';
import { UseFormMethods } from 'react-hook-form';
import { useCoinmarketExchangeOffersContext } from '@wallet-hooks/useCoinmarketExchangeOffers';

const AddressWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const PathWrapper = styled.div`
    padding: 0 0 0 3px;
`;

const Amount = styled.div`
    display: flex;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Address = styled.div`
    display: flex;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const Option = styled.div`
    display: flex;
    align-items: center;
`;

const UpperCase = styled.div`
    text-transform: uppercase;
    padding: 0 3px;
`;

const buildOptions = (addresses: AccountInfo['addresses']) => {
    if (!addresses) return null;

    interface Options {
        label: React.ReactElement;
        options: AccountAddress[];
    }

    const unused: Options = {
        label: <Translation id="RECEIVE_TABLE_NOT_USED" />,
        options: addresses.unused,
    };

    const used: Options = {
        label: <Translation id="RECEIVE_TABLE_USED" />,
        options: addresses.used,
    };

    return [unused, used];
};

type FormState = {
    address?: string;
};

type Props = Pick<UseFormMethods<FormState>, 'setValue'> & {
    addresses: AccountInfo['addresses'];
    selectedAddress?: string;
};
const AddressOptions = (props: Props) => {
    const { receiveSymbol } = useCoinmarketExchangeOffersContext();

    const { addresses, selectedAddress, setValue } = props;

    const onChangeAccount = (accountAddress: AccountAddress) => {
        setValue('address', accountAddress.address, { shouldValidate: true });
    };

    return (
        <Select
            onChange={(selected: AccountAddress) => {
                onChangeAccount(selected);
            }}
            noTopLabel
            value={
                addresses?.unused.find(a => a.address === selectedAddress) ||
                addresses?.used.find(a => a.address === selectedAddress)
            }
            isClearable={false}
            options={buildOptions(addresses)}
            minWidth="70px"
            formatOptionLabel={(option: AccountAddress) => {
                if (!option.address) return null;
                return (
                    <Option>
                        <AddressWrapper>
                            <Address>{option.address}</Address>
                            <Amount>
                                <HiddenPlaceholder>{option.balance || '0'}</HiddenPlaceholder>{' '}
                                <UpperCase>{receiveSymbol}</UpperCase> •
                                <PathWrapper>{option.path}</PathWrapper>
                            </Amount>
                        </AddressWrapper>
                    </Option>
                );
            }}
        />
    );
};

export default AddressOptions;
