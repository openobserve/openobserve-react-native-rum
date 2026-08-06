/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { InternalLog } from '../InternalLog';
import { SdkVerbosity } from '../config/types/SdkVerbosity';
import type { O2NativeFlagsType } from '../nativeModulesTypes';
import { getGlobalInstance } from '../utils/singletonUtils';

import { FlagsClient } from './FlagsClient';
import type { O2FlagsType, FlagsConfiguration } from './types';

const FLAGS_MODULE = 'com.openobserve.reactnative.flags';

/**
 * Implementation class for {@link O2FlagsType}. Please see the interface for documentation.
 */
class O2FlagsWrapper implements O2FlagsType {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    private nativeFlags: O2NativeFlagsType = require('../specs/NativeDdFlags')
        .default;

    private isFeatureEnabled = false;

    /**
     * A map of client names to their corresponding {@link FlagsClient} instances.
     *
     * Each of these clients hold their own context and flags state.
     */
    private clients: Record<string, FlagsClient> = {};

    enable = async (configuration: FlagsConfiguration = {}): Promise<void> => {
        await this.nativeFlags.enable({ enabled: true, ...configuration });

        this.isFeatureEnabled = true;
    };

    getClient = (clientName: string = 'default'): FlagsClient => {
        if (!this.isFeatureEnabled) {
            InternalLog.log(
                '`O2Flags.getClient()` called before OpenObserve Flags feature have been enabled. Client will fall back to serving default flag values.',
                SdkVerbosity.ERROR
            );
        }

        if (!this.clients[clientName]) {
            this.clients[clientName] = new FlagsClient(clientName);
        }

        return this.clients[clientName];
    };
}

export const O2Flags: O2FlagsType = getGlobalInstance(
    FLAGS_MODULE,
    () => new O2FlagsWrapper()
);
