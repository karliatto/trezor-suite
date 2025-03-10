import {
    useEffect,
    useState,
    useCallback,
    useRef,
    FunctionComponent,
    PropsWithChildren,
} from 'react';

import styled, { useTheme } from 'styled-components';
import { Icon } from '@trezor/components';
import { AutoScalingInput } from '@trezor/components/src/components/AutoScalingInput/AutoScalingInput';

const IconWrapper = styled.div<{ $bgColor: string }>`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: ${({ $bgColor }) => $bgColor};
    border-radius: 4px;
    margin: 0 3px;
    padding: 4px;
`;

const IconListWrapper = styled.div`
    display: flex;
    margin: 0 0 0 10px;
`;

// To inherit everything so the input looks like the text we want to edit
// However, we need to reset some properties: for example margin and padding to not duplicate spacings
// eslint-disable-next-line local-rules/no-override-ds-component
const Editable = styled(AutoScalingInput)`
    all: inherit;
    margin: 0;
    padding: 0;
    border: 0 solid;
    border-radius: 0;
    cursor: text;
`;

interface WithEditableProps {
    originalValue?: string;
    onSubmit: (value: string | undefined) => void;
    onBlur: () => void;
    updateFlag?: any;
}

/**
 * Takes component in parameter and wraps it with content-editable necessities. Renders contenteditable div as it's child
 * and control buttons (submit, cancel).
 */
export const withEditable =
    (WrappedComponent: FunctionComponent<PropsWithChildren>) =>
    ({ onSubmit, onBlur, originalValue, updateFlag, ...props }: WithEditableProps) => {
        const [touched, setTouched] = useState(false);
        const [value, setValue] = useState('');

        const theme = useTheme();
        const divRef = useRef<HTMLInputElement>(null);

        const submit = useCallback(
            (value?: string | null) => {
                const trimmedValue = (value ?? '').trim();

                if (originalValue && trimmedValue === originalValue.trim()) {
                    return onBlur();
                }

                onSubmit(trimmedValue);
                onBlur();
            },
            [originalValue, onSubmit, onBlur],
        );

        useEffect(() => {
            if (!divRef?.current || touched) {
                return;
            }

            if (originalValue) {
                setValue(originalValue);
            }
        }, [originalValue, divRef, touched, setValue]);

        useEffect(() => {
            if (!touched) {
                divRef.current?.select();
            }
        }, [value, touched]);

        return (
            <>
                <WrappedComponent {...props}>
                    <Editable
                        minWidth={20}
                        ref={divRef}
                        data-testid="@metadata/input"
                        value={value}
                        // onBlur={onBlur}
                        onChange={event => {
                            setTouched(true);
                            setValue(event.target.value);
                        }}
                        onKeyDown={event => {
                            if (event.key === 'Enter') {
                                submit(value);
                            }
                            if (event.key === 'Escape') {
                                onBlur();
                            }
                        }}
                        updateFlag={updateFlag}
                    />
                </WrappedComponent>

                <IconListWrapper>
                    <IconWrapper $bgColor={theme.legacy.BG_LIGHT_GREEN}>
                        <Icon
                            cursorPointer
                            size={14}
                            data-testid="@metadata/submit"
                            name="check"
                            onClick={e => {
                                e.stopPropagation();
                                submit(value);
                            }}
                            color={theme.legacy.TYPE_GREEN}
                        />
                    </IconWrapper>

                    <IconWrapper $bgColor={theme.legacy.BG_GREY}>
                        <Icon
                            cursorPointer
                            size={14}
                            data-testid="@metadata/cancel"
                            name="close"
                            onClick={e => {
                                e.stopPropagation();
                                onBlur();
                            }}
                            color={theme.legacy.TYPE_DARK_GREY}
                        />
                    </IconWrapper>
                </IconListWrapper>
            </>
        );
    };
