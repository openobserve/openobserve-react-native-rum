/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('react-native-code-push', () => ({
    getUpdateMetadata: jest.fn()
}));

jest.mock('@openobserve/mobile-react-native', () => {
    const actualPackage = jest.requireActual('@openobserve/mobile-react-native');
    actualPackage.OoSdkReactNative.initialize = jest.fn();
    actualPackage.OoSdkReactNative._enableFeaturesFromOpenObserveProvider = jest.fn();
    actualPackage.OoSdkReactNative._enableFeaturesFromOpenObserveProviderAsync = jest.fn();
    actualPackage.OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync = jest.fn();
    actualPackage.OoSdkReactNative._initializeFromOpenObserveProvider = jest.fn();
    return actualPackage;
});

const flushPromises = () =>
    new Promise(jest.requireActual('timers').setImmediate);

const createCodepushPackageMock = (label: string | null) => ({
    label,
    isMandatory: false,
    install: jest.fn(),
    appVersion: '1.0.0',
    deploymentKey: '1',
    description: '1',
    failedInstall: false,
    isFirstRun: false,
    isPending: false,
    packageHash: '1',
    packageSize: 42
});

describe('AppCenter Codepush integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        const _globalThis = (globalThis as unknown) as Record<
            PropertyKey,
            unknown
        >;
        const providerState = _globalThis[
            Symbol.for('com.openobserve.reactnative.rum.datadog_provider_state')
        ] as
            | {
                  _reset: () => void;
              }
            | undefined;
        providerState?._reset();
    });

    describe('initialize', () => {
        it('initializes the SDK with the correct version when using a CodePush bundle', async () => {
            const codePush = require('react-native-code-push');
            const { OpenObserveCodepush } = require('..');
            const {
                CoreConfiguration,
                RumConfiguration,
                OoSdkReactNative
            } = require('@openobserve/mobile-react-native');

            (codePush.getUpdateMetadata as jest.MockedFunction<
                typeof codePush.getUpdateMetadata
            >).mockResolvedValueOnce(createCodepushPackageMock('v3'));

            const configuration = new CoreConfiguration('token', 'env');
            configuration.rumConfiguration = new RumConfiguration(
                'appId',
                true,
                true,
                true
            );

            await OpenObserveCodepush.initialize(configuration);

            expect(OoSdkReactNative.initialize).toHaveBeenCalledTimes(1);
            expect(OoSdkReactNative.initialize).toHaveBeenCalledWith(
                expect.objectContaining({ versionSuffix: 'codepush.v3' })
            );
        });

        it('initializes the SDK with the correct version when not using a CodePush bundle', async () => {
            const codePush = require('react-native-code-push');
            const { OpenObserveCodepush } = require('..');
            const {
                CoreConfiguration,
                RumConfiguration,
                OoSdkReactNative
            } = require('@openobserve/mobile-react-native');

            (codePush.getUpdateMetadata as jest.MockedFunction<
                typeof codePush.getUpdateMetadata
            >).mockResolvedValueOnce(null);

            const configuration = new CoreConfiguration('token', 'env');
            configuration.rumConfiguration = new RumConfiguration(
                'appId',
                true,
                true,
                true
            );

            await OpenObserveCodepush.initialize(configuration);

            expect(OoSdkReactNative.initialize).toHaveBeenCalledTimes(1);
            expect(
                Object.keys(
                    (OoSdkReactNative.initialize as jest.MockedFunction<
                        typeof OoSdkReactNative.initialize
                    >).mock.calls[0]
                )
            ).not.toContain('versionSuffix');
        });
    });

    describe('OpenObserveCodepushProvider', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            jest.resetModules();
        });

        it('initializes the sdk with the right codepush version when using OpenObserveProviderConfiguration', async () => {
            const codePush = require('react-native-code-push');
            const { OpenObserveCodepushProvider } = require('..');
            const {
                OpenObserveProviderConfiguration,
                RumConfiguration,
                OoSdkReactNative
            } = require('@openobserve/mobile-react-native');

            (codePush.getUpdateMetadata as jest.MockedFunction<
                typeof codePush.getUpdateMetadata
            >).mockResolvedValueOnce(createCodepushPackageMock('v4'));

            const configuration = new OpenObserveProviderConfiguration(
                'token',
                'env'
            );
            configuration.rumConfiguration = new RumConfiguration(
                'appId',
                true,
                true,
                true
            );
            render(<OpenObserveCodepushProvider configuration={configuration} />);
            await flushPromises();

            expect(
                OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync
            ).toHaveBeenCalledTimes(1);
            expect(
                OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync
            ).toHaveBeenCalledWith(
                expect.objectContaining({ versionSuffix: 'codepush.v4' })
            );
        });
        it('initializes the sdk with the right codepush version when using partial configuration', async () => {
            const codePush = require('react-native-code-push');
            const { OpenObserveCodepushProvider } = require('..');
            const {
                OoSdkReactNative
            } = require('@openobserve/mobile-react-native');

            (codePush.getUpdateMetadata as jest.MockedFunction<
                typeof codePush.getUpdateMetadata
            >).mockResolvedValueOnce(createCodepushPackageMock('v5'));

            const configuration = {
                trackErrors: true,
                trackInteractions: true,
                trackResources: true
            };
            render(<OpenObserveCodepushProvider configuration={configuration} />);
            await flushPromises();
            expect(
                OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync
            ).not.toHaveBeenCalled();

            OpenObserveCodepushProvider.initialize({
                applicationId: 'fake-application-id',
                clientToken: 'fake-client-token',
                env: 'fake-env'
            });
            await flushPromises();

            expect(
                OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync
            ).toHaveBeenCalledTimes(1);
            expect(
                OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync
            ).toHaveBeenCalledWith(
                expect.objectContaining({ versionSuffix: 'codepush.v5' })
            );
        });

        it('initializes the sdk with commercial version when using OpenObserveProviderConfiguration', async () => {
            const codePush = require('react-native-code-push');
            const { OpenObserveCodepushProvider } = require('..');
            const {
                OpenObserveProviderConfiguration,
                RumConfiguration,
                OoSdkReactNative
            } = require('@openobserve/mobile-react-native');

            (codePush.getUpdateMetadata as jest.MockedFunction<
                typeof codePush.getUpdateMetadata
            >).mockResolvedValueOnce(createCodepushPackageMock(null));

            const configuration = new OpenObserveProviderConfiguration(
                'token',
                'env'
            );

            configuration.rumConfiguration = new RumConfiguration(
                'appId',
                true,
                true,
                true
            );
            render(<OpenObserveCodepushProvider configuration={configuration} />);
            await flushPromises();

            expect(
                OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync
            ).toHaveBeenCalledTimes(1);
            expect(
                Object.keys(
                    (OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync as jest.MockedFunction<
                        typeof OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync
                    >).mock.calls[0]
                )
            ).not.toContain('versionSuffix');
        });
        it('initializes the sdk with commercial version when using partial configuration', async () => {
            const codePush = require('react-native-code-push');
            const { OpenObserveCodepushProvider } = require('..');
            const {
                OoSdkReactNative
            } = require('@openobserve/mobile-react-native');

            (codePush.getUpdateMetadata as jest.MockedFunction<
                typeof codePush.getUpdateMetadata
            >).mockResolvedValueOnce(createCodepushPackageMock(null));

            const configuration = {
                trackErrors: true,
                trackInteractions: true,
                trackResources: true
            };
            render(<OpenObserveCodepushProvider configuration={configuration} />);
            await flushPromises();
            expect(
                OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync
            ).not.toHaveBeenCalled();

            OpenObserveCodepushProvider.initialize({
                clientToken: 'fake-client-token',
                env: 'fake-env',
                rumConfiguration: {
                    applicationId: 'fake-application-id'
                }
            });
            await flushPromises();

            expect(
                OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync
            ).toHaveBeenCalledTimes(1);
            expect(
                Object.keys(
                    (OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync as jest.MockedFunction<
                        typeof OoSdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync
                    >).mock.calls[0]
                )
            ).not.toContain('versionSuffix');
        });

        it('initializes the OpenObserveProvider with FileBasedConfiguration & all parameters', async () => {
            const { OpenObserveCodepushProvider } = require('..');
            const {
                OoSdkReactNative,
                PropagatorType,
                FileBasedConfiguration
            } = require('@openobserve/mobile-react-native');

            const autoInstrumentationConfig = {
                clientToken: 'fake-client-token',
                env: 'fake-env',
                rumConfiguration: {
                    applicationId: 'fake-app-id',
                    useAccessibilityLabel: true,
                    actionNameAttribute: 'test-action-name-attr',
                    trackErrors: true,
                    trackResources: true,
                    trackInteractions: true,
                    resourceTraceSampleRate: 100,
                    nativeCrashReportEnabled: true,
                    nativeLongTaskThresholdMs: false,
                    nativeViewTracking: true,
                    firstPartyHosts: [
                        {
                            match: 'example.com',
                            propagatorTypes: [PropagatorType.DATADOG]
                        }
                    ]
                },
                logsConfiguration: {},
                traceConfiguration: {}
            };

            const configuration = new FileBasedConfiguration({
                configuration: autoInstrumentationConfig
            });

            render(<OpenObserveCodepushProvider configuration={configuration} />);

            await flushPromises();
            await waitFor(() => {
                expect(
                    OoSdkReactNative._enableFeaturesFromOpenObserveProvider
                ).toHaveBeenCalledTimes(1);
            });
            expect(
                OoSdkReactNative._enableFeaturesFromOpenObserveProvider
            ).toHaveBeenCalledWith({
                rumConfiguration: {
                    useAccessibilityLabel: true,
                    actionNameAttribute: 'test-action-name-attr',
                    actionEventMapper: null,
                    nativeCrashReportEnabled: true,
                    nativeLongTaskThresholdMs: false,
                    nativeViewTracking: true,
                    resourceEventMapper: null,
                    errorEventMapper: null,
                    trackErrors: true,
                    trackResources: true,
                    trackInteractions: true,
                    resourceTraceSampleRate: 100,
                    firstPartyHosts: [
                        {
                            match: 'example.com',
                            propagatorTypes: [PropagatorType.DATADOG]
                        }
                    ]
                },
                logsConfiguration: {
                    logEventMapper: null
                }
            });

            expect(
                OoSdkReactNative._enableFeaturesFromOpenObserveProvider
            ).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    clientToken: expect.anything(),
                    env: expect.anything(),
                    applicationId: expect.anything()
                })
            );
        });

        it('initializes the OpenObserveProvider with FileBasedConfiguration & undefined parameters', async () => {
            const { OpenObserveCodepushProvider } = require('..');
            const {
                OoSdkReactNative,
                FileBasedConfiguration
            } = require('@openobserve/mobile-react-native');

            const autoInstrumentationConfig = {
                clientToken: 'fake-client-token',
                env: 'fake-env',
                rumConfiguration: {
                    applicationId: 'fake-app-id'
                }
            };

            const configuration = new FileBasedConfiguration({
                configuration: autoInstrumentationConfig
            });

            render(<OpenObserveCodepushProvider configuration={configuration} />);

            await flushPromises();
            await waitFor(() => {
                expect(
                    OoSdkReactNative._enableFeaturesFromOpenObserveProvider
                ).toHaveBeenCalledTimes(1);
            });
            expect(
                OoSdkReactNative._enableFeaturesFromOpenObserveProvider
            ).toHaveBeenCalledWith(
                expect.objectContaining({
                    rumConfiguration: expect.objectContaining({
                        useAccessibilityLabel: true,
                        actionNameAttribute: undefined,
                        trackErrors: false,
                        trackResources: false,
                        trackInteractions: false,
                        actionEventMapper: null,
                        resourceEventMapper: null,
                        errorEventMapper: null,
                        resourceTraceSampleRate: 100,
                        firstPartyHosts: []
                    }),
                    logsConfiguration: expect.objectContaining({
                        logEventMapper: null
                    })
                })
            );

            expect(
                OoSdkReactNative._enableFeaturesFromOpenObserveProvider
            ).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    clientToken: expect.anything(),
                    env: expect.anything(),
                    applicationId: expect.anything()
                })
            );
        });
    });
});
