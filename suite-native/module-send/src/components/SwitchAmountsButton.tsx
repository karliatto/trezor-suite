import { TouchableOpacity } from 'react-native';

import { Icon } from '@suite-common/icons-deprecated';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Box } from '@suite-native/atoms';

const BUTTON_TOP_OFFSET = 40;
const BUTTON_PADDING = 6;

const buttonWrapperStyle = prepareNativeStyle(() => ({
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    top: BUTTON_TOP_OFFSET,
    zIndex: 3, // To stay above both of the absolute inputs.
}));

const buttonStyle = prepareNativeStyle(utils => ({
    padding: BUTTON_PADDING,
    backgroundColor: utils.colors.backgroundTertiaryDefaultOnElevation1,
    borderColor: utils.colors.borderDashed,
    borderWidth: utils.borders.widths.small,
    borderRadius: utils.borders.radii.round,
}));

export const SwitchAmountsButton = ({ onPress }: { onPress: () => void }) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Box style={applyStyle(buttonWrapperStyle)}>
            <TouchableOpacity style={applyStyle(buttonStyle)} onPress={onPress}>
                <Icon size="mediumLarge" name="arrowsCircle" />
            </TouchableOpacity>
        </Box>
    );
};
