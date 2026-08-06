/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */

const mockBatchedBridge = {
    registerCallableModule: jest.fn()
};

const mockNativeDdSdkSpec = {
    onRUMSessionStarted: jest.fn()
};

const mockEventEmitter = {
    initialize: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn()
};

const mockErrorHandler = jest.fn();

const mockNativeEventEmitter = {
    initialize: jest.fn().mockReturnValue(true),
    addListener: jest.fn(),
    removeAllListeners: jest.fn()
};

const mockBatchedBridgeEventEmitter = {
    initialize: jest.fn().mockReturnValue(true),
    addListener: jest.fn(),
    removeAllListeners: jest.fn()
};

describe('O2SdkNativeBridge', () => {
    beforeEach(() => {
        jest.mock('../../O2Sdk', () => ({
            O2Sdk: {
                initialize: jest.fn()
            }
        }));

        jest.mock(
            'react-native/Libraries/BatchedBridge/BatchedBridge',
            () => mockBatchedBridge
        );

        jest.mock(
            '../../OpenObserveEventEmitter/OpenObserveNativeEventEmitter',
            () => ({
                OpenObserveNativeEventEmitter: jest
                    .fn()
                    .mockImplementation(() => mockNativeEventEmitter)
            })
        );

        jest.mock(
            '../../OpenObserveEventEmitter/OpenObserveBatchedBridgeEventEmitter',
            () => ({
                OpenObserveBatchedBridgeEventEmitter: jest
                    .fn()
                    .mockImplementation(() => mockBatchedBridgeEventEmitter)
            })
        );

        jest.mock('../../../specs/NativeDdSdk', () => mockNativeDdSdkSpec);
    });

    afterEach(() => {
        jest.resetModules();
        jest.resetAllMocks();
        delete (global as any).RN$Bridgeless;
    });

    describe('new architecture implementation', () => {
        beforeEach(() => {
            (global as any).RN$Bridgeless = true;
        });

        it('does not try to register the batched bridge when index is imported', () => {
            const ddBridge = require('../O2SdkInternalNativeBridge');
            const defaultEventEmitter = require('../../OpenObserveEventEmitter/OpenObserveDefaultEventEmitter');
            mockNativeEventEmitter.initialize.mockReturnValueOnce(true);
            ddBridge.registerNativeBridge(
                new defaultEventEmitter.OpenObserveDefaultEventEmitter(
                    mockErrorHandler
                )
            );
            expect(
                mockBatchedBridge.registerCallableModule
            ).not.toHaveBeenCalled();
            expect(mockErrorHandler).not.toHaveBeenCalled();
            expect(ddBridge.hasNativeBridge()).toBe(true);
        });

        it('catches errors when native event emitter init fails', () => {
            jest.mock('../../../specs/NativeDdSdk', () => undefined);

            const ddBridge = require('../O2SdkInternalNativeBridge');
            const defaultEventEmitter = require('../../OpenObserveEventEmitter/OpenObserveDefaultEventEmitter');
            mockNativeEventEmitter.initialize.mockReturnValueOnce(false);

            ddBridge.registerNativeBridge(
                new defaultEventEmitter.OpenObserveDefaultEventEmitter(
                    mockErrorHandler
                ),
                mockErrorHandler
            );

            expect(mockErrorHandler).toHaveBeenCalledWith(
                'ERROR: Native Bridge initialization failed.'
            );
        });
    });

    describe('old architecture implementation', () => {
        beforeEach(() => {
            (global as any).RN$Bridgeless = false;
        });

        it('does not try to register the event listener when index is imported', () => {
            const ddBridge = require('../O2SdkInternalNativeBridge');
            const defaultEventEmitter = require('../../OpenObserveEventEmitter/OpenObserveDefaultEventEmitter');
            mockBatchedBridgeEventEmitter.initialize.mockReturnValueOnce(true);

            ddBridge.registerNativeBridge(
                new defaultEventEmitter.OpenObserveDefaultEventEmitter(
                    mockErrorHandler
                )
            );

            expect(mockNativeEventEmitter.initialize).not.toHaveBeenCalled();
            expect(mockBatchedBridgeEventEmitter.initialize).toHaveBeenCalled();
            expect(mockErrorHandler).not.toHaveBeenCalled();
            expect(ddBridge.hasNativeBridge()).toBe(true);
        });

        it('hasBatchedBridge is false when batched bridge init fails', () => {
            const ddBridge = require('../O2SdkInternalNativeBridge');
            const defaultEventEmitter = require('../../OpenObserveEventEmitter/OpenObserveDefaultEventEmitter');
            mockBatchedBridgeEventEmitter.initialize.mockReturnValueOnce(false);

            ddBridge.registerNativeBridge(
                new defaultEventEmitter.OpenObserveDefaultEventEmitter(
                    mockErrorHandler
                ),
                mockErrorHandler
            );
            ddBridge.registerNativeBridge(mockEventEmitter);
            expect(ddBridge.hasNativeBridge()).toBe(false);
            expect(mockErrorHandler).toHaveBeenCalledWith(
                'ERROR: Native Bridge initialization failed.'
            );
        });
    });
});
