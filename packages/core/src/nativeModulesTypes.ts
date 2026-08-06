/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import type { O2SdkNativeConfiguration } from './config/features/CoreConfigurationNative';
import type { Spec as NativeDdFlags } from './specs/NativeDdFlags';
import type { Spec as NativeDdLogs } from './specs/NativeDdLogs';
import type { Spec as NativeDdRum } from './specs/NativeDdRum';
import type { Spec as NativeDdSdk } from './specs/NativeDdSdk';
import type { Spec as NativeDdTrace } from './specs/NativeDdTrace';

/**
 * In this file, native modules types extend the specs for TurboModules.
 * As we cannot use enums or classes in the specs, we override methods using them here.
 */

/**
 * The entry point to use OpenObserve's Logs feature.
 */
export type O2NativeLogsType = NativeDdLogs;

/**
 * The entry point to use OpenObserve's Trace feature.
 */
export type O2NativeTraceType = NativeDdTrace;

/**
 * The entry point to use OpenObserve's Flags feature.
 */
export type O2NativeFlagsType = NativeDdFlags;

/**
 * The entry point to initialize OpenObserve's features.
 */
export interface O2NativeSdkType extends NativeDdSdk {
    /**
     * Initializes OpenObserve's features.
     * @param configuration: The configuration to use.
     */
    initialize(configuration: O2SdkNativeConfiguration): Promise<void>;
}

type ActionType = 'TAP' | 'SCROLL' | 'SWIPE' | 'BACK' | 'CUSTOM';

type ResourceKind =
    | 'image'
    | 'xhr'
    | 'beacon'
    | 'css'
    | 'document'
    | 'fetch'
    | 'font'
    | 'js'
    | 'media'
    | 'other'
    | 'native';

type ErrorSource = 'NETWORK' | 'SOURCE' | 'CONSOLE' | 'WEBVIEW' | 'CUSTOM';

/**
 * The entry point to use OpenObserve's RUM feature.
 */
export interface O2NativeRumType extends NativeDdRum {
    /**
     * Start tracking a RUM Action.
     * @param type: The action type (tap, scroll, swipe, back, custom).
     * @param name: The action name.
     * @param context: The additional context to send.
     * @param timestampMs: The timestamp when the action started (in milliseconds). If not provided, current timestamp will be used.
     */
    startAction(
        type: ActionType,
        name: string,
        context: object,
        timestampMs: number
    ): Promise<void>;

    /**
     * Stop tracking the ongoing RUM Action.
     * @param type: The action type (tap, scroll, swipe, back, custom).
     * @param name: The action name.
     * @param context: The additional context to send.
     * @param timestampMs: The timestamp when the action stopped (in milliseconds). If not provided, current timestamp will be used.
     */
    stopAction(
        type: ActionType,
        name: string,
        context: object,
        timestampMs: number
    ): Promise<void>;

    /**
     * Add a RUM Action.
     * @param type: The action type (tap, scroll, swipe, back, custom).
     * @param name: The action name.
     * @param touch: The native touch data for tap actions, or null for other action types.
     * @param context: The additional context to send.
     * @param timestampMs: The timestamp when the action occurred (in milliseconds). If not provided, current timestamp will be used.
     */
    addAction(
        type: ActionType,
        name: string,
        touch: object | null,
        context: object,
        timestampMs: number
    ): Promise<void>;

    /**
     * Stop tracking a RUM Resource.
     * @param key: The resource unique key identifier.
     * @param statusCode: The resource status code.
     * @param kind: The resource's kind (xhr, document, image, css, font, …).
     * @param size: The resource size in bytes. If size is unknown, use -1.
     * @param context: The additional context to send.
     * @param timestampMs: The timestamp when the resource stopped (in milliseconds). If not provided, current timestamp will be used.
     */
    stopResource(
        key: string,
        statusCode: number,
        kind: ResourceKind,
        size: number,
        context: object,
        timestampMs: number
    ): Promise<void>;

    /**
     * Add a RUM Error.
     * @param message: The error message.
     * @param source: The error source (network, source, console, webview, custom).
     * @param stacktrace: The error stacktrace.
     * @param context: The additional context to send.
     * @param timestampMs: The timestamp when the error occurred (in milliseconds). If not provided, current timestamp will be used.
     * @param fingerprint: Optional custom error fingerprint.
     */
    addError(
        message: string,
        source: ErrorSource,
        stacktrace: string,
        context: object,
        timestampMs: number,
        fingerprint: string | undefined
    ): Promise<void>;
}
