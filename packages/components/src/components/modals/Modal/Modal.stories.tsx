import { Meta, StoryObj } from '@storybook/react';
import { Modal as ModalComponent, Button, ModalProps } from '../../../index';
import { Icon } from '../../Icon/Icon';

const Buttons = () => (
    <>
        <Button variant="primary" size="small">
            Button
        </Button>

        <Button variant="tertiary" size="small">
            Button
        </Button>
    </>
);

const meta: Meta = {
    title: 'Modal',
    component: ModalComponent,
} as Meta;
export default meta;

export const Modal: StoryObj<ModalProps> = {
    args: {
        heading: 'Modal heading',
        description: 'Modal description',
        children: 'Modal content',
        bottomBarComponents: <Buttons />,
        onCancel: () => console.log('close'),
    },
    argTypes: {
        heading: {
            control: 'text',
        },
        preheading: {
            control: 'text',
        },
        subheading: {
            control: 'text',
        },
        description: {
            control: 'text',
        },
        onBackClick: {
            options: ['none', 'withCallback'],
            mapping: { none: undefined, withCallback: () => null },
            control: {
                type: 'select',
                labels: {
                    none: 'none',
                    withCallback: 'with callback',
                },
            },
        },
        headerComponent: {
            options: ['none', 'withComponent'],
            mapping: { none: undefined, withComponent: <Icon name="app" /> },
            control: {
                type: 'select',
                labels: {
                    none: 'none',
                    withComponent: 'with component',
                },
            },
        },
        bottomBarComponents: {
            options: ['none', 'bottomBarComponents'],
            mapping: {
                none: undefined,
                bottomBarComponents: <Buttons />,
            },
            control: {
                type: 'select',
                labels: {
                    none: 'none',
                    bottomBarComponents: 'with bottom bar components',
                },
            },
        },
        className: {
            control: 'none',
        },
        'data-testid': {
            control: 'none',
        },
    },
};
