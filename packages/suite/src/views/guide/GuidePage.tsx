import React from 'react';
import ReactMarkdown from 'react-markdown';
import styled, { keyframes } from 'styled-components';

import { useSelector } from '@suite-hooks';
import { variables } from '@trezor/components';
import { Header, Content, ViewWrapper } from '@guide-components';
import { Translation } from '@suite-components';
import { useGuideLoadPage } from '@guide-hooks';

const DISPLAY_SLOWLY = keyframes`
    from { opacity: 0.0; }
    to { opacity: 1.0; }
`;

const StyledMarkdown = styled.div`
    animation: ${DISPLAY_SLOWLY} 0.5s ease;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.5;
    padding: 0 0 32px 0;
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
        color: ${props => props.theme.TYPE_DARK_GREY};
        font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    }
    h1 {
        margin: 8px 0 16px;
        font-size: ${variables.FONT_SIZE.BIG};
    }
    h2 {
        margin-bottom: 8px 0 12px;
        font-size: ${variables.FONT_SIZE.NORMAL};
    }
    h3,
    h4,
    h5,
    h6 {
        margin: 4px 0 12px;
        font-size: ${variables.FONT_SIZE.SMALL};
    }
    p,
    ul,
    ol {
        margin: 4px 0 12px;
    }
    ul,
    ol {
        padding: 0 0 0 16px;
    }
    li {
        margin: 0 0 8px;
    }
    a {
        color: ${props => props.theme.TYPE_GREEN};
        &:hover {
            text-decoration: underline;
        }
    }
`;

const GuidePage = () => {
    const { currentNode, language } = useSelector(state => ({
        currentNode: state.guide.currentNode,
        language: state.suite.settings.language,
    }));

    const { markdown, hasError } = useGuideLoadPage(currentNode, language);

    return (
        <ViewWrapper>
            <Header useBreadcrumb />
            <Content>
                {markdown && (
                    <StyledMarkdown>
                        <ReactMarkdown
                            renderers={{
                                link: ({ children, href }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer">
                                        {children}
                                    </a>
                                ),
                            }}
                        >
                            {markdown}
                        </ReactMarkdown>
                    </StyledMarkdown>
                )}
                {hasError && <Translation id="TR_GENERIC_ERROR_TITLE" />}
            </Content>
        </ViewWrapper>
    );
};

export default GuidePage;
