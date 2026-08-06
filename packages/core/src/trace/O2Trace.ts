/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { InternalLog } from '../InternalLog';
import { SdkVerbosity } from '../config/types/SdkVerbosity';
import type { O2NativeTraceType } from '../nativeModulesTypes';
import { encodeAttributes } from '../sdk/AttributesEncoding/attributesEncoding';
import {
    bufferNativeCallReturningId,
    bufferNativeCallWithId
} from '../sdk/OpenObserveProvider/Buffer/bufferNativeCall';
import type { O2TraceType } from '../types';
import { getGlobalInstance } from '../utils/singletonUtils';
import { DefaultTimeProvider } from '../utils/time-provider/DefaultTimeProvider';

const TRACE_MODULE = 'com.openobserve.reactnative.trace';

const timeProvider = new DefaultTimeProvider();

class O2TraceWrapper implements O2TraceType {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    private nativeTrace: O2NativeTraceType = require('../specs/NativeDdTrace')
        .default;

    startSpan = (
        operation: string,
        context: object = {},
        timestampMs: number = timeProvider.now()
    ): Promise<string> => {
        const spanId = bufferNativeCallReturningId(() =>
            this.nativeTrace.startSpan(
                operation,
                encodeAttributes(context),
                timestampMs
            )
        );
        InternalLog.log(`Starting span “${operation}”`, SdkVerbosity.DEBUG);
        return spanId;
    };

    finishSpan = (
        spanId: string,
        context: object = {},
        timestampMs: number = timeProvider.now()
    ): Promise<void> => {
        InternalLog.log(`Finishing span #${spanId}`, SdkVerbosity.DEBUG);
        return bufferNativeCallWithId(
            id =>
                this.nativeTrace.finishSpan(
                    id,
                    encodeAttributes(context),
                    timestampMs
                ),
            spanId
        );
    };
}

export const O2Trace: O2TraceType = getGlobalInstance(
    TRACE_MODULE,
    () => new O2TraceWrapper()
);
