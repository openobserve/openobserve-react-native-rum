import {
    OpenObserveProviderConfiguration,
    O2Logs,
    O2SdkReactNative,
    CoreConfiguration,
    SdkVerbosity,
    TrackingConsent,
    BatchSize,
    UploadFrequency,
    O2Flags,
    PropagatorType,
} from '@openobserve/mobile-react-native';
import { OpenObserveOpenFeatureProvider } from '@openobserve/mobile-react-native-openfeature';
import { OpenFeature } from '@openfeature/react-sdk';

import {APPLICATION_ID, CLIENT_TOKEN, ENVIRONMENT} from './ddCredentials';
import { BatchProcessingLevel } from '@openobserve/mobile-react-native/src/config/types';

// New SDK Setup - not available for react-native-navigation
export function getOpenObserveConfig(trackingConsent: TrackingConsent) {
    const config = new OpenObserveProviderConfiguration(
        CLIENT_TOKEN,
        ENVIRONMENT,
        trackingConsent,
        {
            batchSize: BatchSize.SMALL,
            uploadFrequency: UploadFrequency.FREQUENT,
            batchProcessingLevel: BatchProcessingLevel.MEDIUM,
            additionalConfiguration: {
                customProperty: "sdk-example-app"
            },
            rumConfiguration: {
                applicationId: APPLICATION_ID,
                trackInteractions: true,
                trackResources: true,
                trackErrors: true,
                sessionSampleRate: 100,
                nativeCrashReportEnabled: true,
                firstPartyHosts: [{
                    match: "example.com",
                    propagatorTypes: [PropagatorType.B3MULTI, PropagatorType.TRACECONTEXT]
                }]
            },
            logsConfiguration: {
                logEventMapper: (logEvent) => {
                    logEvent.message = `[CUSTOM] ${logEvent.message}`;
                    return logEvent;
                }
            },
            traceConfiguration: {}
        }
    );

    config.service = "com.datadoghq.reactnative.sample"
    config.verbosity = SdkVerbosity.DEBUG;

    return config
}

 export function onOpenObserveInitialization() {
    O2Logs.info('The RN Sdk was properly initialized')
    O2SdkReactNative.setUserInfo({id: "1337", name: "Xavier", email: "xg@example.com", extraInfo: { type: "premium" } })
    O2SdkReactNative.addAttributes({campaign: "ad-network"})
}

// Legacy SDK Setup
export function initializeOpenObserve(trackingConsent: TrackingConsent) {

    const config = new CoreConfiguration(
        CLIENT_TOKEN,
        ENVIRONMENT,
        trackingConsent,
        {
            rumConfiguration: {
                applicationId: APPLICATION_ID,
                trackInteractions: true,
                trackResources: true,
                trackErrors: true,
                sessionSampleRate: 100,
                nativeCrashReportEnabled: true,
                firstPartyHosts: [{
                    match: "example.com",
                    propagatorTypes: [PropagatorType.B3MULTI, PropagatorType.TRACECONTEXT]
                }]
            }
        }
    )

    config.verbosity = SdkVerbosity.DEBUG;
    config.service = "com.datadoghq.reactnative.sample"

    O2SdkReactNative.initialize(config).then(() => {
        O2Logs.info('The RN Sdk was properly initialized')
        O2SdkReactNative.setUserInfo({id: "1337", name: "Xavier", email: "xg@example.com", extraInfo: { type: "premium" } })
        O2SdkReactNative.addAttributes({campaign: "ad-network"})
    });

    // Enable the Flags feature.
    O2Flags.enable().then(() => {
        // Set the provider with OpenFeature.
        const provider = new OpenObserveOpenFeatureProvider();
        OpenFeature.setProvider(provider);
    })
}
