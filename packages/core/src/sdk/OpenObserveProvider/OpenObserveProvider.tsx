/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import React from 'react';
import type { PropsWithChildren } from 'react';

import { O2SdkReactNative } from '../../O2SdkReactNative';
import { InternalLog } from '../../InternalLog';
import { OpenObserveProviderConfiguration } from '../../config/OpenObserveProviderConfiguration';
import type { FileBasedConfiguration } from '../../config/FileBasedConfiguration';
import type { AutoInstrumentationConfiguration } from '../../config/async/AutoInstrumentationConfiguration';
import type { PartialInitializationConfiguration } from '../../config/async/PartialInitializationConfiguration';
import { CoreConfiguration } from '../../config/features/CoreConfiguration';
import { SdkVerbosity } from '../../config/types/SdkVerbosity';

import { OpenObserveProviderState } from './OpenObserveProviderState';

type Props = PropsWithChildren<{
    /**
     * If a `OpenObserveProviderConfiguration` instance is passed, the SDK will start tracking errors, resources and actions and sending events.
     *
     * If a `AutoInstrumentationConfiguration` object is passed, the SDK will start tracking errors, resources and actions. To start sending events, call `OpenObserveProvider.initialize`.
     */
    configuration:
        | OpenObserveProviderConfiguration
        | AutoInstrumentationConfiguration
        | FileBasedConfiguration;
    /**
     * Callback to be run once the SDK starts sending events.
     */
    onInitialization?: () => void;
}>;

type StaticProperties = {
    initialize: (
        configuration: PartialInitializationConfiguration
    ) => Promise<void>;
    onInitialization?: () => void;
};

const isConfigurationPartial = (
    configuration:
        | OpenObserveProviderConfiguration
        | AutoInstrumentationConfiguration
): configuration is AutoInstrumentationConfiguration => {
    if (configuration instanceof OpenObserveProviderConfiguration) {
        return false;
    }
    if (configuration instanceof CoreConfiguration) {
        // Not using InternalLog here as it is not yet instantiated
        console.warn(
            'A CoreConfiguration was passed to OpenObserveProvider. Please use OpenObserveProviderConfiguration instead.'
        );
        return false;
    }
    return true;
};

const initializeOpenObserve = async (
    configuration: OpenObserveProviderConfiguration,
    onInitialization?: () => void
) => {
    await O2SdkReactNative._initializeFromOpenObserveProvider(configuration);
    if (onInitialization) {
        try {
            onInitialization();
        } catch (error) {
            InternalLog.log(
                `Error running onInitialization callback ${error}`,
                SdkVerbosity.WARN
            );
        }
    }
};

/**
 * Set up the OpenObserve React Native SDK.
 */
export const OpenObserveProvider: React.FC<Props> & StaticProperties = ({
    children,
    configuration,
    onInitialization
}) => {
    if (!OpenObserveProviderState.isInitialized) {
        // Here we cannot use a useEffect hook since it would be called after
        // the first render. Thus, we wouldn't enable auto-instrumentation on
        // the elements rendered in this first render and what happens during
        // the first render.
        if (isConfigurationPartial(configuration)) {
            O2SdkReactNative._enableFeaturesFromOpenObserveProvider(configuration);
            OpenObserveProvider.onInitialization = onInitialization;
        } else {
            initializeOpenObserve(configuration, onInitialization);
        }
        OpenObserveProviderState.setInitialized();
    }

    return <>{children}</>;
};

/**
 * Initialize the OpenObserve SDK to start sending RUM events, logs and traces,
 * then execute onInitialization callback if any was provided.
 */
OpenObserveProvider.initialize = async (
    configuration: PartialInitializationConfiguration
) => {
    await O2SdkReactNative._initializeFromOpenObserveProviderWithConfigurationAsync(
        configuration
    );
    if (OpenObserveProvider.onInitialization) {
        OpenObserveProvider.onInitialization();
    }
};

export const __internalResetIsInitializedForTesting = () => {
    OpenObserveProviderState._reset();
};
