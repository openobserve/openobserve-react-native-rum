/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { NativeModules } from 'react-native';

import type { OoNativeRumType } from '../../../nativeModulesTypes';
import { OoRumErrorTracking } from '../../../rum/instrumentation/OoRumErrorTracking';
import { BufferSingleton } from '../../../sdk/DatadogProvider/Buffer/BufferSingleton';

jest.mock('../../../utils/jsUtils');

const OoRum = NativeModules.OoRum as OoNativeRumType;

let baseErrorHandlerCalled = false;
const baseErrorHandler = (error: any, isFatal?: boolean) => {
    baseErrorHandlerCalled = true;
};
let originalErrorHandler: any;

let baseConsoleErrorCalled = false;
const baseConsoleError = (...params: unknown[]) => {
    baseConsoleErrorCalled = true;
};
let originalConsoleError: any;

const flushPromises = () =>
    new Promise(jest.requireActual('timers').setImmediate);

beforeEach(() => {
    jest.clearAllMocks();
    BufferSingleton.onInitialization();
    baseErrorHandlerCalled = false;
    originalErrorHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler(baseErrorHandler);
    originalConsoleError = console.error;
    console.error = baseConsoleError;
    jest.setTimeout(20000);
});

afterEach(() => {
    OoRumErrorTracking['isTracking'] = false;
    ErrorUtils.setGlobalHandler(originalErrorHandler);
    console.error = originalConsoleError;
});

