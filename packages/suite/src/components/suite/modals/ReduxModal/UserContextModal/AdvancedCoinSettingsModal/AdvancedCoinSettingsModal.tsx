import styled from 'styled-components';
import { CoinLogo, variables } from '@trezor/components';
import { Modal, Translation } from 'src/components/suite';
import { networks, NetworkSymbol } from '@suite-common/wallet-config';
import { CustomBackends } from './CustomBackends/CustomBackends';
import { getCoinLabel } from 'src/utils/suite/getCoinLabel';
import { useSelector } from 'src/hooks/suite';

const Section = styled.div`
    display: flex;
    flex-direction: column;
`;

const Heading = styled.div`
    display: flex;
    align-items: center;
    line-height: initial;

    > * + * {
        margin-left: 16px;
    }
`;

const Header = styled.div`
    display: flex;
    flex-direction: column;
`;

const Subheader = styled.span`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

interface AdvancedCoinSettingsModalProps {
    coin: NetworkSymbol;
    onCancel: () => void;
}

export const AdvancedCoinSettingsModal = ({ coin, onCancel }: AdvancedCoinSettingsModalProps) => {
    const blockchain = useSelector(state => state.wallet.blockchain);
    const network = networks[coin];

    const { symbol, name, features, testnet: isTestnet } = network;
    const hasCustomBackend = !!blockchain[symbol].backends.selected;
    const label = getCoinLabel(features, isTestnet, hasCustomBackend);

    return (
        <Modal
            isCancelable
            onCancel={onCancel}
            heading={
                <Heading>
                    <CoinLogo symbol={symbol} />

                    <Header>
                        <span>{name}</span>

                        {label && (
                            <Subheader>
                                <Translation id={label} />
                            </Subheader>
                        )}
                    </Header>
                </Heading>
            }
        >
            <Section>
                <CustomBackends network={network} onCancel={onCancel} />
            </Section>
        </Modal>
    );
};
