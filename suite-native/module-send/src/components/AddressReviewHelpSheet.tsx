import { ReactNode } from 'react';
import { TouchableOpacity } from 'react-native';

import { Icon } from '@suite-common/icons-deprecated';
import { Translation } from '@suite-native/intl';
import { useAlert } from '@suite-native/alerts';

type AddressReviewHelpSheetProps = {
    body: ReactNode;
    title?: ReactNode;
    subtitle?: ReactNode;
};

export const AddressReviewHelpSheet = ({ body, title, subtitle }: AddressReviewHelpSheetProps) => {
    const { showAlert } = useAlert();

    const handleOpen = () =>
        showAlert({
            title,
            description: subtitle,
            appendix: body,
            textAlign: 'left',
            pictogramVariant: 'red',
            primaryButtonTitle: <Translation id="generic.buttons.gotIt" />,
            titleSpacing: 'extraSmall',
        });

    return (
        <TouchableOpacity onPress={handleOpen}>
            <Icon name="questionLight" size="large" color="iconSubdued" />
        </TouchableOpacity>
    );
};
