/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import type {
    OoNativeSdkType,
    OoNativeLogsType
} from '../../core/src/nativeModulesTypes';
import type { OoRumType } from '../../core/src/rum/types';
import type { OoTraceType } from '../../core/src/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actualRN = require('react-native');

actualRN.NativeModules.OoSdk = {
    initialize: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['initialize']>,
    addAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['addAttributes']>,
    setTrackingConsent: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['setTrackingConsent']>,
    telemetryDebug: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['telemetryDebug']>,
    telemetryError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['telemetryError']>,
    consumeWebviewEvent: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['consumeWebviewEvent']>,
    clearAllData: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['clearAllData']>
};

actualRN.NativeModules.OoLogs = {
    debug: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeLogsType['debug']>,
    info: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeLogsType['info']>,
    warn: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeLogsType['warn']>,
    error: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeLogsType['error']>,
    debugWithError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeLogsType['debugWithError']>,
    infoWithError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeLogsType['infoWithError']>,
    warnWithError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeLogsType['warnWithError']>,
    errorWithError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeLogsType['errorWithError']>
};

actualRN.NativeModules.OoTrace = {
    startSpan: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoTraceType['startSpan']>,
    finishSpan: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoTraceType['finishSpan']>
};

actualRN.NativeModules.OoRum = {
    startView: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['startView']>,
    stopView: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['stopView']>,
    startAction: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['startAction']>,
    stopAction: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['stopAction']>,
    addAction: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['addAction']>,
    startResource: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['startResource']>,
    stopResource: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['stopResource']>,
    addError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['addError']>,
    addTiming: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['addTiming']>,
    stopSession: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['stopSession']>,
    getCurrentSessionId: jest.fn().mockImplementation(
        () =>
            new Promise<string | undefined>(resolve =>
                resolve('test-session-id')
            )
    ) as jest.MockedFunction<OoRumType['getCurrentSessionId']>,
    startFeatureOperation: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['startFeatureOperation']>,
    succeedFeatureOperation: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['startFeatureOperation']>,
    failFeatureOperation: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['failFeatureOperation']>
};

module.exports = actualRN;
