/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { NativeModules } from 'react-native';

import { InternalLog } from '../../InternalLog';
import { SdkVerbosity } from '../../config/types/SdkVerbosity';
import { OoFlags } from '../OoFlags';

jest.mock('../../InternalLog', () => {
    return {
        InternalLog: {
            log: jest.fn()
        },
        OPENOBSERVE_MESSAGE_PREFIX: 'OPENOBSERVE:'
    };
});

describe('OoFlags', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset state of OoFlags instance.
        Object.assign(OoFlags, {
            isFeatureEnabled: false,
            clients: {}
        });
    });

    it('should always call the native enable method with enabled set to true', async () => {
        await OoFlags.enable();

        expect(NativeModules.OoFlags.enable).toHaveBeenCalledWith({
            enabled: true
        });
    });

    it('should call the native enable method with the correct configuration', async () => {
        await OoFlags.enable({
            customExposureEndpoint: 'https://example.com',
            customFlagsEndpoint: 'https://example.com',
            trackExposures: false,
            rumIntegrationEnabled: false
        });

        expect(NativeModules.OoFlags.enable).toHaveBeenCalledWith({
            enabled: true,
            customExposureEndpoint: 'https://example.com',
            customFlagsEndpoint: 'https://example.com',
            trackExposures: false,
            rumIntegrationEnabled: false
        });
    });

    it('should print an error when trying to retrieve a client before OoFlags.enable() has been called', async () => {
        OoFlags.getClient();

        expect(InternalLog.log).toHaveBeenCalledWith(
            '`OoFlags.getClient()` called before OpenObserve Flags feature have been enabled. Client will fall back to serving default flag values.',
            SdkVerbosity.ERROR
        );
    });
});
