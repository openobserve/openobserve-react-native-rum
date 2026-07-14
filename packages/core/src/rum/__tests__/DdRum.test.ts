/* eslint-disable @typescript-eslint/ban-ts-comment */
/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { NativeModules } from 'react-native';
import type { GestureResponderEvent } from 'react-native';

import { InternalLog } from '../../InternalLog';
import { SdkVerbosity } from '../../config/types';
import { BufferSingleton } from '../../sdk/DatadogProvider/Buffer/BufferSingleton';
import { NativeDdSdk } from '../../sdk/OoSdkInternal';
import { GlobalState } from '../../sdk/GlobalState/GlobalState';
import { ErrorSource } from '../../types';
import { OoRum } from '../OoRum';
import type { ActionEventMapper } from '../eventMappers/actionEventMapper';
import type { ErrorEventMapper } from '../eventMappers/errorEventMapper';
import type { ResourceEventMapper } from '../eventMappers/resourceEventMapper';
import {
    clearCachedAccountId,
    clearCachedSessionId,
    clearCachedUserId,
    setCachedAccountId,
    setCachedSessionId,
    setCachedUserId
} from '../helper';
import { DatadogTracingContext } from '../instrumentation/resourceTracking/distributedTracing/DatadogTracingContext';
import { DatadogTracingIdentifier } from '../instrumentation/resourceTracking/distributedTracing/DatadogTracingIdentifier';
import { TracingIdFormat } from '../instrumentation/resourceTracking/distributedTracing/TracingIdentifier';
import { TracingIdentifierUtils } from '../instrumentation/resourceTracking/distributedTracing/__tests__/__utils__/TracingIdentifierUtils';
import type { FirstPartyHost } from '../types';
import { PropagatorType, RumActionType } from '../types';

import * as TracingContextUtils from './__utils__/TracingHeadersUtils';

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
        DATADOG_MESSAGE_PREFIX: 'DATADOG:'
    };
});

