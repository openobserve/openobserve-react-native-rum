/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import { NativeModules } from 'react-native';

import { OpenObserveBatchedBridgeEventEmitter } from './OpenObserveBatchedBridgeEventEmitter';
import type { OpenObserveEventEmitter } from './OpenObserveEventEmitter';
import { OpenObserveNativeEventEmitter } from './OpenObserveNativeEventEmitter';

export class OpenObserveDefaultEventEmitter implements OpenObserveEventEmitter {
    private eventEmitter?: OpenObserveEventEmitter;

    private get isNewArchitecture(): boolean {
        return (global as any).RN$Bridgeless;
    }

    constructor(errorHandler: (err: any) => void) {
        try {
            const ddSdkModule =
                NativeModules.O2Sdk ||
                // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
                require('../../specs/NativeDdSdk').default;
            this.eventEmitter = this.isNewArchitecture
                ? new OpenObserveNativeEventEmitter(ddSdkModule, errorHandler)
                : new OpenObserveBatchedBridgeEventEmitter(errorHandler);
        } catch (err) {
            errorHandler(
                `ERROR: failed to initialize OpenObserveDefaultEventEmitter: ${err}`
            );
        }
    }

    initialize(): boolean {
        return this.eventEmitter?.initialize() ?? false;
    }

    public addListener(eventName: string, callback: (data: any) => void) {
        this.eventEmitter?.addListener(eventName, callback);
    }

    public removeAllListeners(eventName: string) {
        this.eventEmitter?.removeAllListeners(eventName);
    }
}
