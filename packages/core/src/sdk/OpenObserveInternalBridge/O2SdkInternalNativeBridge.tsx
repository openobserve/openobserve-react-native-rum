/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import { InternalLog } from '../../InternalLog';
import { SdkVerbosity } from '../../config/types/SdkVerbosity';
import { setCachedSessionId } from '../../rum/helper';
import { OpenObserveDefaultEventEmitter } from '../OpenObserveEventEmitter/OpenObserveDefaultEventEmitter';
import type { OpenObserveEventEmitter } from '../OpenObserveEventEmitter/OpenObserveEventEmitter';

import { O2SdkInternalNativeBridgeEvent as BridgeEvent } from './O2SdkInternalNativeBridgeEvent';

const DEFAULT_EVENTS = [
    new BridgeEvent<string>('RUMSessionStarted', (sessionId: string) => {
        setCachedSessionId(sessionId);
    })
];

const defaultErrorHandler = (err: any) => {
    InternalLog.log(err, SdkVerbosity.DEBUG);
};

export class O2SdkInternalNativeBridge {
    private eventEmitter: OpenObserveEventEmitter;
    private errorHandler: (err: any) => void;
    private _isInitialized: boolean = false;

    private static _instance?: O2SdkInternalNativeBridge;
    public static get isInitialized(): boolean {
        return this._instance?._isInitialized ?? false;
    }

    static initialize(
        eventEmitter: OpenObserveEventEmitter,
        errorHandler: (err: any) => void = defaultErrorHandler
    ): O2SdkInternalNativeBridge {
        this._instance = new O2SdkInternalNativeBridge(
            eventEmitter,
            errorHandler
        );
        this._instance._isInitialized =
            eventEmitter.initialize() &&
            this._instance.registerDefaultListeners();
        return this._instance;
    }

    private constructor(
        eventEmitter: OpenObserveEventEmitter,
        errorHandler: (err: any) => void
    ) {
        this.eventEmitter = eventEmitter;
        this.errorHandler = errorHandler;
    }

    private registerDefaultListeners(): boolean {
        try {
            DEFAULT_EVENTS.forEach(event => {
                this.eventEmitter.addListener(event.eventName, event.callback);
            });
            return true;
        } catch (err) {
            this.errorHandler(
                `An error occured while registering default listeners for event emitter: ${err}`
            );
            return false;
        }
    }
}

export const registerNativeBridge = (
    eventEmitter?: OpenObserveEventEmitter,
    errorHandler: (err: any) => void = defaultErrorHandler
) => {
    const nativeEventEmitter =
        eventEmitter ?? new OpenObserveDefaultEventEmitter(errorHandler);
    O2SdkInternalNativeBridge.initialize(nativeEventEmitter);
    if (!O2SdkInternalNativeBridge.isInitialized) {
        errorHandler('ERROR: Native Bridge initialization failed.');
    }
};

export const hasNativeBridge = () => O2SdkInternalNativeBridge.isInitialized;
