import React, { useCallback } from 'react';

import { Button } from '@trezor/components';
import { Translation, Modal } from '@suite-components';
import { Row, Divider } from './styles';

interface Props {
    hideWindow: () => void;
    enabled: boolean;
}

const EarlyAccess = ({ hideWindow, enabled }: Props) => {
    const allowPrerelease = useCallback(
        (value?: boolean) => window.desktopApi?.allowPrerelease(value),
        [],
    );

    return (
        <Modal heading={<Translation id="TR_EARLY_ACCESS" />} cancelable onCancel={hideWindow}>
            <Divider />

            <Row>
                <Button onClick={() => allowPrerelease(!enabled)} variant="secondary" fullWidth>
                    <Translation
                        id={enabled ? 'TR_EARLY_ACCESS_DISABLE' : 'TR_EARLY_ACCESS_ENABLE'}
                    />
                </Button>
            </Row>
        </Modal>
    );
};

export default EarlyAccess;
