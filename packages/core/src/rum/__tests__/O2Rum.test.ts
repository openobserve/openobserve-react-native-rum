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
import { BufferSingleton } from '../../sdk/OpenObserveProvider/Buffer/BufferSingleton';
import { NativeDdSdk } from '../../sdk/O2SdkInternal';
import { GlobalState } from '../../sdk/GlobalState/GlobalState';
import { ErrorSource } from '../../types';
import { O2Rum } from '../O2Rum';
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
import { OpenObserveTracingContext } from '../instrumentation/resourceTracking/distributedTracing/OpenObserveTracingContext';
import { OpenObserveTracingIdentifier } from '../instrumentation/resourceTracking/distributedTracing/OpenObserveTracingIdentifier';
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
        OPENOBSERVE_MESSAGE_PREFIX: 'OPENOBSERVE:'
    };
});

describe('O2Rum', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        BufferSingleton.onInitialization();
        clearCachedSessionId();
        clearCachedUserId();
        clearCachedAccountId();
    });

    describe('Context validation', () => {
        describe('O2Rum.startView', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };
                await O2Rum.startView('key', 'name', context);

                expect(NativeModules.O2Rum.startView).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');
                await O2Rum.startView('key', 'name', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Rum.startView).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];
                await O2Rum.startView('key', 'name', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Rum.startView).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    { context },
                    expect.anything()
                );
            });
        });

        describe('O2Rum.stopView', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };
                await O2Rum.startView('key', 'name');
                await O2Rum.stopView('key', context);

                expect(NativeModules.O2Rum.stopView).toHaveBeenCalledWith(
                    'key',
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');

                await O2Rum.startView('key', 'name');
                await O2Rum.stopView('key', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    3,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Rum.stopView).toHaveBeenCalledWith(
                    'key',
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];

                await O2Rum.startView('key', 'name');
                await O2Rum.stopView('key', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    3,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Rum.stopView).toHaveBeenCalledWith(
                    'key',
                    { context },
                    expect.anything()
                );
            });
        });

        describe('O2Rum.startAction', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };
                await O2Rum.startAction(RumActionType.SCROLL, 'name', context);

                expect(NativeModules.O2Rum.startAction).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');
                await O2Rum.startAction(RumActionType.SCROLL, 'name', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Rum.startAction).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];
                await O2Rum.startAction(RumActionType.SCROLL, 'name', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Rum.startAction).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    { context },
                    expect.anything()
                );
            });
        });

        describe('O2Rum.stopAction', () => {
            describe('New API', () => {
                test('uses given context when context is valid', async () => {
                    const context = {
                        testA: 123,
                        testB: 'ok'
                    };
                    await O2Rum.startAction(RumActionType.SCROLL, 'name');
                    await O2Rum.stopAction(
                        RumActionType.SCROLL,
                        'name',
                        context
                    );

                    expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledWith(
                        RumActionType.SCROLL,
                        'name',
                        context,
                        expect.anything()
                    );
                });

                test('uses empty context with error when context is invalid or null', async () => {
                    const context: any = Symbol('invalid-context');

                    await O2Rum.startAction(RumActionType.SCROLL, 'name');
                    await O2Rum.stopAction(
                        RumActionType.SCROLL,
                        'name',
                        context
                    );

                    expect(InternalLog.log).toHaveBeenNthCalledWith(
                        3,
                        expect.anything(),
                        SdkVerbosity.WARN
                    );

                    expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledWith(
                        RumActionType.SCROLL,
                        'name',
                        {},
                        expect.anything()
                    );
                });

                test('nests given context in new object when context is array', async () => {
                    const context: any = [123, '456'];

                    await O2Rum.startAction(RumActionType.SCROLL, 'name');
                    await O2Rum.stopAction(
                        RumActionType.SCROLL,
                        'name',
                        context
                    );

                    expect(InternalLog.log).toHaveBeenNthCalledWith(
                        3,
                        expect.anything(),
                        SdkVerbosity.WARN
                    );

                    expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledWith(
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
                    await O2Rum.startAction(RumActionType.SCROLL, 'name');
                    await O2Rum.stopAction(context);

                    expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledWith(
                        RumActionType.SCROLL,
                        'name',
                        context,
                        expect.anything()
                    );
                });

                test('uses empty context with error when context is invalid or null', async () => {
                    await O2Rum.startAction(RumActionType.SCROLL, 'name');
                    await O2Rum.stopAction(undefined);

                    expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledWith(
                        RumActionType.SCROLL,
                        'name',
                        {},
                        expect.anything()
                    );
                });

                test('nests given context in new object when context is array', async () => {
                    const context: any = [123, '456'];

                    await O2Rum.startAction(RumActionType.SCROLL, 'name');
                    await O2Rum.stopAction(context);

                    expect(InternalLog.log).toHaveBeenNthCalledWith(
                        3,
                        expect.anything(),
                        SdkVerbosity.WARN
                    );

                    expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledWith(
                        RumActionType.SCROLL,
                        'name',
                        { context },
                        expect.anything()
                    );
                });
            });
        });

        describe('O2Rum.startResource', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };
                await O2Rum.startResource('key', 'method', 'url', context);

                expect(NativeModules.O2Rum.startResource).toHaveBeenCalledWith(
                    'key',
                    'method',
                    'url',
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');

                await O2Rum.startResource('key', 'method', 'url', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    3,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Rum.startResource).toHaveBeenCalledWith(
                    'key',
                    'method',
                    'url',
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];

                await O2Rum.startResource('key', 'method', 'url', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Rum.startResource).toHaveBeenCalledWith(
                    'key',
                    'method',
                    'url',
                    { context },
                    expect.anything()
                );
            });
        });

        describe('O2Rum.stopResource', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };

                await O2Rum.startResource('key', 'method', 'url', {});
                await O2Rum.stopResource('key', 200, 'other', -1, context);

                expect(NativeModules.O2Rum.stopResource).toHaveBeenCalledWith(
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

                await O2Rum.startResource('key', 'method', 'url', {});
                await O2Rum.stopResource('key', 200, 'other', -1, context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    3,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Rum.stopResource).toHaveBeenCalledWith(
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

                await O2Rum.startResource('key', 'method', 'url', {});
                await O2Rum.stopResource('key', 200, 'other', -1, context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    3,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Rum.stopResource).toHaveBeenCalledWith(
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

                it('exposes OpenObserveTracingIdentifier enum', () => {
                    expect(OpenObserveTracingIdentifier).toBeDefined();
                });

                it('exposes OpenObserveTracingContext class', () => {
                    expect(OpenObserveTracingContext).toBeDefined();
                });
            });

            describe('O2Rum.generateTraceId', () => {
                it('generates 128-bit trace ID (100 iterations)', () => {
                    for (let i = 0; i < 100; i++) {
                        const traceId = O2Rum.generateTraceId();
                        expect(traceId).toBeDefined();
                        expect(
                            TracingIdentifierUtils.isWithin128Bits(
                                traceId.toString(TracingIdFormat.decimal)
                            )
                        ).toBe(true);
                    }
                });
            });

            describe('O2Rum.generateSpanId', () => {
                it('generates 64-bit span ID (100 iterations)', () => {
                    for (let i = 0; i < 100; i++) {
                        const spanId = O2Rum.generateSpanId();
                        expect(spanId).toBeDefined();
                        expect(
                            TracingIdentifierUtils.isWithin64Bits(
                                spanId.toString(TracingIdFormat.decimal)
                            )
                        ).toBe(true);
                    }
                });
            });

            describe('O2Rum.getTracingContext', () => {
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

                        const tracingContext = O2Rum.getTracingContext(
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

                        const tracingContext = O2Rum.getTracingContext(
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

                        const tracingContext = O2Rum.getTracingContext(
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
                                                                        PropagatorType.TRACECONTEXT,
                                    PropagatorType.B3,
                                    PropagatorType.B3MULTI
                                ]
                            }
                        ];

                        const tracingContext = O2Rum.getTracingContext(
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

                        expect(headers).toHaveLength(6);

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
                                                                        PropagatorType.TRACECONTEXT,
                                    PropagatorType.B3,
                                    PropagatorType.B3MULTI
                                ]
                            }
                        ];

                        const tracingContext = O2Rum.getTracingContext(
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

                        expect(headers).toHaveLength(6);

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
                                                                PropagatorType.TRACECONTEXT,
                                PropagatorType.B3,
                                PropagatorType.B3MULTI
                            ]
                        }
                    ];

                    const tracingContext = O2Rum.getTracingContext(
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

                    const tracingContext = O2Rum.getTracingContext(
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

            describe('O2Rum.getTracingContextForPropagators', () => {
                it('returns tracing context with TRACECONTEXT propagator and sampling rate (50% 0, 50% 100)', () => {
                    for (let i = 0; i < 100; i++) {
                        const tracingSamplingRate =
                            Math.random() < 0.5 ? 0 : 100;

                        const tracingContext = O2Rum.getTracingContextForPropagators(
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

                        const tracingContext = O2Rum.getTracingContextForPropagators(
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

                        const tracingContext = O2Rum.getTracingContextForPropagators(
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

                        const tracingContext = O2Rum.getTracingContextForPropagators(
                            [
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

                        expect(headers).toHaveLength(6);

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
                        const tracingContext = O2Rum.getTracingContextForPropagators(
                            [
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
                        const tracingContext = O2Rum.getTracingContextForPropagators(
                            [
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
                        const tracingContext = O2Rum.getTracingContextForPropagators(
                            [
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
                        const tracingContext = O2Rum.getTracingContextForPropagators(
                            [
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
                        const tracingContext = O2Rum.getTracingContextForPropagators(
                            [
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

                        expect(headers).toHaveLength(6);

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
                    const tracingContext = O2Rum.getTracingContextForPropagators(
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

        describe('O2Rum.addTiming', () => {
            it('calls the native SDK when setting a timing', async () => {
                // GIVEN
                const timingName = 'testTiming';

                // WHEN
                await O2Rum.addTiming(timingName);

                // THEN
                expect(NativeModules.O2Rum.addTiming).toHaveBeenCalledTimes(1);
                expect(NativeModules.O2Rum.addTiming).toHaveBeenCalledWith(
                    timingName
                );
            });
        });

        describe('O2Rum.addViewAttribute', () => {
            it('calls the native SDK when setting a view attribute', async () => {
                // GIVEN
                const key = 'testAttribute';
                const value = { test: 'attribute' };

                // WHEN

                await O2Rum.addViewAttribute(key, value);

                // THEN
                expect(
                    NativeModules.O2Rum.addViewAttribute
                ).toHaveBeenCalledTimes(1);
                expect(
                    NativeModules.O2Rum.addViewAttribute
                ).toHaveBeenCalledWith(key, { value });
            });
        });

        describe('O2Rum.removViewAttribute', () => {
            it('calls the native SDK when removing a view attribute', async () => {
                // GIVEN
                const key = 'testAttribute';

                // WHEN
                await O2Rum.removeViewAttribute(key);

                // THEN
                expect(
                    NativeModules.O2Rum.removeViewAttribute
                ).toHaveBeenCalledTimes(1);
                expect(
                    NativeModules.O2Rum.removeViewAttribute
                ).toHaveBeenCalledWith(key);
            });
        });

        describe('O2Rum.addViewAttributes', () => {
            it('calls the native SDK when setting view attributes', async () => {
                // GIVEN
                const attributes = {
                    test: 'attribute'
                };

                // WHEN
                await O2Rum.addViewAttributes(attributes);

                // THEN
                expect(
                    NativeModules.O2Rum.addViewAttributes
                ).toHaveBeenCalledTimes(1);
                expect(
                    NativeModules.O2Rum.addViewAttributes
                ).toHaveBeenCalledWith(attributes);
            });
        });

        describe('O2Rum.removViewAttributes', () => {
            it('calls the native SDK when removing view attributes', async () => {
                // GIVEN
                const keysToDelete = ['test1', 'test2'];

                // WHEN
                await O2Rum.removeViewAttributes(keysToDelete);

                // THEN
                expect(
                    NativeModules.O2Rum.removeViewAttributes
                ).toHaveBeenCalledTimes(1);
                expect(
                    NativeModules.O2Rum.removeViewAttributes
                ).toHaveBeenCalledWith(keysToDelete);
            });
        });

        describe('O2Rum.addAction', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };
                await O2Rum.addAction(RumActionType.SCROLL, 'name', context);

                expect(NativeModules.O2Rum.addAction).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    null,
                    context,
                    expect.anything()
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');
                await O2Rum.addAction(RumActionType.SCROLL, 'name', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Rum.addAction).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    null,
                    {},
                    expect.anything()
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];
                await O2Rum.addAction(RumActionType.SCROLL, 'name', context);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.O2Rum.addAction).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.anything(),
                    null,
                    { context },
                    expect.anything()
                );
            });
        });

        describe('O2Rum.addError', () => {
            test('uses given context when context is valid', async () => {
                const context = {
                    testA: 123,
                    testB: 'ok'
                };

                await O2Rum.addError(
                    'error',
                    ErrorSource.CUSTOM,
                    'stacktrace',
                    context
                );

                expect(NativeModules.O2Rum.addError).toHaveBeenCalledWith(
                    'error',
                    ErrorSource.CUSTOM,
                    'stacktrace',
                    {
                        ...context,
                        '_o2.error.source_type': 'react-native'
                    },
                    expect.anything(),
                    ''
                );
            });

            test('uses empty context with error when context is invalid or null', async () => {
                const context: any = Symbol('invalid-context');
                await O2Rum.addError(
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

                expect(NativeModules.O2Rum.addError).toHaveBeenCalledWith(
                    'error',
                    ErrorSource.CUSTOM,
                    'stacktrace',
                    {
                        '_o2.error.source_type': 'react-native'
                    },
                    expect.anything(),
                    ''
                );
            });

            test('nests given context in new object when context is array', async () => {
                const context: any = [123, '456'];
                await O2Rum.addError(
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

                expect(NativeModules.O2Rum.addError).toHaveBeenCalledWith(
                    'error',
                    ErrorSource.CUSTOM,
                    'stacktrace',
                    {
                        context,
                        '_o2.error.source_type': 'react-native'
                    },
                    expect.anything(),
                    ''
                );
            });
        });
    });

    describe('O2Rum.stopAction', () => {
        test('calls the native SDK when called with new API', async () => {
            await O2Rum.stopAction(
                RumActionType.SCROLL,
                'page',
                { user: 'me' },
                123
            );
            expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledWith(
                RumActionType.SCROLL,
                'page',
                { user: 'me' },
                123
            );
        });

        test('calls the native SDK when called with new API with default values', async () => {
            await O2Rum.stopAction(RumActionType.SCROLL, 'page');
            expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledWith(
                RumActionType.SCROLL,
                'page',
                {},
                456
            );
        });

        test('does not call the native SDK when startAction has not been called before and using old API', async () => {
            await O2Rum.stopAction({ user: 'me' }, 789);
            expect(NativeModules.O2Rum.stopAction).not.toHaveBeenCalled();
            expect(NativeDdSdk.telemetryDebug).not.toHaveBeenCalled();
        });

        test('calls the native SDK when called with old API', async () => {
            await O2Rum.startAction(RumActionType.SCROLL, 'page_old_api');
            await O2Rum.stopAction({ user: 'me' }, 789);
            expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledWith(
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
            await O2Rum.startAction(RumActionType.SCROLL, 'page_old_api');
            await O2Rum.stopAction();
            expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledWith(
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
            await O2Rum.startAction(RumActionType.SCROLL, 'page_old_api');
            await O2Rum.stopAction();
            await O2Rum.stopAction();
            expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledTimes(1);
        });
    });

    describe('O2RumWrapper', () => {
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
            O2Rum.addError(message, source, stacktrace);

            // Then
            expect(NativeModules.O2Rum.addError.mock.calls.length).toBe(1);
            expect(NativeModules.O2Rum.addError.mock.calls[0][0]).toBe(message);
            expect(NativeModules.O2Rum.addError.mock.calls[0][1]).toBe(source);
            expect(NativeModules.O2Rum.addError.mock.calls[0][2]).toBe(
                stacktrace
            );
            const context = NativeModules.O2Rum.addError.mock.calls[0][3];
            expect(context['_o2.error.source_type']).toStrictEqual(
                'react-native'
            );
        });

        it('M add error fingerprint W addError() { with custom fingerprint }', async () => {
            // Given
            const message = 'Oops I did it again!';
            const source = ErrorSource.SOURCE;
            const stacktrace = 'doSomething() at ./path/to/file.js:67:3';

            // When
            O2Rum.addError(
                message,
                source,
                stacktrace,
                undefined,
                undefined,
                'custom-fingerprint'
            );

            // Then
            expect(NativeModules.O2Rum.addError.mock.calls.length).toBe(1);
            expect(NativeModules.O2Rum.addError.mock.calls[0][0]).toBe(message);
            expect(NativeModules.O2Rum.addError.mock.calls[0][1]).toBe(source);
            expect(NativeModules.O2Rum.addError.mock.calls[0][2]).toBe(
                stacktrace
            );
            const context = NativeModules.O2Rum.addError.mock.calls[0][3];
            expect(context['_o2.error.source_type']).toStrictEqual(
                'react-native'
            );
            expect(NativeModules.O2Rum.addError.mock.calls[0][5]).toBe(
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
            O2Rum.addError(message, source, stacktrace, attributes);

            // Then
            expect(NativeModules.O2Rum.addError.mock.calls.length).toBe(1);
            expect(NativeModules.O2Rum.addError.mock.calls[0][0]).toBe(message);
            expect(NativeModules.O2Rum.addError.mock.calls[0][1]).toBe(source);
            expect(NativeModules.O2Rum.addError.mock.calls[0][2]).toBe(
                stacktrace
            );
            const context = NativeModules.O2Rum.addError.mock.calls[0][3];
            expect(context['_o2.error.source_type']).toStrictEqual(
                'react-native'
            );
            expect(context['foo']).toStrictEqual('bar');
            expect(context['spam']).toStrictEqual(random);
        });
    });

    describe('O2Rum.addError', () => {
        it('registers event mapper and maps error', async () => {
            const errorEventMapper: ErrorEventMapper = error => {
                error.message = 'New message';
                error.context = {
                    isFatal: true
                };
                return error;
            };
            O2Rum.registerErrorEventMapper(errorEventMapper);

            await O2Rum.addError('Old message', ErrorSource.CUSTOM, 'stack', {
                isFatal: false
            });
            expect(NativeModules.O2Rum.addError).toHaveBeenCalledWith(
                'New message',
                'CUSTOM',
                'stack',
                {
                    '_o2.error.source_type': 'react-native',
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

            O2Rum.registerErrorEventMapper(errorEventMapper);

            await O2Rum.addError('Old message', ErrorSource.CUSTOM, 'stack', {
                isFatal: false
            });
            expect(NativeModules.O2Rum.addError).not.toHaveBeenCalled();
        });

        it('can inject fingerprint from custom mapper', async () => {
            const errorFingerprint = 'custom-error-fingerprint';
            const errorEventMapper: ErrorEventMapper = error => {
                error.fingerprint = errorFingerprint;
                return error;
            };

            O2Rum.registerErrorEventMapper(errorEventMapper);

            await O2Rum.addError('ERROR MESSAGE', ErrorSource.CUSTOM, 'stack', {
                isFatal: true
            });
            expect(NativeModules.O2Rum.addError).toHaveBeenCalledWith(
                'ERROR MESSAGE',
                'CUSTOM',
                'stack',
                {
                    '_o2.error.source_type': 'react-native',
                    isFatal: true
                },
                456,
                errorFingerprint
            );
        });
    });

    describe('O2Rum.stopResource', () => {
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
            O2Rum.registerResourceEventMapper(resourceEventMapper);

            await O2Rum.startResource(
                'key',
                'GET',
                'https://my-api.com/',
                { retry: false },
                234
            );
            await O2Rum.stopResource('key', 200, 'xhr', 302, {}, 245);
            expect(NativeModules.O2Rum.stopResource).toHaveBeenCalledWith(
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

            O2Rum.registerResourceEventMapper(resourceEventMapper);

            await O2Rum.startResource(
                'key',
                'GET',
                'https://my-api.com/',
                { retry: false },
                234
            );
            await O2Rum.stopResource(
                'key',
                200,
                'xhr',
                302,
                { someLargeUselessObject: {} },
                245
            );

            expect(NativeModules.O2Rum.stopResource).toHaveBeenCalledWith(
                'key',
                200,
                'xhr',
                302,
                { '_o2.resource.drop_resource': true },
                245
            );
        });
    });

    describe('O2Rum.addAction', () => {
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

            await O2Rum.addAction(
                RumActionType.TAP,
                'tap button',
                {},
                undefined,
                event
            );

            expect(NativeModules.O2Rum.addAction).toHaveBeenCalledWith(
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
            O2Rum.registerActionEventMapper(actionEventMapper);

            await O2Rum.addAction(
                RumActionType.CUSTOM,
                'Click on button',
                {},
                123
            );
            expect(NativeModules.O2Rum.addAction).toHaveBeenCalledWith(
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

            O2Rum.registerActionEventMapper(actionEventMapper);

            await O2Rum.addAction(
                RumActionType.CUSTOM,
                'Click on button',
                {},
                123
            );

            expect(NativeModules.O2Rum.addAction).not.toHaveBeenCalled();
        });
    });

    describe('O2Rum.stopAction', () => {
        it('registers event mapper and maps action', async () => {
            const actionEventMapper: ActionEventMapper = action => {
                action.context = { frustration: true };
                // @ts-ignore
                action.type = 'bad type';
                // @ts-ignore
                action.name = 'bad name';
                return action;
            };
            O2Rum.registerActionEventMapper(actionEventMapper);

            await O2Rum.startAction(
                RumActionType.CUSTOM,
                'Click on button',
                { frustration: false },
                234
            );
            await O2Rum.stopAction(
                RumActionType.CUSTOM,
                'Click on button',
                { frustration: false },
                234
            );
            expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledWith(
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

            O2Rum.registerActionEventMapper(actionEventMapper);

            await O2Rum.startAction(
                RumActionType.CUSTOM,
                'Click on button',
                { frustration: false },
                234
            );
            await O2Rum.stopAction(
                RumActionType.CUSTOM,
                'Click on button',
                { frustration: false },
                234
            );

            expect(NativeModules.O2Rum.stopAction).toHaveBeenCalledWith(
                'CUSTOM',
                'Click on button',
                { '_o2.action.drop_action': true },
                234
            );
        });
    });

    describe('O2Rum.stopSession', () => {
        it('calls the native API', async () => {
            await O2Rum.stopSession();
            expect(NativeModules.O2Rum.stopSession).toHaveBeenCalledWith();
        });
    });

    describe('O2Rum.getCurrentSessionId', () => {
        it('calls the native API if SDK is initialized', async () => {
            GlobalState.isInitialized = true;
            const sessionId = await O2Rum.getCurrentSessionId();
            expect(NativeModules.O2Rum.getCurrentSessionId).toHaveBeenCalled();
            expect(sessionId).toBe('test-session-id');
        });
    });

    describe('O2Rum.getCurrentSessionId', () => {
        it('returns undefined if SDK is not initialized', async () => {
            GlobalState.isInitialized = false;
            const sessionId = await O2Rum.getCurrentSessionId();
            expect(
                NativeModules.O2Rum.getCurrentSessionId
            ).toHaveBeenCalledTimes(0);
            expect(sessionId).toBe(undefined);
        });
    });

    describe('O2Rum.addViewLoadingTime', () => {
        it('calls the native API', async () => {
            await O2Rum.addViewLoadingTime(true);
            await O2Rum.addViewLoadingTime(false);

            expect(
                NativeModules.O2Rum.addViewLoadingTime
            ).toHaveBeenNthCalledWith(1, true);
            expect(
                NativeModules.O2Rum.addViewLoadingTime
            ).toHaveBeenNthCalledWith(2, false);
            expect(
                NativeModules.O2Rum.addViewLoadingTime
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
            expect(PropagatorType.B3).toBe('b3');
            expect(PropagatorType.B3MULTI).toBe('b3multi');
            expect(PropagatorType.TRACECONTEXT).toBe('tracecontext');
        });
    });
});
