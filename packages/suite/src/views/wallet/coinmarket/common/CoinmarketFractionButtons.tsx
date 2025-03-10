import styled from 'styled-components';
import { Button, Row } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { spacingsPx } from '@trezor/theme';

// eslint-disable-next-line local-rules/no-override-ds-component
const SmallButton = styled(Button).attrs(props => ({
    ...props,
    variant: 'tertiary',
    type: 'button',
    size: 'small',
}))`
    margin-right: ${spacingsPx.sm};
`;

interface CoinmarketFractionButtonsProps {
    onFractionClick: (divisor: number) => void;
    onAllClick: () => void;
    disabled?: boolean;
    className?: string;
}

export const CoinmarketFractionButtons = ({
    disabled,
    onFractionClick,
    onAllClick,
}: CoinmarketFractionButtonsProps) => (
    <Row data-testid="@coinmarket/form/fraction-buttons">
        <SmallButton isDisabled={disabled} onClick={() => onFractionClick(4)}>
            1/4
        </SmallButton>
        <SmallButton isDisabled={disabled} onClick={() => onFractionClick(3)}>
            1/3
        </SmallButton>
        <SmallButton isDisabled={disabled} onClick={() => onFractionClick(2)}>
            1/2
        </SmallButton>
        <SmallButton isDisabled={disabled} onClick={() => onAllClick()}>
            <Translation id="TR_FRACTION_BUTTONS_ALL" />
        </SmallButton>
    </Row>
);
