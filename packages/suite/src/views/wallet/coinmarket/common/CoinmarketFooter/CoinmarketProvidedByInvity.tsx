import styled from 'styled-components';
import { Translation } from 'src/components/suite';
import { INVITY_URL } from '@trezor/urls';
import { variables, Link, Image } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledLink = styled(Link)`
    display: flex;
    flex: 1;
    padding-top: 1px;
    align-items: center;
`;

export const CoinmarketProvidedByInvity = () => (
    <Wrapper>
        <Translation id="TR_BUY_PROVIDED_BY_INVITY" />
        <StyledLink href={INVITY_URL} target="_blank">
            <Image width={70} image="INVITY_LOGO" />
        </StyledLink>
    </Wrapper>
);
