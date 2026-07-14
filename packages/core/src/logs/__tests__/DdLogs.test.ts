/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { NativeModules } from 'react-native';

import { OoSdkReactNative } from '../../OoSdkReactNative';
import { InternalLog } from '../../InternalLog';
import { CoreConfiguration } from '../../config/features/CoreConfiguration';
import { LogsConfiguration } from '../../config/features/LogsConfiguration';
import { RumConfiguration } from '../../config/features/RumConfiguration';
import { SdkVerbosity } from '../../config/types';
import { BufferSingleton } from '../../sdk/DatadogProvider/Buffer/BufferSingleton';
import { ErrorSource } from '../../types';
import type { LogEventMapper, LogEvent } from '../../types';
import { OoLogs } from '../OoLogs';

jest.mock('../../InternalLog', () => {
    return {
        InternalLog: {
            log: jest.fn()
        },
        DATADOG_MESSAGE_PREFIX: 'DATADOG:'
    };
});

describe('OoLogs', () => {
    describe('log event mapper', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            OoLogs.unregisterLogEventMapper();
            BufferSingleton.onInitialization();
        });

        it('registers event mapper and maps logs', async () => {
            const logEventMapper: LogEventMapper = log => {
                return {
                    message: 'new message',
                    context: { newContext: 'context' },
                    status: 'info',
                    userInfo: {}
                } as LogEvent;
            };
            OoLogs.registerLogEventMapper(logEventMapper);

            await OoLogs.info('original message', {});
            expect(
                NativeModules.OoLogs.info
            ).toHaveBeenCalledWith('new message', { newContext: 'context' });

            expect(InternalLog.log).toHaveBeenNthCalledWith(
                1,
                'Tracking info log "new message"',
                'debug'
            );

            await OoLogs.debug(
                'original message',
                'TypeError',
                'error message',
                'stack',
                {}
            );
            expect(NativeModules.OoLogs.debugWithError).toHaveBeenCalledWith(
                'new message',
                undefined,
                undefined,
                undefined,
                {
                    newContext: 'context',
                    '_oo.error.source_type': 'react-native'
                }
            );
            expect(InternalLog.log).toHaveBeenNthCalledWith(
                2,
                'Tracking debug log "new message"',
                'debug'
            );
        });

        it('registers event mapper and maps logs with errors', async () => {
            const logEventMapper: LogEventMapper = log => {
                log.message = 'new message';
                if (log.errorKind) {
                    log.errorKind = 'NewErrorType';
                }
                if (log.errorMessage) {
                    log.errorMessage = 'new error message';
                }
                if (log.stacktrace) {
                    log.stacktrace = 'new stacktrace';
                }
                log.context = { newContext: 'context' };
                return log;
            };
            OoLogs.registerLogEventMapper(logEventMapper);

            await OoLogs.info('original message', {});
            expect(
                NativeModules.OoLogs.info
            ).toHaveBeenCalledWith('new message', { newContext: 'context' });
            await OoLogs.info(
                'original message',
                'TypeError',
                'error message',
                'stack',
                {}
            );
            expect(NativeModules.OoLogs.infoWithError).toHaveBeenCalledWith(
                'new message',
                'NewErrorType',
                'new error message',
                'new stacktrace',
                {
                    newContext: 'context',
                    '_oo.error.source_type': 'react-native'
                }
            );
        });

        it('sends initial log if no event mapper is registered', async () => {
            await OoLogs.info('original message', {});
            expect(NativeModules.OoLogs.info).toHaveBeenCalledWith(
                'original message',
                {}
            );
        });

        it('drops the event if the mapper returns null', async () => {
            const logEventMapper: LogEventMapper = log => {
                return null;
            };
            OoLogs.registerLogEventMapper(logEventMapper);

            await OoLogs.info('original message', {});
            expect(NativeModules.OoLogs.info).not.toHaveBeenCalled();
            expect(InternalLog.log).toHaveBeenCalledWith(
                'info log dropped by log mapper: "original message"',
                'debug'
            );
        });

        it('log with error events can be filtered by error source', async () => {
            const logEventMapper: LogEventMapper = logEvent => {
                if (logEvent.source === ErrorSource.CONSOLE) {
                    return null;
                }

                return logEvent;
            };

            OoLogs.registerLogEventMapper(logEventMapper);

            await OoLogs.error(
                'message',
                'kind',
                'message',
                'stacktrace',
                {},
                'fingerprint',
                ErrorSource.CONSOLE
            );

            // Call with filtered ErrorSource.CONSOLE type
            expect(NativeModules.OoLogs.error).not.toHaveBeenCalled();
            expect(InternalLog.log).toHaveBeenCalledWith(
                'error log dropped by log mapper: "message"',
                'debug'
            );

            // Call with valid ErrorSource.CUSTOM type
            await OoLogs.error(
                'message',
                'kind',
                'message',
                'stacktrace',
                {},
                'fingerprint',
                ErrorSource.CUSTOM
            );

            expect(NativeModules.OoLogs.errorWithError).toHaveBeenCalledWith(
                'message',
                'kind',
                'message',
                'stacktrace',
                {
                    '_oo.error.fingerprint': 'fingerprint',
                    '_oo.error.source_type': 'react-native'
                }
            );
            expect(InternalLog.log).toHaveBeenCalledWith(
                'Tracking error log "message"',
                'debug'
            );
        });

        it('console errors can be filtered with mappers when trackErrors=true', async () => {
            // GIVEN
            const fakeAppId = '1';
            const fakeClientToken = '2';
            const fakeEnvName = 'env';
            const configuration = new CoreConfiguration(
                fakeClientToken,
                fakeEnvName
            );
            configuration.rumConfiguration = new RumConfiguration(
                fakeAppId,
                false,
                false,
                true
            );

            // Register log event mapper to filter console log events
            configuration.logsConfiguration = new LogsConfiguration({
                logEventMapper: logEvent => {
                    if (logEvent.source === ErrorSource.CONSOLE) {
                        return null;
                    }

                    return logEvent;
                }
            });

            NativeModules.OoSdk.initialize.mockResolvedValue(null);

            // WHEN
            await OoSdkReactNative.initialize(configuration);

            console.error('console-error-message');
            expect(NativeModules.OoLogs.error).not.toHaveBeenCalled();
            expect(InternalLog.log).toHaveBeenCalledWith(
                'Adding RUM Error “console-error-message”',
                'debug'
            );

            // Call with valid ErrorSource.CUSTOM type
            await OoLogs.error(
                'message',
                'kind',
                'message',
                'stacktrace',
                {},
                'fingerprint',
                ErrorSource.CUSTOM
            );

            expect(NativeModules.OoLogs.errorWithError).toHaveBeenCalledWith(
                'message',
                'kind',
                'message',
                'stacktrace',
                {
                    '_oo.error.fingerprint': 'fingerprint',
                    '_oo.error.source_type': 'react-native'
                }
            );
            expect(InternalLog.log).toHaveBeenCalledWith(
                'Tracking error log "message"',
                'debug'
            );
        });

        it('console errors are reported in logs when trackErrors=true', async () => {
            // GIVEN
            const fakeAppId = '1';
            const fakeClientToken = '2';
            const fakeEnvName = 'env';
            const configuration = new CoreConfiguration(
                fakeClientToken,
                fakeEnvName
            );

            configuration.rumConfiguration = new RumConfiguration(
                fakeAppId,
                false,
                false,
                true
            );

            NativeModules.OoSdk.initialize.mockResolvedValue(null);

            // WHEN
            await OoSdkReactNative.initialize(configuration);

            console.error('console-error-message');
            expect(NativeModules.OoLogs.error).not.toHaveBeenCalled();
            expect(InternalLog.log).toHaveBeenCalledWith(
                'Adding RUM Error “console-error-message”',
                'debug'
            );
        });
    });

    describe('log with error', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            OoLogs.unregisterLogEventMapper();
        });
        it.each([
            ['kind', 'message', 'stacktrace', { context: 'value' }],
            // 1 argument is undefined
            [undefined, 'message', 'stacktrace', { context: 'value' }],
            ['kind', undefined, 'stacktrace', { context: 'value' }],
            ['kind', 'message', undefined, { context: 'value' }],
            ['kind', 'message', 'stacktrace', undefined],
            // 2 arguments are undefined
            [undefined, undefined, 'stacktrace', { context: 'value' }],
            [undefined, 'message', undefined, { context: 'value' }],
            [undefined, 'message', 'stacktrace', undefined],
            ['kind', undefined, undefined, { context: 'value' }],
            ['kind', undefined, 'stacktrace', undefined],
            ['kind', 'message', undefined, undefined],
            // 3 arguments are undefined
            [undefined, undefined, 'stacktrace', undefined],
            [undefined, 'message', undefined, undefined],
            ['kind', undefined, undefined, undefined],
            [undefined, undefined, undefined, { context: 'value' }]
        ])(
            'sends error info when provided for %s %s %s %s',
            async (errorKind, errorMessage, stacktrace, context) => {
                await OoLogs.info(
                    'message',
                    errorKind,
                    errorMessage,
                    stacktrace,
                    context
                );
                expect(NativeModules.OoLogs.infoWithError).toHaveBeenCalledWith(
                    'message',
                    errorKind,
                    errorMessage,
                    stacktrace,
                    {
                        ...(context || {}),
                        '_oo.error.source_type': 'react-native'
                    }
                );
            }
        );

        it.each([
            [
                'kind',
                'message',
                'stacktrace',
                { context: 'value' },
                'custom-fingerprint-0'
            ],
            // 1 argument is undefined
            [
                undefined,
                'message',
                'stacktrace',
                { context: 'value' },
                'custom-fingerprint-1'
            ],
            [
                'kind',
                undefined,
                'stacktrace',
                { context: 'value' },
                'custom-fingerprint-2'
            ],
            [
                'kind',
                'message',
                undefined,
                { context: 'value' },
                'custom-fingerprint-3'
            ],
            ['kind', 'message', 'stacktrace', undefined, 'custom-fingerprint'],
            // 2 arguments are undefined
            [
                undefined,
                undefined,
                'stacktrace',
                { context: 'value' },
                'custom-fingerprint-4'
            ],
            [
                undefined,
                'message',
                undefined,
                { context: 'value' },
                'custom-fingerprint-5'
            ],
            [
                undefined,
                'message',
                'stacktrace',
                undefined,
                'custom-fingerprint-6'
            ],
            [
                'kind',
                undefined,
                undefined,
                { context: 'value' },
                'custom-fingerprint-7'
            ],
            [
                'kind',
                undefined,
                'stacktrace',
                undefined,
                'custom-fingerprint-8'
            ],
            ['kind', 'message', undefined, undefined, 'custom-fingerprint-9'],
            // 3 arguments are undefined
            [
                undefined,
                undefined,
                'stacktrace',
                undefined,
                'custom-fingerprint-10'
            ],
            [
                undefined,
                'message',
                undefined,
                undefined,
                'custom-fingerprint-11'
            ],
            ['kind', undefined, undefined, undefined, 'custom-fingerprint-12'],
            [
                undefined,
                undefined,
                undefined,
                { context: 'value' },
                'custom-fingerprint-13'
            ]
        ])(
            'sends error info with custom fingerprint when provided for %s %s %s %s %s',
            async (
                errorKind,
                errorMessage,
                stacktrace,
                context,
                fingerprint
            ) => {
                await OoLogs.info(
                    'message',
                    errorKind,
                    errorMessage,
                    stacktrace,
                    context,
                    fingerprint
                );
                expect(NativeModules.OoLogs.infoWithError).toHaveBeenCalledWith(
                    'message',
                    errorKind,
                    errorMessage,
                    stacktrace,
                    {
                        ...(context || {}),
                        '_oo.error.source_type': 'react-native',
                        '_oo.error.fingerprint': fingerprint
                    }
                );
            }
        );

        it('does not send error info when no error and no context is passed', async () => {
            await OoLogs.info(
                'message',
                undefined,
                undefined,
                undefined,
                undefined
            );
            expect(NativeModules.OoLogs.info).toHaveBeenCalledWith(
                'message',
                {}
            );
        });
    });

    describe('log context', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            OoLogs.unregisterLogEventMapper();
        });

        describe('debug logs', () => {
            it('native context is empty W context is undefined', async () => {
                await OoLogs.debug('message', undefined);
                expect(NativeModules.OoLogs.debug).toHaveBeenCalledWith(
                    'message',
                    {}
                );
            });

            it('native context is an object with nested property W context is an array', async () => {
                await OoLogs.debug('message', [1, 2, 3]);
                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );
                expect(
                    NativeModules.OoLogs.debug
                ).toHaveBeenCalledWith('message', { context: [1, 2, 3] });
            });

            it('native context is empty W context is raw type', async () => {
                const obj: any = Symbol('invalid-context');
                await OoLogs.debug('message', obj);
                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );
                expect(NativeModules.OoLogs.debug).toHaveBeenCalledWith(
                    'message',
                    {}
                );
            });

            it('native context is unmodified W context is a valid object', async () => {
                await OoLogs.debug('message', { test: '123' });
                expect(
                    NativeModules.OoLogs.debug
                ).toHaveBeenCalledWith('message', { test: '123' });
            });
        });

        describe('warn logs', () => {
            it('native context is empty W context is undefined', async () => {
                await OoLogs.warn('message', undefined);
                expect(NativeModules.OoLogs.warn).toHaveBeenCalledWith(
                    'message',
                    {}
                );
            });

            it('native context is an object with nested property W context is an array', async () => {
                await OoLogs.warn('message', [1, 2, 3]);
                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );
                expect(
                    NativeModules.OoLogs.warn
                ).toHaveBeenCalledWith('message', { context: [1, 2, 3] });
            });

            it('native context is empty W context is raw type', async () => {
                const obj: any = Symbol('invalid-context');
                await OoLogs.warn('message', obj);
                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );
                expect(NativeModules.OoLogs.warn).toHaveBeenCalledWith(
                    'message',
                    {}
                );
            });

            it('native context is unmodified W context is a valid object', async () => {
                await OoLogs.warn('message', { test: '123' });
                expect(
                    NativeModules.OoLogs.warn
                ).toHaveBeenCalledWith('message', { test: '123' });
            });
        });

        describe('info logs', () => {
            it('native context is empty W context is undefined', async () => {
                await OoLogs.info('message', undefined);
                expect(NativeModules.OoLogs.info).toHaveBeenCalledWith(
                    'message',
                    {}
                );
            });

            it('native context is an object with nested property W context is an array', async () => {
                await OoLogs.info('message', [1, 2, 3]);
                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );
                expect(
                    NativeModules.OoLogs.info
                ).toHaveBeenCalledWith('message', { context: [1, 2, 3] });
            });

            it('native context is empty W context is raw type', async () => {
                const obj: any = Symbol('invalid-context');
                await OoLogs.info('message', obj);
                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );
                expect(NativeModules.OoLogs.info).toHaveBeenCalledWith(
                    'message',
                    {}
                );
            });

            it('native context is unmodified W context is a valid object', async () => {
                await OoLogs.info('message', { test: '123' });
                expect(
                    NativeModules.OoLogs.info
                ).toHaveBeenCalledWith('message', { test: '123' });
            });
        });

        describe('error logs', () => {
            it('native context is empty W context is undefined', async () => {
                await OoLogs.error('message', undefined);
                expect(NativeModules.OoLogs.error).toHaveBeenCalledWith(
                    'message',
                    {}
                );
            });

            it('native context is an object with nested property W context is an array', async () => {
                await OoLogs.error('message', [1, 2, 3]);
                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );
                expect(
                    NativeModules.OoLogs.error
                ).toHaveBeenCalledWith('message', { context: [1, 2, 3] });
            });

            it('native context is empty W context is raw type', async () => {
                const obj: any = Symbol('invalid-context');
                await OoLogs.error('message', obj);
                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );
                expect(NativeModules.OoLogs.error).toHaveBeenCalledWith(
                    'message',
                    {}
                );
            });

            it('native context is unmodified W context is a valid object', async () => {
                await OoLogs.error('message', { test: '123' });
                expect(
                    NativeModules.OoLogs.error
                ).toHaveBeenCalledWith('message', { test: '123' });
            });
        });
    });

    describe('log with error context', () => {
        beforeEach(() => {
            jest.clearAllMocks();
            OoLogs.unregisterLogEventMapper();
        });

        describe('debug logs', () => {
            it('native context is empty W context is undefined', async () => {
                await OoLogs.debug(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    undefined
                );
                expect(
                    NativeModules.OoLogs.debugWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    { '_oo.error.source_type': 'react-native' }
                );
            });

            it('native context is an object with nested property W context is an array', async () => {
                await OoLogs.debug('message', 'kind', 'message', 'stacktrace', [
                    1,
                    2,
                    3
                ]);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(
                    NativeModules.OoLogs.debugWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    {
                        context: [1, 2, 3],
                        '_oo.error.source_type': 'react-native'
                    }
                );
            });

            it('native context is empty W context is raw type', async () => {
                const obj: any = Symbol('invalid-context');
                await OoLogs.debug(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    obj
                );

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(
                    NativeModules.OoLogs.debugWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    { '_oo.error.source_type': 'react-native' }
                );
            });

            it('native context is unmodified W context is a valid object', async () => {
                await OoLogs.debug('message', 'kind', 'message', 'stacktrace', {
                    test: '123'
                });
                expect(
                    NativeModules.OoLogs.debugWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    { test: '123', '_oo.error.source_type': 'react-native' }
                );
            });
        });

        describe('warn logs', () => {
            it('native context is empty W context is undefined', async () => {
                await OoLogs.warn(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    undefined
                );
                expect(
                    NativeModules.OoLogs.warnWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    { '_oo.error.source_type': 'react-native' }
                );
            });

            it('native context is an object with nested property W context is an array', async () => {
                await OoLogs.warn('message', 'kind', 'message', 'stacktrace', [
                    1,
                    2,
                    3
                ]);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoLogs.warnWithError).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    {
                        context: [1, 2, 3],
                        '_oo.error.source_type': 'react-native'
                    }
                );
            });

            it('native context is empty W context is raw type', async () => {
                const obj: any = Symbol('invalid-context');
                await OoLogs.warn(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    obj
                );

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(
                    NativeModules.OoLogs.warnWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    { '_oo.error.source_type': 'react-native' }
                );
            });

            it('native context is unmodified W context is a valid object', async () => {
                await OoLogs.warn('message', 'kind', 'message', 'stacktrace', {
                    test: '123'
                });
                expect(
                    NativeModules.OoLogs.warnWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    { test: '123', '_oo.error.source_type': 'react-native' }
                );
            });
        });

        describe('info logs', () => {
            it('native context is empty W context is undefined', async () => {
                await OoLogs.info(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    undefined
                );
                expect(
                    NativeModules.OoLogs.infoWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    { '_oo.error.source_type': 'react-native' }
                );
            });

            it('native context is an object with nested property W context is an array', async () => {
                await OoLogs.info('message', 'kind', 'message', 'stacktrace', [
                    1,
                    2,
                    3
                ]);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(NativeModules.OoLogs.infoWithError).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    {
                        context: [1, 2, 3],
                        '_oo.error.source_type': 'react-native'
                    }
                );
            });

            it('native context is empty W context is raw type', async () => {
                const obj: any = Symbol('invalid-context');
                await OoLogs.info(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    obj
                );

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(
                    NativeModules.OoLogs.infoWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    { '_oo.error.source_type': 'react-native' }
                );
            });

            it('native context is unmodified W context is a valid object', async () => {
                await OoLogs.info('message', 'kind', 'message', 'stacktrace', {
                    test: '123'
                });
                expect(
                    NativeModules.OoLogs.infoWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    { test: '123', '_oo.error.source_type': 'react-native' }
                );
            });
        });

        describe('error logs', () => {
            it('native context is empty W context is undefined', async () => {
                await OoLogs.error(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    undefined
                );
                expect(
                    NativeModules.OoLogs.errorWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    { '_oo.error.source_type': 'react-native' }
                );
            });

            it('native context is an object with nested property W context is an array', async () => {
                await OoLogs.error('message', 'kind', 'message', 'stacktrace', [
                    1,
                    2,
                    3
                ]);

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(
                    NativeModules.OoLogs.errorWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    {
                        context: [1, 2, 3],
                        '_oo.error.source_type': 'react-native'
                    }
                );
            });

            it('native context is empty W context is raw type', async () => {
                const obj: any = Symbol('invalid-context');
                await OoLogs.error(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    obj
                );

                expect(InternalLog.log).toHaveBeenNthCalledWith(
                    2,
                    expect.anything(),
                    SdkVerbosity.WARN
                );

                expect(
                    NativeModules.OoLogs.errorWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    { '_oo.error.source_type': 'react-native' }
                );
            });

            it('native context is unmodified W context is a valid object', async () => {
                await OoLogs.error('message', 'kind', 'message', 'stacktrace', {
                    test: '123'
                });
                expect(
                    NativeModules.OoLogs.errorWithError
                ).toHaveBeenCalledWith(
                    'message',
                    'kind',
                    'message',
                    'stacktrace',
                    { test: '123', '_oo.error.source_type': 'react-native' }
                );
            });
        });
    });
});
