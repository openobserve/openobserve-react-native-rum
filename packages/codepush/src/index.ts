/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import {
    OpenObserveProvider,
    OpenObserveProviderConfiguration,
    OoSdkReactNative
} from '@openobserve/mobile-react-native';
import type {
    AutoInstrumentationConfiguration,
    CoreConfiguration
} from '@openobserve/mobile-react-native';
import codePush from 'react-native-code-push';

import { removeDiscardProperties } from './utils';
import type { RequiredOrDiscard } from './utils';

/**
 * Use this class instead of OoSdkReactNative to initialize the OpenObserve SDK when using AppCenter CodePush.
 */
export const OpenObserveCodepush = {
    async initialize(configuration: CoreConfiguration): Promise<void> {
        const codePushUpdateMetadata = await codePush.getUpdateMetadata();
        if (codePushUpdateMetadata) {
            configuration.versionSuffix = `codepush.${codePushUpdateMetadata.label}`;
        }
        return OoSdkReactNative.initialize(configuration);
    }
};

const initializeWithCodepushVersion = async (
    configuration: OpenObserveProviderConfiguration
) => {
    const codePushUpdateMetadata = await codePush.getUpdateMetadata();
    if (codePushUpdateMetadata) {
        configuration.versionSuffix = `codepush.${codePushUpdateMetadata.label}`;
    }
    OpenObserveProvider.initialize(configuration);
};

const buildPartialConfiguration = (
    configuration: OpenObserveProviderConfiguration
): AutoInstrumentationConfiguration => {
    const partialConfiguration: RequiredOrDiscard<AutoInstrumentationConfiguration> = {
        rumConfiguration: {
            firstPartyHosts: configuration.rumConfiguration?.firstPartyHosts,
            useAccessibilityLabel:
                configuration.rumConfiguration?.useAccessibilityLabel ?? true,
            actionNameAttribute:
                configuration.rumConfiguration?.actionNameAttribute,
            trackErrors: configuration.rumConfiguration?.trackErrors ?? false,
            trackResources:
                configuration.rumConfiguration?.trackResources ?? false,
            trackInteractions:
                configuration.rumConfiguration?.trackInteractions ?? false,
            resourceTraceSampleRate:
                configuration.rumConfiguration?.resourceTraceSampleRate ?? 100,
            nativeCrashReportEnabled:
                configuration.rumConfiguration?.nativeCrashReportEnabled ??
                false,
            nativeLongTaskThresholdMs:
                configuration.rumConfiguration?.nativeLongTaskThresholdMs ??
                200,
            nativeViewTracking:
                configuration.rumConfiguration?.nativeViewTracking ?? false,
            errorEventMapper:
                configuration.rumConfiguration?.errorEventMapper ?? null,
            resourceEventMapper:
                configuration.rumConfiguration?.resourceEventMapper ?? null,
            actionEventMapper:
                configuration.rumConfiguration?.actionEventMapper ?? null
        },
        logsConfiguration: {
            logEventMapper:
                configuration.logsConfiguration?.logEventMapper ?? null
        }
    };

    return removeDiscardProperties(
        partialConfiguration
    ) as AutoInstrumentationConfiguration;
};

export const OpenObserveCodepushProvider: typeof OpenObserveProvider = ({
    configuration,
    ...rest
}) => {
    // We cannot use SYNC or ASYNC initialization modes as we need to asynchronously get the CodePush version.
    // We turn it to partial initialization, while in parallel we get the CodePush version and initialize the SDK.
    if (configuration instanceof OpenObserveProviderConfiguration) {
        initializeWithCodepushVersion(configuration);
        return OpenObserveProvider({
            configuration: buildPartialConfiguration(configuration),
            ...rest
        });
    } else {
        return OpenObserveProvider({ configuration, ...rest });
    }
};

OpenObserveCodepushProvider.initialize = async configuration => {
    const codePushUpdateMetadata = await codePush.getUpdateMetadata();
    if (codePushUpdateMetadata) {
        configuration.versionSuffix = `codepush.${codePushUpdateMetadata.label}`;
    }
    OpenObserveProvider.initialize(configuration);
};