it('M intercept and send a RUM event W onGlobalError() {no message}', async () => {
    // GIVEN
    OoRumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = {
        stack: ['doSomething() at ./path/to/file.js:67:3']
    };

    // WHEN
    OoRumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Unknown Error',
        'SOURCE',
        'doSomething() at ./path/to/file.js:67:3',
        {
            '_oo.error.raw': {
                name: 'Error',
                message: 'Unknown Error',
                cause: undefined,
                stack: 'doSomething() at ./path/to/file.js:67:3'
            },
            '_oo.error.is_crash': is_fatal,
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {empty stack trace}', async () => {
    // GIVEN
    OoRumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = {
        message: 'Something bad happened'
    };

    // WHEN
    OoRumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        '',
        {
            '_oo.error.raw': {
                name: 'Error',
                message: 'Something bad happened',
                cause: undefined,
                stack: ''
            },
            '_oo.error.is_crash': is_fatal,
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {Error object}', async () => {
    // GIVEN
    OoRumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = new Error('Something bad happened');

    // WHEN
    OoRumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        expect.stringContaining('Error: Something bad happened'),
        {
            '_oo.error.raw': {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: undefined
            },
            '_oo.error.is_crash': is_fatal,
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect((OoRum.addError as any).mock.calls[0][2]).toContain(
        '/packages/core/src/__tests__/rum/instrumentation/OoRumErrorTracking.test.tsx'
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {CustomError object}', async () => {
    // GIVEN
    class CustomError extends Error {
        name = 'CustomError';
    }

    OoRumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = new CustomError('Something bad happened');

    // WHEN
    OoRumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        expect.stringContaining('Error: Something bad happened'),
        {
            '_oo.error.raw': {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: undefined
            },
            '_oo.error.is_crash': is_fatal,
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect((OoRum.addError as any).mock.calls[0][2]).toContain(
        '/packages/core/src/__tests__/rum/instrumentation/OoRumErrorTracking.test.tsx'
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {with source file info}', async () => {
    // GIVEN
    OoRumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = {
        sourceURL: './path/to/file.js',
        line: 1038,
        column: 57,
        message: 'Something bad happened'
    };

    // WHEN
    OoRumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        'at ./path/to/file.js:1038:57',
        {
            '_oo.error.is_crash': is_fatal,
            '_oo.error.source_type': 'react-native',
            '_oo.error.raw': {
                sourceURL: './path/to/file.js',
                line: 1038,
                column: 57,
                message: 'Something bad happened',
                name: 'Error',
                cause: undefined,
                stack: 'at ./path/to/file.js:1038:57'
            }
        },
        expect.any(Number),
        ''
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {with component stack}', async () => {
    // GIVEN
    OoRumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = {
        componentStack: [
            'doSomething() at ./path/to/file.js:67:3',
            'nestedCall() at ./path/to/file.js:1064:9',
            'root() at ./path/to/index.js:10:1'
        ],
        message: 'Something bad happened'
    };

    // WHEN
    OoRumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        'doSomething() at ./path/to/file.js:67:3,nestedCall() at ./path/to/file.js:1064:9,root() at ./path/to/index.js:10:1',
        {
            '_oo.error.raw': {
                message: 'Something bad happened',
                name: 'Error',
                stack: [
                    'doSomething() at ./path/to/file.js:67:3',
                    'nestedCall() at ./path/to/file.js:1064:9',
                    'root() at ./path/to/index.js:10:1'
                ].join(','),
                cause: undefined
            },
            '_oo.error.is_crash': is_fatal,
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {with stack and component stack}', async () => {
    // GIVEN
    OoRumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = {
        stack: [
            'example() at ./path/to/file.js:77:2',
            'test() at ./path/to/index.js:22:3'
        ],
        componentStack: [
            'doSomething() at ./path/to/file.js:67:3',
            'nestedCall() at ./path/to/file.js:1064:9',
            'root() at ./path/to/index.js:10:1'
        ],
        message: 'Something bad happened'
    };

    // WHEN
    OoRumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        'example() at ./path/to/file.js:77:2,test() at ./path/to/index.js:22:3',
        {
            '_oo.error.raw': {
                message: 'Something bad happened',
                name: 'Error',
                stack: [
                    'example() at ./path/to/file.js:77:2',
                    'test() at ./path/to/index.js:22:3'
                ].join(','),
                componentStack: [
                    'doSomething() at ./path/to/file.js:67:3',
                    'nestedCall() at ./path/to/file.js:1064:9',
                    'root() at ./path/to/index.js:10:1'
                ],
                cause: undefined
            },
            '_oo.error.is_crash': is_fatal,
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {with stack}', async () => {
    // GIVEN
    OoRumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = {
        stack: [
            'doSomething() at ./path/to/file.js:67:3',
            'nestedCall() at ./path/to/file.js:1064:9',
            'root() at ./path/to/index.js:10:1'
        ],
        message: 'Something bad happened'
    };

    // WHEN
    OoRumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        'doSomething() at ./path/to/file.js:67:3,nestedCall() at ./path/to/file.js:1064:9,root() at ./path/to/index.js:10:1',
        {
            '_oo.error.raw': {
                name: 'Error',
                message: 'Something bad happened',
                cause: undefined,
                stack: [
                    'doSomething() at ./path/to/file.js:67:3',
                    'nestedCall() at ./path/to/file.js:1064:9',
                    'root() at ./path/to/index.js:10:1'
                ].join(',')
            },
            '_oo.error.is_crash': is_fatal,
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {with stacktrace}', async () => {
    // GIVEN
    OoRumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = {
        stacktrace: [
            'doSomething() at ./path/to/file.js:67:3',
            'nestedCall() at ./path/to/file.js:1064:9',
            'root() at ./path/to/index.js:10:1'
        ],
        message: 'Something bad happened'
    };

    // WHEN
    OoRumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        'doSomething() at ./path/to/file.js:67:3,nestedCall() at ./path/to/file.js:1064:9,root() at ./path/to/index.js:10:1',
        {
            '_oo.error.raw': {
                name: 'Error',
                message: 'Something bad happened',
                stack: [
                    'doSomething() at ./path/to/file.js:67:3',
                    'nestedCall() at ./path/to/file.js:1064:9',
                    'root() at ./path/to/index.js:10:1'
                ].join(','),
                cause: undefined
            },
            '_oo.error.is_crash': is_fatal,
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M not report error in console handler W onGlobalError() {with console reporting handler}', async () => {
    // GIVEN
    const consoleReportingErrorHandler = jest.fn((error, isFatal) => {
        console.error(error.message);
        baseErrorHandler(error, isFatal);
    });
    ErrorUtils.setGlobalHandler(consoleReportingErrorHandler);
    OoRumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = {
        componentStack: [
            'doSomething() at ./path/to/file.js:67:3',
            'nestedCall() at ./path/to/file.js:1064:9',
            'root() at ./path/to/index.js:10:1'
        ],
        message: 'Something bad happened'
    };

    // WHEN
    OoRumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        'doSomething() at ./path/to/file.js:67:3,nestedCall() at ./path/to/file.js:1064:9,root() at ./path/to/index.js:10:1',
        {
            '_oo.error.raw': {
                name: 'Error',
                cause: undefined,
                message: 'Something bad happened',
                stack: [
                    'doSomething() at ./path/to/file.js:67:3',
                    'nestedCall() at ./path/to/file.js:1064:9',
                    'root() at ./path/to/index.js:10:1'
                ].join(',')
            },
            '_oo.error.is_crash': is_fatal,
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(consoleReportingErrorHandler).toBeCalledTimes(1);
    expect(baseConsoleErrorCalled).toStrictEqual(false);
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onConsole() {Error with source file info}', async () => {
    // GIVEN
    OoRumErrorTracking.startTracking();
    const message = 'Oops I did it again!';
    const error = {
        sourceURL: './path/to/file.js',
        line: 1038,
        column: 57,
        message: 'Something bad happened'
    };

    // WHEN
    OoRumErrorTracking.onConsoleError(message, error);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Oops I did it again! Something bad happened',
        'CONSOLE',
        'at ./path/to/file.js:1038:57',
        {
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseConsoleErrorCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onConsole() {Error with component stack}', async () => {
    // GIVEN
    OoRumErrorTracking.startTracking();
    const message = 'Oops I did it again!';
    const error = {
        componentStack: [
            'doSomething() at ./path/to/file.js:67:3',
            'nestedCall() at ./path/to/file.js:1064:9',
            'root() at ./path/to/index.js:10:1'
        ],
        message: 'Something bad happened'
    };

    // WHEN
    OoRumErrorTracking.onConsoleError(message, error);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Oops I did it again! Something bad happened',
        'CONSOLE',
        'doSomething() at ./path/to/file.js:67:3,nestedCall() at ./path/to/file.js:1064:9,root() at ./path/to/index.js:10:1',
        {
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseConsoleErrorCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onConsole() {message only}', async () => {
    // GIVEN
    OoRumErrorTracking.startTracking();
    const message = 'Something bad happened';

    // WHEN
    OoRumErrorTracking.onConsoleError(message);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        message,
        'CONSOLE',
        '',
        {
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseConsoleErrorCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onConsole() {Error with source file and name}', async () => {
    // GIVEN
    OoRumErrorTracking.startTracking();
    const message = 'Oops I did it again!';
    const error = {
        sourceURL: './path/to/file.js',
        line: 1038,
        column: 57,
        message: 'Something bad happened',
        name: 'CustomConsoleError'
    };

    // WHEN
    OoRumErrorTracking.onConsoleError(message, error);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Oops I did it again! Something bad happened',
        'CONSOLE',
        'at ./path/to/file.js:1038:57',
        {
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseConsoleErrorCalled).toStrictEqual(true);
});

describe.each([
    [undefined],
    [null],
    [true],
    [1],
    ['message'],
    [() => {}],
    [{}],
    [['a']]
])('console calls with different message types', message => {
    it(`M intercept and send a RUM event W onConsole() { message has ${typeof message} type }`, async () => {
        // GIVEN
        OoRumErrorTracking.startTracking();

        // WHEN
        OoRumErrorTracking.onConsoleError(message);
        await flushPromises();

        // THEN
        const errorMessage =
            message === undefined || message === null
                ? 'Unknown Error'
                : typeof message?.toString === 'function' &&
                  message.toString !== Object.prototype.toString
                ? String(message)
                : 'Unknown Error';
        expect(OoRum.addError).toHaveBeenCalledTimes(1);
        expect(OoRum.addError).toHaveBeenCalledWith(
            errorMessage,
            'CONSOLE',
            '',
            {
                '_oo.error.source_type': 'react-native'
            },
            expect.any(Number),
            ''
        );
        expect(baseConsoleErrorCalled).toStrictEqual(true);
    });
});

it('M intercept and send a RUM event W on error() {called from RNErrorHandler}', async () => {
    // GIVEN
    const errorHandlerMock = new RNErrorHandlerMock();
    OoRumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = new Error('Something bad happened');

    // WHEN
    errorHandlerMock.onError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        expect.stringContaining('Error: Something bad happened'),
        {
            '_oo.error.raw': {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: undefined
            },
            '_oo.error.is_crash': is_fatal,
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect((OoRum.addError as any).mock.calls[0][2]).toContain(
        '/packages/core/src/__tests__/rum/instrumentation/OoRumErrorTracking.test.tsx'
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onConsole() {called from RNErrorHandler}', async () => {
    // GIVEN
    const errorHandlerMock = new RNErrorHandlerMock();
    OoRumErrorTracking.startTracking();
    const message = 'Oops I did it again!';

    // WHEN
    errorHandlerMock.onConsoleError(message);
    await flushPromises();

    // THEN
    expect(OoRum.addError).toHaveBeenCalledTimes(1);
    expect(OoRum.addError).toHaveBeenCalledWith(
        'Oops I did it again!',
        'CONSOLE',
        '',
        {
            '_oo.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseConsoleErrorCalled).toStrictEqual(true);
});

/**
 * This is a mock of the RN error handler class that will call the ErrorUtils.
 * Testing with this catches bugs around `this` references.
 */
class RNErrorHandlerMock {
    onError = (error: any, isFatal: boolean) => {
        const errorHandler = ErrorUtils.getGlobalHandler();
        errorHandler(error, isFatal);
    };

    onConsoleError = (...params: any) => {
        console.error(...params);
    };
}