describe('OoRum', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        BufferSingleton.onInitialization();
        clearCachedSessionId();
        clearCachedUserId();
        clearCachedAccountId();
    });

    describe('Context validation', () => {
        describe('OoRum.startView', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };
                await OoRum.startView('key', 'name', context);

                expect(NativeModules.OoRum.startView).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');
                await OoRum.startView('key', 'name', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.startView).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];
                await OoRum.startView('key', 'name', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.startView).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    { context },
                    expect.anything()
                );
            });
        });

        describe('OoRum.stopView', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };
                await OoRum.startView('key', 'name');
                await OoRum.stopView('key', context);

                expect(NativeModules.OoRum.stopView).toHaveBeenCalledWith(
                    'key',
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');

                await OoRum.startView('key', 'name');
                await OoRum.stopView('key', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    3,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.stopView).toHaveBeenCalledWith(
                    'key',
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];

                await OoRum.startView('key', 'name');
                await OoRum.stopView('key', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    3,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.stopView).toHaveBeenCalledWith(
                    'key',
                    { context },
                    expect.anything()
                );
            });
        });

        describe('OoRum.startAction', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };
                await OoRum.startAction(RumActionType.SCROLL, 'name', context);

                expect(NativeModules.OoRum.startAction).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');
                await OoRum.startAction(RumActionType.SCROLL, 'name', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.startAction).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];
                await OoRum.startAction(RumActionType.SCROLL, 'name', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.startAction).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    { context },
                    expect.anything()
                );
            });
        });

        describe('OoRum.stopAction', () => {
            describe('New API', () => {
                test('uses given context when context is valid', async () => {
                    const context = {
                        testA: 123,
                        testB: 'ok'
                    };
                    await OoRum.startAction(RumActionType.SCROLL, 'name');
                    await OoRum.stopAction(
                        RumActionType.SCROLL,
                        'name',
                        context
                    );

                    expect(NativeModules.OoRum.stopAction).toHaveBeenCalledWith(
                        RumActionType.SCROLL,
                        'name',
                        context,
                        expect.anything()
                    );
                });

                test('uses empty context with error when context is invalid or null', async () => {
                    const context: any = Symbol('invalid-context');

                    await OoRum.startAction(RumActionType.SCROLL, 'name');
                    await OoRum.stopAction(
                        RumActionType.SCROLL,
                        'name',
                        context
                    );

                    expect(InternalLog.log).toHaveBeenNthCalledWith(
                        3,
                        expect.anything(),
                        SdkVerbosity.WARN
                    );

                    expect(NativeModules.OoRum.stopAction).toHaveBeenCalledWith(
                        RumActionType.SCROLL,
                        'name',
                        {},
                        expect.anything()
                    );
                });

                test('nests given context in new object when context is array', async () => {
                    const context: any = [123, '456'];

                    await OoRum.startAction(RumActionType.SCROLL, 'name');
                    await OoRum.stopAction(
                        RumActionType.SCROLL,
                        'name',
                        context
                    );

                    expect(InternalLog.log).toHaveBeenNthCalledWith(
                        3,
                        expect.anything(),
                        SdkVerbosity.WARN
                    );

                    expect(NativeModules.OoRum.stopAction).toHaveBeenCalledWith(
                        RumActionType.SCROLL,
                        'name',
                        { context },
                        expect.anything()
                    );
                });
            });

            describe('Old API', () => {
                test('uses given context when context is valid', async () => {
                    const context = {
                        testA: 123,
                        testB: 'ok'
                    };
                    await OoRum.startAction(RumActionType.SCROLL, 'name');
                    await OoRum.stopAction(context);

                    expect(NativeModules.OoRum.stopAction).toHaveBeenCalledWith(
                        RumActionType.SCROLL,
                        'name',
                        context,
                        expect.anything()
                    );
                });

                test('uses empty context with error when context is invalid or null', async () => {
                    await OoRum.startAction(RumActionType.SCROLL, 'name');
                    await OoRum.stopAction(undefined);

                    expect(NativeModules.OoRum.stopAction).toHaveBeenCalledWith(
                        RumActionType.SCROLL,
                        'name',
                        {},
                        expect.anything()
                    );
                });

                test('nests given context in new object when context is array', async () => {
                    const context: any = [123, '456'];

                    await OoRum.startAction(RumActionType.SCROLL, 'name');
                    await OoRum.stopAction(context);

                    expect(InternalLog.log).toHaveBeenNthCalledWith(
                        3,
                        expect.anything(),
                        SdkVerbosity.WARN
                    );

                    expect(NativeModules.OoRum.stopAction).toHaveBeenCalledWith(
                        RumActionType.SCROLL,
                        'name',
                        { context },
                        expect.anything()
                    );
                });
            });
        });

        describe('OoRum.startResource', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };
                await OoRum.startResource('key', 'method', 'url', context);

                expect(NativeModules.OoRum.startResource).toHaveBeenCalledWith(
                    'key',
                    'method',
                    'url',
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');

                await OoRum.startResource('key', 'method', 'url', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    3,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.startResource).toHaveBeenCalledWith(
                    'key',
                    'method',
                    'url',
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];

                await OoRum.startResource('key', 'method', 'url', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.startResource).toHaveBeenCalledWith(
                    'key',
                    'method',
                    'url',
                    { context },
                    expect.anything()
                );
            });
        });

        describe('OoRum.stopResource', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };

                await OoRum.startResource('key', 'method', 'url', {});
                await OoRum.stopResource('key', 200, 'other', -1, context);

                expect(NativeModules.OoRum.stopResource).toHaveBeenCalledWith(
                    'key',
                    200,
                    'other',
                    -1,
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');

                await OoRum.startResource('key', 'method', 'url', {});
                await OoRum.stopResource('key', 200, 'other', -1, context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    3,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.stopResource).toHaveBeenCalledWith(
                    'key',
                    200,
                    'other',
                    -1,
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];

                await OoRum.startResource('key', 'method', 'url', {});
                await OoRum.stopResource('key', 200, 'other', -1, context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    3,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.stopResource).toHaveBeenCalledWith(
                    'key',
                    200,
                    'other',
                    -1,
                    { context },
                    expect.anything()
                );
            });
        });

        describe('Tracing Context APIs', () => {
            describe('Types and Enums', () => {
                it('exposes TracingIdFormat enum', () => {
                    expect(TracingIdFormat).toBeDefined();
                });

                it('exposes DatadogTracingIdentifier enum', () => {
                    expect(DatadogTracingIdentifier).toBeDefined();
                });

                it('exposes DatadogTracingContext class', () => {
                    expect(DatadogTracingContext).toBeDefined();
                });
            });

            describe('OoRum.generateTraceId', () => {
                it('generates 128-bit trace ID (100 iterations)', () => {
                    for (let i = 0; i < 100; i++) {
                        const traceId = OoRum.generateTraceId();
                        expect(traceId).toBeDefined();
                        expect(
                            TracingIdentifierUtils.isWithin128Bits(
                                traceId.toString(TracingIdFormat.decimal)
                            )
                        ).toBe(true);
                    }
                });
            });

            describe('OoRum.generateSpanId', () => {
                it('generates 64-bit span ID (100 iterations)', () => {
                    for (let i = 0; i < 100; i++) {
                        const spanId = OoRum.generateSpanId();
                        expect(spanId).toBeDefined();
                        expect(
                            TracingIdentifierUtils.isWithin64Bits(
                                spanId.toString(TracingIdFormat.decimal)
                            )
                        ).toBe(true);
                    }
                });
            });

            describe('OoRum.getTracingContext', () => {
                it('returns tracing context with DATADOG propagator and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const url = 'https://www.example.com';
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;
                        const firstPartyHosts: FirstPartyHost[] = [
                            {
                                match: 'example.com',
                                propagatorTypes: [PropagatorType.DATADOG]
                            }
                        ];

                        const tracingContext = OoRum.getTracingContext(
                            url,
                            tracingSamplingRate,
                            firstPartyHosts
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(Object.keys(resourceContext)).toHaveLength(3);

                        TracingContextUtils.verifyRumResourceContext(
                            tracingContext
                        );

                        const headers = tracingContext.getHeadersForRequestAsArray();
                        expect(headers).toHaveLength(5);
                        TracingContextUtils.verifyDatadogHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );
                    }
                });

                it('returns tracing context with TRACECONTEXT propagator and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const url = 'https://www.example.com';
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;
                        const firstPartyHosts: FirstPartyHost[] = [
                            {
                                match: 'example.com',
                                propagatorTypes: [PropagatorType.TRACECONTEXT]
                            }
                        ];

                        const tracingContext = OoRum.getTracingContext(
                            url,
                            tracingSamplingRate,
                            firstPartyHosts
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(Object.keys(resourceContext)).toHaveLength(3);

                        TracingContextUtils.verifyRumResourceContext(
                            tracingContext
                        );

                        const headers = tracingContext.getHeadersForRequestAsArray();

                        expect(headers).toHaveLength(2);
                        TracingContextUtils.verifyTraceContextHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );
                    }
                });

                it('returns tracing context with B3 propagator and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const url = 'https://www.example.com';
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;
                        const firstPartyHosts: FirstPartyHost[] = [
                            {
                                match: 'example.com',
                                propagatorTypes: [PropagatorType.B3]
                            }
                        ];

                        const tracingContext = OoRum.getTracingContext(
                            url,
                            tracingSamplingRate,
                            firstPartyHosts
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(Object.keys(resourceContext)).toHaveLength(3);

                        TracingContextUtils.verifyRumResourceContext(
                            tracingContext
                        );

                        const headers = tracingContext.getHeadersForRequestAsArray();

                        expect(headers).toHaveLength(1);
                        TracingContextUtils.verifyB3Headers(
                            headers,
                            tracingSamplingRate === 100
                        );
                    }
                });

                it('returns tracing context with B3MULTI propagator and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const url = 'https://www.example.com';
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;
                        const firstPartyHosts: FirstPartyHost[] = [
                            {
                                match: 'example.com',
                                propagatorTypes: [PropagatorType.B3MULTI]
                            }
                        ];

                        const tracingContext = OoRum.getTracingContext(
                            url,
                            tracingSamplingRate,
                            firstPartyHosts
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(Object.keys(resourceContext)).toHaveLength(3);

                        TracingContextUtils.verifyRumResourceContext(
                            tracingContext
                        );

                        const headers = tracingContext.getHeadersForRequestAsArray();

                        expect(headers).toHaveLength(3);
                        TracingContextUtils.verifyB3MultiHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );
                    }
                });

                it('returns tracing context with all propagators and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const url = 'https://www.example.com';
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;
                        const firstPartyHosts: FirstPartyHost[] = [
                            {
                                match: 'example.com',
                                propagatorTypes: [
                                    PropagatorType.DATADOG,
                                    PropagatorType.TRACECONTEXT,
                                    PropagatorType.B3,
                                    PropagatorType.B3MULTI
                                ]
                            }
                        ];

                        const tracingContext = OoRum.getTracingContext(
                            url,
                            tracingSamplingRate,
                            firstPartyHosts
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(Object.keys(resourceContext)).toHaveLength(3);

                        TracingContextUtils.verifyRumResourceContext(
                            tracingContext
                        );

                        const headers = tracingContext.getHeadersForRequestAsArray();

                        expect(headers).toHaveLength(11);

                        TracingContextUtils.verifyDatadogHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );

                        TracingContextUtils.verifyTraceContextHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );

                        TracingContextUtils.verifyB3Headers(
                            headers,
                            tracingSamplingRate === 100
                        );

                        TracingContextUtils.verifyB3MultiHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );
                    }
                });

                it('injects headers and context correctly with all propagators and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const url = 'https://www.example.com';
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;
                        const firstPartyHosts: FirstPartyHost[] = [
                            {
                                match: 'example.com',
                                propagatorTypes: [
                                    PropagatorType.DATADOG,
                                    PropagatorType.TRACECONTEXT,
                                    PropagatorType.B3,
                                    PropagatorType.B3MULTI
                                ]
                            }
                        ];

                        const tracingContext = OoRum.getTracingContext(
                            url,
                            tracingSamplingRate,
                            firstPartyHosts
                        );

                        const resourceContext: Record<
                            string,
                            string | number
                        > = {};

                        tracingContext.injectRumResourceContext(
                            (attribute: string, value: string | number) => {
                                resourceContext[attribute] = value;
                            }
                        );

                        expect(Object.keys(resourceContext)).toHaveLength(3);
                        TracingContextUtils.verifyRumResourceContext(
                            tracingContext,
                            resourceContext
                        );

                        const headers: { header: string; value: string }[] = [];
                        tracingContext.injectHeadersForRequest(
                            (header: string, value: string) => {
                                headers.push({ header, value });
                            }
                        );

                        expect(headers).toHaveLength(11);

                        TracingContextUtils.verifyDatadogHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );

                        TracingContextUtils.verifyTraceContextHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );

                        TracingContextUtils.verifyB3Headers(
                            headers,
                            tracingSamplingRate === 100
                        );

                        TracingContextUtils.verifyB3MultiHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );
                    }
                });

                it('returns empty tracing context for non-matching host with all propagators and sampling rate 100', () => {
                    const url = 'https://not-the-right-host.com';
                    const firstPartyHosts: FirstPartyHost[] = [
                        {
                            match: 'example.com',
                            propagatorTypes: [
                                PropagatorType.DATADOG,
                                PropagatorType.TRACECONTEXT,
                                PropagatorType.B3,
                                PropagatorType.B3MULTI
                            ]
                        }
                    ];

                    const tracingContext = OoRum.getTracingContext(
                        url,
                        100,
                        firstPartyHosts
                    );

                    const resourceContext = tracingContext.getRumResourceContext();
                    expect(Object.keys(resourceContext)).toHaveLength(1);

                    TracingContextUtils.verifyRumResourceContext(
                        tracingContext
                    );

                    const headers = tracingContext.getHeadersForRequestAsArray();

                    expect(headers).toHaveLength(0);
                });

                it('returns empty tracing context with no propagators and sampling rate 100', () => {
                    const url = 'https://www.example.com';
                    const firstPartyHosts: FirstPartyHost[] = [
                        {
                            match: 'example.com',
                            propagatorTypes: []
                        }
                    ];

                    const tracingContext = OoRum.getTracingContext(
                        url,
                        100,
                        firstPartyHosts
                    );

                    const resourceContext = tracingContext.getRumResourceContext();
                    expect(Object.keys(resourceContext)).toHaveLength(1);

                    TracingContextUtils.verifyRumResourceContext(
                        tracingContext
                    );

                    const headers = tracingContext.getHeadersForRequestAsArray();

                    expect(headers).toHaveLength(0);
                });
            });

            describe('OoRum.getTracingContextForPropagators', () => {
                it('returns tracing context with DATADOG propagator and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;

                        const tracingContext = OoRum.getTracingContextForPropagators(
                            [PropagatorType.DATADOG],
                            tracingSamplingRate
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(Object.keys(resourceContext)).toHaveLength(3);

                        TracingContextUtils.verifyRumResourceContext(
                            tracingContext
                        );

                        const headers = tracingContext.getHeadersForRequestAsArray();
                        expect(headers).toHaveLength(5);
                        TracingContextUtils.verifyDatadogHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );
                    }
                });

                it('returns tracing context with TRACECONTEXT propagator and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;

                        const tracingContext = OoRum.getTracingContextForPropagators(
                            [PropagatorType.TRACECONTEXT],
                            tracingSamplingRate
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(Object.keys(resourceContext)).toHaveLength(3);

                        TracingContextUtils.verifyRumResourceContext(
                            tracingContext
                        );

                        const headers = tracingContext.getHeadersForRequestAsArray();

                        expect(headers).toHaveLength(2);
                        TracingContextUtils.verifyTraceContextHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );
                    }
                });

                it('returns tracing context with B3 propagator and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;

                        const tracingContext = OoRum.getTracingContextForPropagators(
                            [PropagatorType.B3],
                            tracingSamplingRate
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(Object.keys(resourceContext)).toHaveLength(3);

                        TracingContextUtils.verifyRumResourceContext(
                            tracingContext
                        );

                        const headers = tracingContext.getHeadersForRequestAsArray();

                        expect(headers).toHaveLength(1);
                        TracingContextUtils.verifyB3Headers(
                            headers,
                            tracingSamplingRate === 100
                        );
                    }
                });

                it('returns tracing context with B3MULTI propagator and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;

                        const tracingContext = OoRum.getTracingContextForPropagators(
                            [PropagatorType.B3MULTI],
                            tracingSamplingRate
                        );
                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(Object.keys(resourceContext)).toHaveLength(3);

                        TracingContextUtils.verifyRumResourceContext(
                            tracingContext
                        );

                        const headers = tracingContext.getHeadersForRequestAsArray();

                        expect(headers).toHaveLength(3);
                        TracingContextUtils.verifyB3MultiHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );
                    }
                });

                it('returns tracing context with all propagators and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;

                        const tracingContext = OoRum.getTracingContextForPropagators(
                            [
                                PropagatorType.DATADOG,
                                PropagatorType.TRACECONTEXT,
                                PropagatorType.B3MULTI,
                                PropagatorType.B3
                            ],
                            tracingSamplingRate
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(Object.keys(resourceContext)).toHaveLength(3);

                        TracingContextUtils.verifyRumResourceContext(
                            tracingContext
                        );

                        const headers = tracingContext.getHeadersForRequestAsArray();

                        expect(headers).toHaveLength(11);

                        TracingContextUtils.verifyDatadogHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );

                        TracingContextUtils.verifyTraceContextHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );

                        TracingContextUtils.verifyB3Headers(
                            headers,
                            tracingSamplingRate === 100
                        );

                        TracingContextUtils.verifyB3MultiHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );
                    }
                });

                it('tracing context contains RUM session ID in baggage when RUM Session ID is cached', () => {
                    for (let i = 0; i < 100; i++) {
                        const randomSessionId = `test-${Math.random()}`;

                        setCachedSessionId(randomSessionId);
                        const tracingContext = OoRum.getTracingContextForPropagators(
                            [
                                PropagatorType.DATADOG,
                                PropagatorType.TRACECONTEXT,
                                PropagatorType.B3MULTI,
                                PropagatorType.B3
                            ],
                            100
                        );

                        const requestHeaders = tracingContext.getHeadersForRequest();
                        expect(requestHeaders).toHaveProperty('baggage');
                        expect(requestHeaders['baggage']).toBe(
                            `session.id=${randomSessionId}`
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(resourceContext['baggage']).toBeUndefined();
                    }
                });

                it('tracing context contains User ID in baggage when User ID is cached', () => {
                    for (let i = 0; i < 100; i++) {
                        const randomUserId = `test-${Math.random()}`;

                        setCachedUserId(randomUserId);
                        const tracingContext = OoRum.getTracingContextForPropagators(
                            [
                                PropagatorType.DATADOG,
                                PropagatorType.TRACECONTEXT,
                                PropagatorType.B3MULTI,
                                PropagatorType.B3
                            ],
                            100
                        );

                        const requestHeaders = tracingContext.getHeadersForRequest();
                        expect(requestHeaders).toHaveProperty('baggage');
                        expect(requestHeaders['baggage']).toBe(
                            `user.id=${randomUserId}`
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(resourceContext['baggage']).toBeUndefined();
                    }
                });

                it('tracing context contains Account ID in baggage when Account ID is cached', () => {
                    for (let i = 0; i < 100; i++) {
                        const randomAccountId = `test-${Math.random()}`;

                        setCachedAccountId(randomAccountId);
                        const tracingContext = OoRum.getTracingContextForPropagators(
                            [
                                PropagatorType.DATADOG,
                                PropagatorType.TRACECONTEXT,
                                PropagatorType.B3MULTI,
                                PropagatorType.B3
                            ],
                            100
                        );

                        const requestHeaders = tracingContext.getHeadersForRequest();
                        expect(requestHeaders).toHaveProperty('baggage');
                        expect(requestHeaders['baggage']).toBe(
                            `account.id=${randomAccountId}`
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(resourceContext['baggage']).toBeUndefined();
                    }
                });

                it('tracing context contains User ID, Account ID and Session ID in baggage when all session info is cached', () => {
                    for (let i = 0; i < 100; i++) {
                        const randomSessionId = `session-${Math.random()}`;
                        const randomUserId = `user-${Math.random()}`;
                        const randomAccountId = `account-${Math.random()}`;

                        setCachedSessionId(randomSessionId);
                        setCachedUserId(randomUserId);
                        setCachedAccountId(randomAccountId);
                        const tracingContext = OoRum.getTracingContextForPropagators(
                            [
                                PropagatorType.DATADOG,
                                PropagatorType.TRACECONTEXT,
                                PropagatorType.B3MULTI,
                                PropagatorType.B3
                            ],
                            100
                        );

                        const requestHeaders = tracingContext.getHeadersForRequest();
                        expect(requestHeaders).toHaveProperty('baggage');
                        expect(requestHeaders['baggage']).toBe(
                            `session.id=${randomSessionId},user.id=${randomUserId},account.id=${randomAccountId}`
                        );

                        const resourceContext = tracingContext.getRumResourceContext();
                        expect(resourceContext['baggage']).toBeUndefined();
                    }
                });

                it('injects headers and context correctly with all propagators and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;
                        const tracingContext = OoRum.getTracingContextForPropagators(
                            [
                                PropagatorType.DATADOG,
                                PropagatorType.TRACECONTEXT,
                                PropagatorType.B3,
                                PropagatorType.B3MULTI
                            ],
                            tracingSamplingRate
                        );

                        const resourceContext: Record<
                            string,
                            string | number
                        > = {};

                        tracingContext.injectRumResourceContext(
                            (attribute: string, value: string | number) => {
                                resourceContext[attribute] = value;
                            }
                        );

                        expect(Object.keys(resourceContext)).toHaveLength(3);
                        TracingContextUtils.verifyRumResourceContext(
                            tracingContext,
                            resourceContext
                        );

                        const headers: { header: string; value: string }[] = [];
                        tracingContext.injectHeadersForRequest(
                            (header: string, value: string) => {
                                headers.push({ header, value });
                            }
                        );

                        expect(headers).toHaveLength(11);

                        TracingContextUtils.verifyDatadogHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );

                        TracingContextUtils.verifyTraceContextHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );

                        TracingContextUtils.verifyB3Headers(
                            headers,
                            tracingSamplingRate === 100
                        );

                        TracingContextUtils.verifyB3MultiHeaders(
                            headers,
                            tracingSamplingRate === 100
                        );
                    }
                });

                it('returns empty tracing context for empty propagators and sampling rate 100', () => {
                    const tracingContext = OoRum.getTracingContextForPropagators(
                        [],
                        100
                    );

                    const resourceContext = tracingContext.getRumResourceContext();
                    expect(Object.keys(resourceContext)).toHaveLength(1);

                    TracingContextUtils.verifyRumResourceContext(
                        tracingContext
                    );

                    const headers = tracingContext.getHeadersForRequestAsArray();

                    expect(headers).toHaveLength(0);
                });
            });
        });

        describe('OoRum.addTiming', () => {
            it('calls the native SDK when setting a timing', async () => {
                // GIVEN
                const timingName = 'testTiming';

                // WHEN
                await OoRum.addTiming(timingName);

                // THEN
                expect(NativeModules.OoRum.addTiming).toHaveBeenCalledTimes(1);
                expect(NativeModules.OoRum.addTiming).toHaveBeenCalledWith(
                    timingName
                );
            });
        });

        describe('OoRum.addViewAttribute', () => {
            it('calls the native SDK when setting a view attribute', async () => {
                // GIVEN
                const key = 'testAttribute';
                const value = { test: 'attribute' };

                // WHEN

                await OoRum.addViewAttribute(key, value);

                // THEN
                expect(
                    NativeModules.OoRum.addViewAttribute
                ).toHaveBeenCalledTimes(1);
                expect(
                    NativeModules.OoRum.addViewAttribute
                ).toHaveBeenCalledWith(key, { value });
            });
        });

        describe('OoRum.removViewAttribute', () => {
            it('calls the native SDK when removing a view attribute', async () => {
                // GIVEN
                const key = 'testAttribute';

                // WHEN
                await OoRum.removeViewAttribute(key);

                // THEN
                expect(
                    NativeModules.OoRum.removeViewAttribute
                ).toHaveBeenCalledTimes(1);
                expect(
                    NativeModules.OoRum.removeViewAttribute
                ).toHaveBeenCalledWith(key);
            });
        });

        describe('OoRum.addViewAttributes', () => {
            it('calls the native SDK when setting view attributes', async () => {
                // GIVEN
                const attributes = {
                    test: 'attribute'
                };

                // WHEN
                await OoRum.addViewAttributes(attributes);

                // THEN
                expect(
                    NativeModules.OoRum.addViewAttributes
                ).toHaveBeenCalledTimes(1);
                expect(
                    NativeModules.OoRum.addViewAttributes
                ).toHaveBeenCalledWith(attributes);
            });
        });

        describe('OoRum.removViewAttributes', () => {
            it('calls the native SDK when removing view attributes', async () => {
                // GIVEN
                const keysToDelete = ['test1', 'test2'];

                // WHEN
                await OoRum.removeViewAttributes(keysToDelete);

                // THEN
                expect(
                    NativeModules.OoRum.removeViewAttributes
                ).toHaveBeenCalledTimes(1);
                expect(
                    NativeModules.OoRum.removeViewAttributes
                ).toHaveBeenCalledWith(keysToDelete);
            });
        });

        describe('OoRum.addAction', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };
                await OoRum.addAction(RumActionType.SCROLL, 'name', context);

                expect(NativeModules.OoRum.addAction).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    null,
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');
                await OoRum.addAction(RumActionType.SCROLL, 'name', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.addAction).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    null,
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];
                await OoRum.addAction(RumActionType.SCROLL, 'name', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.addAction).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    null,
                    { context },
                    expect.anything()
                );
            });
        });

        describe('OoRum.addError', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };

                await OoRum.addError(
                    'error',
                    ErrorSource.CUSTOM,
                    'stacktrace',
                    context
                );

                expect(NativeModules.OoRum.addError).toHaveBeenCalledWith(
                    'error',
                    ErrorSource.CUSTOM,
                    'stacktrace',
                    {
                        ...context,
                        '_oo.error.source_type': 'react-native'
                    },
                    expect.anything(),
                    ''
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');
                await OoRum.addError(
                    'error',
                    ErrorSource.CUSTOM,
                    'stacktrace',
                    context
                );

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.addError).toHaveBeenCalledWith(
                    'error',
                    ErrorSource.CUSTOM,
                    'stacktrace',
                    {
                        '_oo.error.source_type': 'react-native'
                    },
                    expect.anything(),
                    ''
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];
                await OoRum.addError(
                    'error',
                    ErrorSource.CUSTOM,
                    'stacktrace',
                    context
                );

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoRum.addError).toHaveBeenCalledWith(
                    'error',
                    ErrorSource.CUSTOM,
                    'stacktrace',
                    {
                        context,
                        '_oo.error.source_type': 'react-native'
                    },
                    expect.anything(),
                    ''
                );
            });
        });
    });

    describe('OoRum.stopAction', () => {
        test('calls the native SDK when called with new API', async () => {
            await OoRum.stopAction(
                RumActionType.SCROLL,
                'page',
                { user: 'me' },
                123
            );
            expect(NativeModules.OoRum.stopAction).toHaveBeenCalledWith(
                RumActionType.SCROLL,
                'page',
                { user: 'me' },
                123
            );
        });

        test('calls the native SDK when called with new API with default values', async () => {
            await OoRum.stopAction(RumActionType.SCROLL, 'page');
            expect(NativeModules.OoRum.stopAction).toHaveBeenCalledWith(
                RumActionType.SCROLL,
                'page',
                {},
                456
            );
        });

        test('does not call the native SDK when startAction has not been called before and using old API', async () => {
            await OoRum.stopAction({ user: 'me' }, 789);
            expect(NativeModules.OoRum.stopAction).not.toHaveBeenCalled();
            expect(NativeDdSdk.telemetryDebug).not.toHaveBeenCalled();
        });

        test('calls the native SDK when called with old API', async () => {
            await OoRum.startAction(RumActionType.SCROLL, 'page_old_api');
            await OoRum.stopAction({ user: 'me' }, 789);
            expect(NativeModules.OoRum.stopAction).toHaveBeenCalledWith(
                RumActionType.SCROLL,
                'page_old_api',
                { user: 'me' },
                789
            );
            expect(NativeDdSdk.telemetryDebug).toHaveBeenCalledWith(
                'DDdRum.stopAction called with the old signature'
            );
        });

        test('calls the native SDK when called with old API with default values', async () => {
            await OoRum.startAction(RumActionType.SCROLL, 'page_old_api');
            await OoRum.stopAction();
            expect(NativeModules.OoRum.stopAction).toHaveBeenCalledWith(
                RumActionType.SCROLL,
                'page_old_api',
                {},
                456
            );
            expect(NativeDdSdk.telemetryDebug).toHaveBeenCalledWith(
                'DDdRum.stopAction called with the old signature'
            );
        });

        test('cleans the action data when stopAction is called', async () => {
            await OoRum.startAction(RumActionType.SCROLL, 'page_old_api');
            await OoRum.stopAction();
            await OoRum.stopAction();
            expect(NativeModules.OoRum.stopAction).toHaveBeenCalledTimes(1);
        });
    });

    describe('OoRumWrapper', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            BufferSingleton.onInitialization();
        });

        it('M add error source type W addError()', async () => {
            // Given
            const message = 'Oops I did it again!';
            const source = ErrorSource.SOURCE;
            const stacktrace = 'doSomething() at ./path/to/file.js:67:3';

            // When
            OoRum.addError(message, source, stacktrace);

            // Then
            expect(NativeModules.OoRum.addError.mock.calls.length).toBe(1);
            expect(NativeModules.OoRum.addError.mock.calls[0][0]).toBe(message);
            expect(NativeModules.OoRum.addError.mock.calls[0][1]).toBe(source);
            expect(NativeModules.OoRum.addError.mock.calls[0][2]).toBe(
                stacktrace
            );
            const context = NativeModules.OoRum.addError.mock.calls[0][3];
            expect(context['_oo.error.source_type']).toStrictEqual(
                'react-native'
            );
        });

        it('M add error fingerprint W addError() { with custom fingerprint }', async () => {
            // Given
            const message = 'Oops I did it again!';
            const source = ErrorSource.SOURCE;
            const stacktrace = 'doSomething() at ./path/to/file.js:67:3';

            // When
            OoRum.addError(
                message,
                source,
                stacktrace,
                undefined,
                undefined,
                'custom-fingerprint'
            );

            // Then
            expect(NativeModules.OoRum.addError.mock.calls.length).toBe(1);
            expect(NativeModules.OoRum.addError.mock.calls[0][0]).toBe(message);
            expect(NativeModules.OoRum.addError.mock.calls[0][1]).toBe(source);
            expect(NativeModules.OoRum.addError.mock.calls[0][2]).toBe(
                stacktrace
            );
            const context = NativeModules.OoRum.addError.mock.calls[0][3];
            expect(context['_oo.error.source_type']).toStrictEqual(
                'react-native'
            );
            expect(NativeModules.OoRum.addError.mock.calls[0][5]).toBe(
                'custom-fingerprint'
            );
        });

        it('M add error source type W addError() {with custom attributes}', async () => {
            // Given
            const message = 'Oops I did it again!';
            const source = ErrorSource.SOURCE;
            const stacktrace = 'doSomething() at ./path/to/file.js:67:3';
            const random = Math.random();
            const attributes = {
                foo: 'bar',
                spam: random
            };

            // When
            OoRum.addError(message, source, stacktrace, attributes);

            // Then
            expect(NativeModules.OoRum.addError.mock.calls.length).toBe(1);
            expect(NativeModules.OoRum.addError.mock.calls[0][0]).toBe(message);
            expect(NativeModules.OoRum.addError.mock.calls[0][1]).toBe(source);
            expect(NativeModules.OoRum.addError.mock.calls[0][2]).toBe(
                stacktrace
            );
            const context = NativeModules.OoRum.addError.mock.calls[0][3];
            expect(context['_oo.error.source_type']).toStrictEqual(
                'react-native'
            );
            expect(context['foo']).toStrictEqual('bar');
            expect(context['spam']).toStrictEqual(random);
        });
    });

    describe('OoRum.addError', () => {
        it('registers event mapper and maps error', async () => {
            const errorEventMapper: ErrorEventMapper = error => {
                error.message = 'New message';
                error.context = {
                    isFatal: true
                };
                return error;
            };
            OoRum.registerErrorEventMapper(errorEventMapper);

            await OoRum.addError('Old message', ErrorSource.CUSTOM, 'stack', {
                isFatal: false
            });
            expect(NativeModules.OoRum.addError).toHaveBeenCalledWith(
                'New message',
                'CUSTOM',
                'stack',
                {
                    '_oo.error.source_type': 'react-native',
                    isFatal: true
                },
                456,
                ''
            );
        });

        it('drops the event if the mapper returns null', async () => {
            const errorEventMapper: ErrorEventMapper = error => {
                return null;
            };

            OoRum.registerErrorEventMapper(errorEventMapper);

            await OoRum.addError('Old message', ErrorSource.CUSTOM, 'stack', {
                isFatal: false
            });
            expect(NativeModules.OoRum.addError).not.toHaveBeenCalled();
        });

        it('can inject fingerprint from custom mapper', async () => {
            const errorFingerprint = 'custom-error-fingerprint';
            const errorEventMapper: ErrorEventMapper = error => {
                error.fingerprint = errorFingerprint;
                return error;
            };

            OoRum.registerErrorEventMapper(errorEventMapper);

            await OoRum.addError('ERROR MESSAGE', ErrorSource.CUSTOM, 'stack', {
                isFatal: true
            });
            expect(NativeModules.OoRum.addError).toHaveBeenCalledWith(
                'ERROR MESSAGE',
                'CUSTOM',
                'stack',
                {
                    '_oo.error.source_type': 'react-native',
                    isFatal: true
                },
                456,
                errorFingerprint
            );
        });
    });

    describe('OoRum.stopResource', () => {
        it('registers event mapper and maps resource', async () => {
            const resourceEventMapper: ResourceEventMapper = resource => {
                resource.context = { retryAttempts: 3 };
                // @ts-ignore
                resource.key = 'bad key';
                // @ts-ignore
                resource.statusCode = 500;
                // @ts-ignore
                resource.kind = 'document';
                // @ts-ignore
                resource.size = 2000;
                return resource;
            };
            OoRum.registerResourceEventMapper(resourceEventMapper);

            await OoRum.startResource(
                'key',
                'GET',
                'https://my-api.com/',
                { retry: false },
                234
            );
            await OoRum.stopResource('key', 200, 'xhr', 302, {}, 245);
            expect(NativeModules.OoRum.stopResource).toHaveBeenCalledWith(
                'key',
                200,
                'xhr',
                302,
                { retryAttempts: 3 },
                245
            );
        });

        it('adds the drop context key to the event if the mapper returns null', async () => {
            const resourceEventMapper: ResourceEventMapper = resource => {
                return null;
            };

            OoRum.registerResourceEventMapper(resourceEventMapper);

            await OoRum.startResource(
                'key',
                'GET',
                'https://my-api.com/',
                { retry: false },
                234
            );
            await OoRum.stopResource(
                'key',
                200,
                'xhr',
                302,
                { someLargeUselessObject: {} },
                245
            );

            expect(NativeModules.OoRum.stopResource).toHaveBeenCalledWith(
                'key',
                200,
                'xhr',
                302,
                { '_oo.resource.drop_resource': true },
                245
            );
        });
    });

    describe('OoRum.addAction', () => {
        it('passes touch data from GestureResponderEvent to native module', async () => {
            const event = ({
                nativeEvent: {
                    target: 42,
                    locationX: 10,
                    locationY: 20,
                    pageX: 100,
                    pageY: 200
                }
            } as unknown) as GestureResponderEvent;

            await OoRum.addAction(
                RumActionType.TAP,
                'tap button',
                {},
                undefined,
                event
            );

            expect(NativeModules.OoRum.addAction).toHaveBeenCalledWith(
                'TAP',
                'tap button',
                { reactTag: 42, x: 10, y: 20, pageX: 100, pageY: 200 },
                {},
                expect.anything()
            );
        });

        it('registers event mapper and maps action', async () => {
            const actionEventMapper: ActionEventMapper = action => {
                action.context = { frustration: true };
                return action;
            };
            OoRum.registerActionEventMapper(actionEventMapper);

            await OoRum.addAction(
                RumActionType.CUSTOM,
                'Click on button',
                {},
                123
            );
            expect(NativeModules.OoRum.addAction).toHaveBeenCalledWith(
                'CUSTOM',
                'Click on button',
                null,
                {
                    frustration: true
                },
                123
            );
        });

        it('drops the event if the mapper returns null', async () => {
            const actionEventMapper: ActionEventMapper = action => {
                action.context = { frustration: true };
                return null;
            };

            OoRum.registerActionEventMapper(actionEventMapper);

            await OoRum.addAction(
                RumActionType.CUSTOM,
                'Click on button',
                {},
                123
            );

            expect(NativeModules.OoRum.addAction).not.toHaveBeenCalled();
        });
    });

    describe('OoRum.stopAction', () => {
        it('registers event mapper and maps action', async () => {
            const actionEventMapper: ActionEventMapper = action => {
                action.context = { frustration: true };
                // @ts-ignore
                action.type = 'bad type';
                // @ts-ignore
                action.name = 'bad name';
                return action;
            };
            OoRum.registerActionEventMapper(actionEventMapper);

            await OoRum.startAction(
                RumActionType.CUSTOM,
                'Click on button',
                { frustration: false },
                234
            );
            await OoRum.stopAction(
                RumActionType.CUSTOM,
                'Click on button',
                { frustration: false },
                234
            );
            expect(NativeModules.OoRum.stopAction).toHaveBeenCalledWith(
                'CUSTOM',
                'Click on button',
                { frustration: true },
                234
            );
        });

        it('adds the drop context key to the event if the mapper returns null', async () => {
            const actionEventMapper: ActionEventMapper = action => {
                return null;
            };

            OoRum.registerActionEventMapper(actionEventMapper);

            await OoRum.startAction(
                RumActionType.CUSTOM,
                'Click on button',
                { frustration: false },
                234
            );
            await OoRum.stopAction(
                RumActionType.CUSTOM,
                'Click on button',
                { frustration: false },
                234
            );

            expect(NativeModules.OoRum.stopAction).toHaveBeenCalledWith(
                'CUSTOM',
                'Click on button',
                { '_oo.action.drop_action': true },
                234
            );
        });
    });

    describe('OoRum.stopSession', () => {
        it('calls the native API', async () => {
            await OoRum.stopSession();
            expect(NativeModules.OoRum.stopSession).toHaveBeenCalledWith();
        });
    });

    describe('OoRum.getCurrentSessionId', () => {
        it('calls the native API if SDK is initialized', async () => {
            GlobalState.isInitialized = true;
            const sessionId = await OoRum.getCurrentSessionId();
            expect(NativeModules.OoRum.getCurrentSessionId).toHaveBeenCalled();
            expect(sessionId).toBe('test-session-id');
        });
    });

    describe('OoRum.getCurrentSessionId', () => {
        it('returns undefined if SDK is not initialized', async () => {
            GlobalState.isInitialized = false;
            const sessionId = await OoRum.getCurrentSessionId();
            expect(
                NativeModules.OoRum.getCurrentSessionId
            ).toHaveBeenCalledTimes(0);
            expect(sessionId).toBe(undefined);
        });
    });

    describe('OoRum.addViewLoadingTime', () => {
        it('calls the native API', async () => {
            await OoRum.addViewLoadingTime(true);
            await OoRum.addViewLoadingTime(false);

            expect(
                NativeModules.OoRum.addViewLoadingTime
            ).toHaveBeenNthCalledWith(1, true);
            expect(
                NativeModules.OoRum.addViewLoadingTime
            ).toHaveBeenNthCalledWith(2, false);
            expect(
                NativeModules.OoRum.addViewLoadingTime
            ).toHaveBeenCalledTimes(2);
        });
    });

    describe('PropagatorTypes', () => {
        it('matches with the native name of propagators', () => {
            /**
             * If you break this test by changing the value of the enum,
             * be sure to update the native implementation of
             * - ReadableArray.asTracingHeaderTypes (Android)
             * - asTracingHeaderType (iOS)
             * so that it uses the new values
             */
            expect(PropagatorType.DATADOG).toBe('datadog');
            expect(PropagatorType.B3).toBe('b3');
            expect(PropagatorType.B3MULTI).toBe('b3multi');
            expect(PropagatorType.TRACECONTEXT).toBe('tracecontext');
        });
    });
});
