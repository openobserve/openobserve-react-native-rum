import {
    OpenObserveProviderConfiguration,
    OoLogs,
    OoSdkReactNative,
    CoreConfiguration,
    SdkVerbosity,
    TrackingConsent,
    BatchSize,
    UploadFrequency,
    OoFlags,
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
    OoLogs.info('The RN Sdk was properly initialized')
    OoSdkReactNative.setUserInfo({id: "1337", name: "Xavier", email: "xg@example.com", extraInfo: { type: "premium" } })
    OoSdkReactNative.addAttributes({campaign: "ad-network"})
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

    OoSdkReactNative.initialize(config).then(() => {
        OoLogs.info('The RN Sdk was properly initialized')
        OoSdkReactNative.setUserInfo({id: "1337", name: "Xavier", email: "xg@example.com", extraInfo: { type: "premium" } })
        OoSdkReactNative.addAttributes({campaign: "ad-network"})
    });

    // Enable the Flags feature.
    OoFlags.enable().then(() => {
        // Set the provider with OpenFeature.
        const provider = new OpenObserveOpenFeatureProvider();
        OpenFeature.setProvider(provider);
    })
}
