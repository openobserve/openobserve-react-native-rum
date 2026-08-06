/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { NativeModules } from 'react-native';

import { InternalLog } from '../../InternalLog';
import { SdkVerbosity } from '../../config/types';
import { BufferSingleton } from '../../sdk/OpenObserveProvider/Buffer/BufferSingleton';
import { O2Trace } from '../O2Trace';

jest.mock('../../utils/time-provider/DefaultTimeProvider', () => {
    return {
        DefaultTimeProvider: jest.fn().mockImplementation(() => {
            return { now: jest.fn().mockReturnValue(456) };
        })
    };
});

jest.mock('../../InternalLog', () => {
    return {
        InternalLog: {
            log: jest.fn()
        },
        OPENOBSERVE_MESSAGE_PREFIX: 'OPENOBSERVE:'
    };
});

describe('O2Trace', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        BufferSingleton.onInitialization();
    });

    describe('Context validation', () => {
        describe('O2Trace.startSpan', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };
                await O2Trace.startSpan('operation', context);

                expect(NativeModules.O2Trace.startSpan).toHaveBeenCalledWith(
                    'operation',
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');
                await O2Trace.startSpan('operation', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Trace.startSpan).toHaveBeenCalledWith(
                    'operation',
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];
                await O2Trace.startSpan('operation', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    1,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Trace.startSpan).toHaveBeenCalledWith(
                    'operation',
                    { context },
                    expect.anything()
                );
            });
        });

        describe('O2Trace.finishSpan', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };

                const spanId = await O2Trace.startSpan('operation', {});
                await O2Trace.finishSpan(spanId, context);

                expect(NativeModules.O2Trace.finishSpan).toHaveBeenCalledWith(
                    spanId,
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');
                await O2Trace.startSpan('operation', context);

                const spanId = await O2Trace.startSpan('operation', {});
                await O2Trace.finishSpan(spanId, context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );
                expect(NativeModules.O2Trace.finishSpan).toHaveBeenCalledWith(
                    spanId,
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];

                const spanId = await O2Trace.startSpan('operation', {});
                await O2Trace.finishSpan(spanId, context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    3,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Trace.finishSpan).toHaveBeenCalledWith(
                    spanId,
                    { context },
                    expect.anything()
                );
            });
        });
    });
});
