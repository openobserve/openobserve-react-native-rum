/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { NativeModules } from 'react-native';

import type { O2NativeRumType } from '../../../nativeModulesTypes';
import { O2RumErrorTracking } from '../../../rum/instrumentation/O2RumErrorTracking';
import { BufferSingleton } from '../../../sdk/OpenObserveProvider/Buffer/BufferSingleton';

jest.mock('../../../utils/jsUtils');

const O2Rum = NativeModules.O2Rum as O2NativeRumType;

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
    O2RumErrorTracking['isTracking'] = false;
    ErrorUtils.setGlobalHandler(originalErrorHandler);
    console.error = originalConsoleError;
});

it('M intercept and send a RUM event W onGlobalError() {no message}', async () => {
    // GIVEN
    O2RumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = {
        stack: ['doSomething() at ./path/to/file.js:67:3']
    };

    // WHEN
    O2RumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Unknown Error',
        'SOURCE',
        'doSomething() at ./path/to/file.js:67:3',
        {
            '_o2.error.raw': {
                name: 'Error',
                message: 'Unknown Error',
                cause: undefined,
                stack: 'doSomething() at ./path/to/file.js:67:3'
            },
            '_o2.error.is_crash': is_fatal,
            '_o2.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {empty stack trace}', async () => {
    // GIVEN
    O2RumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = {
        message: 'Something bad happened'
    };

    // WHEN
    O2RumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        '',
        {
            '_o2.error.raw': {
                name: 'Error',
                message: 'Something bad happened',
                cause: undefined,
                stack: ''
            },
            '_o2.error.is_crash': is_fatal,
            '_o2.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {Error object}', async () => {
    // GIVEN
    O2RumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = new Error('Something bad happened');

    // WHEN
    O2RumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        expect.stringContaining('Error: Something bad happened'),
        {
            '_o2.error.raw': {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: undefined
            },
            '_o2.error.is_crash': is_fatal,
            '_o2.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect((O2Rum.addError as any).mock.calls[0][2]).toContain(
        '/packages/core/src/__tests__/rum/instrumentation/O2RumErrorTracking.test.tsx'
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {CustomError object}', async () => {
    // GIVEN
    class CustomError extends Error {
        name = 'CustomError';
    }

    O2RumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = new CustomError('Something bad happened');

    // WHEN
    O2RumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        expect.stringContaining('Error: Something bad happened'),
        {
            '_o2.error.raw': {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: undefined
            },
            '_o2.error.is_crash': is_fatal,
            '_o2.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect((O2Rum.addError as any).mock.calls[0][2]).toContain(
        '/packages/core/src/__tests__/rum/instrumentation/O2RumErrorTracking.test.tsx'
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {with source file info}', async () => {
    // GIVEN
    O2RumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = {
        sourceURL: './path/to/file.js',
        line: 1038,
        column: 57,
        message: 'Something bad happened'
    };

    // WHEN
    O2RumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        'at ./path/to/file.js:1038:57',
        {
            '_o2.error.is_crash': is_fatal,
            '_o2.error.source_type': 'react-native',
            '_o2.error.raw': {
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
    O2RumErrorTracking.startTracking();
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
    O2RumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        'doSomething() at ./path/to/file.js:67:3,nestedCall() at ./path/to/file.js:1064:9,root() at ./path/to/index.js:10:1',
        {
            '_o2.error.raw': {
                message: 'Something bad happened',
                name: 'Error',
                stack: [
                    'doSomething() at ./path/to/file.js:67:3',
                    'nestedCall() at ./path/to/file.js:1064:9',
                    'root() at ./path/to/index.js:10:1'
                ].join(','),
                cause: undefined
            },
            '_o2.error.is_crash': is_fatal,
            '_o2.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {with stack and component stack}', async () => {
    // GIVEN
    O2RumErrorTracking.startTracking();
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
    O2RumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        'example() at ./path/to/file.js:77:2,test() at ./path/to/index.js:22:3',
        {
            '_o2.error.raw': {
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
            '_o2.error.is_crash': is_fatal,
            '_o2.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {with stack}', async () => {
    // GIVEN
    O2RumErrorTracking.startTracking();
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
    O2RumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        'doSomething() at ./path/to/file.js:67:3,nestedCall() at ./path/to/file.js:1064:9,root() at ./path/to/index.js:10:1',
        {
            '_o2.error.raw': {
                name: 'Error',
                message: 'Something bad happened',
                cause: undefined,
                stack: [
                    'doSomething() at ./path/to/file.js:67:3',
                    'nestedCall() at ./path/to/file.js:1064:9',
                    'root() at ./path/to/index.js:10:1'
                ].join(',')
            },
            '_o2.error.is_crash': is_fatal,
            '_o2.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onGlobalError() {with stacktrace}', async () => {
    // GIVEN
    O2RumErrorTracking.startTracking();
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
    O2RumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        'doSomething() at ./path/to/file.js:67:3,nestedCall() at ./path/to/file.js:1064:9,root() at ./path/to/index.js:10:1',
        {
            '_o2.error.raw': {
                name: 'Error',
                message: 'Something bad happened',
                stack: [
                    'doSomething() at ./path/to/file.js:67:3',
                    'nestedCall() at ./path/to/file.js:1064:9',
                    'root() at ./path/to/index.js:10:1'
                ].join(','),
                cause: undefined
            },
            '_o2.error.is_crash': is_fatal,
            '_o2.error.source_type': 'react-native'
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
    O2RumErrorTracking.startTracking();
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
    O2RumErrorTracking.onGlobalError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        'doSomething() at ./path/to/file.js:67:3,nestedCall() at ./path/to/file.js:1064:9,root() at ./path/to/index.js:10:1',
        {
            '_o2.error.raw': {
                name: 'Error',
                cause: undefined,
                message: 'Something bad happened',
                stack: [
                    'doSomething() at ./path/to/file.js:67:3',
                    'nestedCall() at ./path/to/file.js:1064:9',
                    'root() at ./path/to/index.js:10:1'
                ].join(',')
            },
            '_o2.error.is_crash': is_fatal,
            '_o2.error.source_type': 'react-native'
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
    O2RumErrorTracking.startTracking();
    const message = 'Oops I did it again!';
    const error = {
        sourceURL: './path/to/file.js',
        line: 1038,
        column: 57,
        message: 'Something bad happened'
    };

    // WHEN
    O2RumErrorTracking.onConsoleError(message, error);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Oops I did it again! Something bad happened',
        'CONSOLE',
        'at ./path/to/file.js:1038:57',
        {
            '_o2.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseConsoleErrorCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onConsole() {Error with component stack}', async () => {
    // GIVEN
    O2RumErrorTracking.startTracking();
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
    O2RumErrorTracking.onConsoleError(message, error);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Oops I did it again! Something bad happened',
        'CONSOLE',
        'doSomething() at ./path/to/file.js:67:3,nestedCall() at ./path/to/file.js:1064:9,root() at ./path/to/index.js:10:1',
        {
            '_o2.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseConsoleErrorCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onConsole() {message only}', async () => {
    // GIVEN
    O2RumErrorTracking.startTracking();
    const message = 'Something bad happened';

    // WHEN
    O2RumErrorTracking.onConsoleError(message);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        message,
        'CONSOLE',
        '',
        {
            '_o2.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect(baseConsoleErrorCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onConsole() {Error with source file and name}', async () => {
    // GIVEN
    O2RumErrorTracking.startTracking();
    const message = 'Oops I did it again!';
    const error = {
        sourceURL: './path/to/file.js',
        line: 1038,
        column: 57,
        message: 'Something bad happened',
        name: 'CustomConsoleError'
    };

    // WHEN
    O2RumErrorTracking.onConsoleError(message, error);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Oops I did it again! Something bad happened',
        'CONSOLE',
        'at ./path/to/file.js:1038:57',
        {
            '_o2.error.source_type': 'react-native'
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
        O2RumErrorTracking.startTracking();

        // WHEN
        O2RumErrorTracking.onConsoleError(message);
        await flushPromises();

        // THEN
        const errorMessage =
            message === undefined || message === null
                ? 'Unknown Error'
                : typeof message?.toString === 'function' &&
                  message.toString !== Object.prototype.toString
                ? String(message)
                : 'Unknown Error';
        expect(O2Rum.addError).toHaveBeenCalledTimes(1);
        expect(O2Rum.addError).toHaveBeenCalledWith(
            errorMessage,
            'CONSOLE',
            '',
            {
                '_o2.error.source_type': 'react-native'
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
    O2RumErrorTracking.startTracking();
    const is_fatal = Math.random() < 0.5;
    const error = new Error('Something bad happened');

    // WHEN
    errorHandlerMock.onError(error, is_fatal);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Something bad happened',
        'SOURCE',
        expect.stringContaining('Error: Something bad happened'),
        {
            '_o2.error.raw': {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: undefined
            },
            '_o2.error.is_crash': is_fatal,
            '_o2.error.source_type': 'react-native'
        },
        expect.any(Number),
        ''
    );
    expect((O2Rum.addError as any).mock.calls[0][2]).toContain(
        '/packages/core/src/__tests__/rum/instrumentation/O2RumErrorTracking.test.tsx'
    );
    expect(baseErrorHandlerCalled).toStrictEqual(true);
});

it('M intercept and send a RUM event W onConsole() {called from RNErrorHandler}', async () => {
    // GIVEN
    const errorHandlerMock = new RNErrorHandlerMock();
    O2RumErrorTracking.startTracking();
    const message = 'Oops I did it again!';

    // WHEN
    errorHandlerMock.onConsoleError(message);
    await flushPromises();

    // THEN
    expect(O2Rum.addError).toHaveBeenCalledTimes(1);
    expect(O2Rum.addError).toHaveBeenCalledWith(
        'Oops I did it again!',
        'CONSOLE',
        '',
        {
            '_o2.error.source_type': 'react-native'
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
