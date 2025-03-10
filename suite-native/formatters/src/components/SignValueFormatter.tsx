import { Text, TextProps } from '@suite-native/atoms';
import { isSignValuePositive, useFormatters } from '@suite-common/formatters';
import { SignValue } from '@suite-common/suite-types';

import { FormatterProps } from '../types';

type SignValueFormatterProps = FormatterProps<SignValue | undefined> & TextProps;

export const SignValueFormatter = ({ value, ...textProps }: SignValueFormatterProps) => {
    const { SignValueFormatter: Formatter } = useFormatters();

    if (!value) return null;

    const signColor = isSignValuePositive(value) ? 'textSecondaryHighlight' : 'textAlertRed';

    return (
        <Text color={signColor} {...textProps}>
            {/* Trailing whitespace to offset a following value. */}
            <Formatter value={value} />{' '}
        </Text>
    );
};
