import React, { useEffect, useState } from 'react';
import styled, { ThemeProvider } from 'styled-components';
import { createRoot } from 'react-dom/client';

import { Button, THEME } from '@trezor/components';
import { ErrorBoundary } from '@trezor/connect-ui/src/support/ErrorBoundary';
import { GlobalStyle } from '@trezor/connect-ui/src/support/GlobalStyle';
import { InfoPanel } from '@trezor/connect-ui/src/components/InfoPanel';
import { SettingsBox } from '@trezor/connect-ui/src/components/SettingsBox';

interface ReactWrapperProps {
    children: React.ReactNode;
}

const MAX_ENTRIES = 1000;

const ThemeWrapper = ({ children }: ReactWrapperProps) => (
    <ThemeProvider theme={THEME.light}>{children}</ThemeProvider>
);

const Layout = styled.div`
    display: flex;
    flex: 1;
    height: 100%;

    @media (max-width: 639px) {
        flex-direction: column;
    }
`;

const DebugCenterWrapper = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
`;

const DownloadButton = ({ array, filename }: { array: any[]; filename: string }) => {
    const downloadArrayAsFile = () => {
        const data = JSON.stringify(array, null, 2);
        const blob = new Blob([data], { type: 'application/json' });

        // Temporary anchor element.
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);

        // Programmatically trigger a click event on the anchor element.
        a.click();

        // Remove the anchor element from the document body.
        document.body.removeChild(a);

        URL.revokeObjectURL(a.href);
    };

    return (
        <Button data-test="@log-container/download-button" onClick={downloadArrayAsFile}>
            Download Logs
        </Button>
    );
};

const logInConsole = (logs: any[]) => {
    logs.forEach(log => {
        const { prefix, css, message } = log;
        console.log(`%c${prefix}`, css, ...message);
    });
};

const useLogWorker = (setLogs: React.Dispatch<React.SetStateAction<any[]>>) => {
    const logWorker = new SharedWorker('./workers/shared-logger-worker.js');
    useEffect(() => {
        logWorker.port.onmessage = function (event) {
            const { data } = event;
            switch (data.type) {
                case 'get-logs':
                    logInConsole(data.payload);
                    setLogs(data.payload);
                    break;
                case 'log-entry':
                    logInConsole([data.payload]);
                    setLogs(prevLogs => {
                        if (prevLogs.length > MAX_ENTRIES) {
                            prevLogs.shift();
                        }
                        return [...prevLogs, data.payload];
                    });
                    break;
                default:
            }
        };

        logWorker.port.postMessage({ type: 'get-logs' });
        logWorker.port.postMessage({ type: 'subscribe' });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return logWorker;
};

const DebugCenter = () => {
    const [logs, setLogs] = useState<any[]>([]);
    useLogWorker(setLogs);

    const settings = logs.find(log => {
        const itIs = log.prefix === 'IFrame' && log?.message[1]?.type === 'popup-handshake';
        if (itIs) {
            const { settings } = log.message[1].payload;
            return settings;
        }
        return null;
    })?.message[1]?.payload?.settings;

    console.log('settings', settings);

    return (
        <>
            {logs.length > 0 ? (
                <>
                    <DownloadButton array={logs} filename="trezor-connect-logs.json" />
                    <div>connected applications:</div>
                    {settings ? <SettingsBox {...settings} /> : null}
                    {/* {settings ? (
                        <ul>
                            <li>trusted: {settings.trustedHost ? 'yes' : 'no'}</li>
                            <li>version: {settings.version}</li>
                            <li>bridge version: {settings.bridgeVersion}</li>
                            <li>debug: {settings.debug ? 'yes' : 'no'}</li>
                            <li>manifest {JSON.stringify(settings.manifest)}</li>
                        </ul>
                    ) : null} */}
                </>
            ) : (
                <p>Waiting for an app to connect</p>
            )}
        </>
    );
};

const App = () => (
    <ErrorBoundary>
        <GlobalStyle />
        <ThemeWrapper>
            <Layout>
                <InfoPanel method="Trezor Debug Center" origin={window.origin} />
                <DebugCenterWrapper>
                    <DebugCenter />
                </DebugCenterWrapper>
            </Layout>
        </ThemeWrapper>
    </ErrorBoundary>
);

const renderUI = () => {
    const debugReact = document.getElementById('debug-react');
    debugReact!.style.height = '100%';
    const root = createRoot(debugReact!);
    const Component = <App />;

    root.render(Component);
};

renderUI();
