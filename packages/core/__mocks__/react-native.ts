/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import type {
    O2NativeFlagsType,
    O2NativeSdkType,
    O2NativeLogsType
} from '../src/nativeModulesTypes';
import type { O2RumType } from '../src/rum/types';
import type { O2TraceType } from '../src/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const actualRN = require('react-native');

actualRN.NativeModules.O2Sdk = {
    initialize: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['initialize']>,
    setUserInfo: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['setUserInfo']>,
    addUserExtraInfo: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['addUserExtraInfo']>,
    clearUserInfo: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['clearUserInfo']>,
    addAttribute: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['addAttribute']>,
    removeAttribute: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['removeAttribute']>,
    addAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['addAttributes']>,
    removeAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['removeAttributes']>,
    setTrackingConsent: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['setTrackingConsent']>,
    sendTelemetryLog: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['sendTelemetryLog']>,
    telemetryDebug: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['telemetryDebug']>,
    telemetryError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['telemetryError']>,
    consumeWebviewEvent: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['consumeWebviewEvent']>,
    clearAllData: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeSdkType['clearAllData']>,
    addListener: jest.fn().mockImplementation((_: string) => {
        /* empty */
    }) as jest.MockedFunction<O2NativeSdkType['addListener']>,
    removeListeners: jest.fn().mockImplementation((_: number) => {
        /* empty */
    }) as jest.MockedFunction<O2NativeSdkType['removeListeners']>,
    onRUMSessionStarted: jest.fn().mockImplementation((_: string) => {
        /* empty */
    }) as jest.MockedFunction<O2NativeSdkType['onRUMSessionStarted']>
};

actualRN.NativeModules.O2Logs = {
    debug: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeLogsType['debug']>,
    info: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeLogsType['info']>,
    warn: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeLogsType['warn']>,
    error: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeLogsType['error']>,
    debugWithError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeLogsType['debugWithError']>,
    infoWithError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeLogsType['infoWithError']>,
    warnWithError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeLogsType['warnWithError']>,
    errorWithError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2NativeLogsType['errorWithError']>
};

actualRN.NativeModules.O2Trace = {
    startSpan: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2TraceType['startSpan']>,
    finishSpan: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2TraceType['finishSpan']>
};

actualRN.NativeModules.O2Rum = {
    startView: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['startView']>,
    stopView: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['stopView']>,
    startAction: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['startAction']>,
    stopAction: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['stopAction']>,
    addAction: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['addAction']>,
    startResource: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['startResource']>,
    stopResource: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['stopResource']>,
    addError: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['addError']>,
    addTiming: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['addTiming']>,
    addViewAttribute: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['addViewAttribute']>,
    removeViewAttribute: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['removeViewAttribute']>,
    addViewAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['addViewAttributes']>,
    removeViewAttributes: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['removeViewAttributes']>,
    addViewLoadingTime: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['addViewLoadingTime']>,
    stopSession: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['stopSession']>,
    getCurrentSessionId: jest.fn().mockImplementation(
        () =>
            new Promise<string | undefined>(resolve =>
                resolve('test-session-id')
            )
    ) as jest.MockedFunction<O2RumType['getCurrentSessionId']>,
    startFeatureOperation: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['startFeatureOperation']>,
    succeedFeatureOperation: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['startFeatureOperation']>,
    failFeatureOperation: jest.fn().mockImplementation(
        () => new Promise<void>(resolve => resolve())
    ) as jest.MockedFunction<O2RumType['failFeatureOperation']>
};

const O2Flags: O2NativeFlagsType = {
    enable: jest.fn(() => Promise.resolve()),
    setEvaluationContext: jest.fn(() => Promise.resolve({})),
    trackEvaluation: jest.fn(() => Promise.resolve())
};
actualRN.NativeModules.O2Flags = O2Flags;

module.exports = actualRN;
