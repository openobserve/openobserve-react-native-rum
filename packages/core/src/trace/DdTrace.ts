/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { InternalLog } from '../InternalLog';
import { SdkVerbosity } from '../config/types/SdkVerbosity';
import type { OoNativeTraceType } from '../nativeModulesTypes';
import { encodeAttributes } from '../sdk/AttributesEncoding/attributesEncoding';
import {
    bufferNativeCallReturningId,
    bufferNativeCallWithId
} from '../sdk/DatadogProvider/Buffer/bufferNativeCall';
import type { OoTraceType } from '../types';
import { getGlobalInstance } from '../utils/singletonUtils';
import { DefaultTimeProvider } from '../utils/time-provider/DefaultTimeProvider';

const TRACE_MODULE = 'com.datadog.reactnative.trace';

const timeProvider = new DefaultTimeProvider();

class OoTraceWrapper implements OoTraceType {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    private nativeTrace: OoNativeTraceType = require('../specs/NativeDdTrace')
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

export const OoTrace: OoTraceType = getGlobalInstance(
    TRACE_MODULE,
    () => new OoTraceWrapper()
);
