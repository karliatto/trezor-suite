import styled from 'styled-components';

import { setFlag } from 'src/actions/suite/suiteActions';
import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { SettingsAnchor } from 'src/constants/suite/anchors';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { Button, Banner } from '@trezor/components';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { typography } from '@trezor/theme';

const InlineButtonWrapper = styled.div`
    display: inline-block;
`;

const Description = styled.div`
    ${typography.hint};
    color: ${({ theme }) => theme.textSubdued};
`;

const FirmwareTypeSuggestionDescription = () => {
    const dispatch = useDispatch();
    const { device } = useDevice();

    const translationId = hasBitcoinOnlyFirmware(device)
        ? 'TR_SETTINGS_COINS_REGULAR_FIRMWARE_SUGGESTION'
        : 'TR_SETTINGS_COINS_BITCOIN_ONLY_FIRMWARE_SUGGESTION';

    const goToFirmwareType = () =>
        dispatch(goto('settings-device', { anchor: SettingsAnchor.FirmwareType }));

    return (
        <Description>
            <Translation
                id={translationId}
                values={{
                    button: chunks => (
                        <InlineButtonWrapper>
                            <Button
                                margin={{ left: 2, right: 2 }}
                                variant="info"
                                size="tiny"
                                onClick={goToFirmwareType}
                            >
                                {chunks}
                            </Button>
                        </InlineButtonWrapper>
                    ),
                    bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                    regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
                }}
            />
        </Description>
    );
};

export const FirmwareTypeSuggestion = () => {
    const dispatch = useDispatch();

    const handleClose = () => dispatch(setFlag('firmwareTypeBannerClosed', true));

    return (
        <Banner
            variant="info"
            icon
            margin={{ bottom: 20 }}
            rightContent={
                <Banner.Button onClick={handleClose}>
                    <Translation id="TR_GOT_IT" />
                </Banner.Button>
            }
        >
            <FirmwareTypeSuggestionDescription />
        </Banner>
    );
};
