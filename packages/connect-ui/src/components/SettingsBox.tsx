import React from 'react';

import styled from 'styled-components';
import { CollapsibleBox, Icon, colors, variables } from '@trezor/components/src';

const View = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
`;

const WhiteCollapsibleBox = styled(CollapsibleBox)`
    background: ${({ theme }) => theme.BG_WHITE};
    width: 500px;
`;

const TipsContainer = styled.div`
    margin-top: 40px;
`;

const Heading = styled.div`
    display: flex;
`;

const StyledIcon = styled(Icon)`
    width: 40px;
    height: 40px;
    border-radius: 20px;
    background-color: #c4c4c4;
    margin-right: 12px;
`;

const HeadingText = styled.div`
    display: flex;
    align-items: center;
`;

const HeadingH1 = styled.div`
    color: ${colors.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    margin-bottom: 4px;
`;

const StepsList = styled.ul`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
    line-height: 24px;
`;
const Step = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: #545454;
`;

interface SettingsBoxProps {
    trustedHost: boolean;
    version: string;
    bridgeVersion: string;
    debug: boolean;
    manifest: {
        email: string;
        appUrl: string;
    };
}

export const SettingsBox = ({
    trustedHost,
    version,
    bridgeVersion,
    debug,
    manifest,
}: SettingsBoxProps) => {
    console.log('version', version);

    const settingsToDisplay = [
        {
            title: 'Trusted Host',
            value: trustedHost ? 'yes' : 'no',
        },
        {
            title: 'Version',
            value: version,
        },
        {
            title: 'Bridge Version',
            value: bridgeVersion,
        },
        {
            title: 'Debug',

            value: debug ? 'yes' : 'no',
        },
        {
            title: 'Manifest',
            value: JSON.stringify(manifest),
        },
    ];
    return (
        <View>
            <TipsContainer>
                <WhiteCollapsibleBox
                    opened={true}
                    title="Connected Application"
                    variant="large"
                    noContentPadding
                    heading={
                        <Heading>
                            <StyledIcon icon="SEARCH" color="#000" />
                            <HeadingText>
                                <HeadingH1>Settings heading</HeadingH1>
                            </HeadingText>
                        </Heading>
                    }
                >
                    <StepsList>
                        {settingsToDisplay.map(({ title, value }) => (
                            <li key={title}>
                                <Step>
                                    {title}: {value}
                                </Step>
                            </li>
                        ))}
                    </StepsList>
                </WhiteCollapsibleBox>
            </TipsContainer>
        </View>
    );
};
