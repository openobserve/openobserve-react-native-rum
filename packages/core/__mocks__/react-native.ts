/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import type {
    OoNativeFlagsType,
    OoNativeSdkType,
    OoNativeLogsType
} from '../src/nativeModulesTypes';
import type { OoRumType } from '../src/rum/types';
import type { OoTraceType } from '../src/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actualRN = require('react-native');

actualRN.NativeModules.OoSdk = {
    initialize: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['initialize']>,
    setUserInfo: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['setUserInfo']>,
    addUserExtraInfo: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['addUserExtraInfo']>,
    clearUserInfo: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['clearUserInfo']>,
    addAttribute: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['addAttribute']>,
    removeAttribute: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['removeAttribute']>,
    addAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['addAttributes']>,
    removeAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['removeAttributes']>,
    setTrackingConsent: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['setTrackingConsent']>,
    sendTelemetryLog: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoNativeSdkType['sendTelemetryLog']>,
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
    ) as jest.MockedFunction<OoNativeSdkType['clearAllData']>,
    addListener: jest.fn().mockImplementation((_: string) => {
        /* empty */
    }) as jest.MockedFunction<OoNativeSdkType['addListener']>,
    removeListeners: jest.fn().mockImplementation((_: number) => {
        /* empty */
    }) as jest.MockedFunction<OoNativeSdkType['removeListeners']>,
    onRUMSessionStarted: jest.fn().mockImplementation((_: string) => {
        /* empty */
    }) as jest.MockedFunction<OoNativeSdkType['onRUMSessionStarted']>
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
    addViewAttribute: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['addViewAttribute']>,
    removeViewAttribute: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['removeViewAttribute']>,
    addViewAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['addViewAttributes']>,
    removeViewAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['removeViewAttributes']>,
    addViewLoadingTime: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<OoRumType['addViewLoadingTime']>,
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

const OoFlags: OoNativeFlagsType = {
    enable: jest.fn(() => Promise.resolve()),
    setEvaluationContext: jest.fn(() => Promise.resolve({})),
    trackEvaluation: jest.fn(() => Promise.resolve())
};
actualRN.NativeModules.OoFlags = OoFlags;

module.exports = actualRN;
