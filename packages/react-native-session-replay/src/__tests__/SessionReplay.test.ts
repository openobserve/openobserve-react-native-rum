/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { NativeModules } from 'react-native';

import {
    ImagePrivacyLevel,
    SessionReplay,
    TextAndInputPrivacyLevel,
    TouchPrivacyLevel
} from '../SessionReplay';

function getRandomEnumValue<
    T extends { [s: string]: T[keyof T] } | ArrayLike<T[keyof T]>
>(enumObj: T): T[keyof T] {
    const values = Object.values(enumObj) as T[keyof T][]; // Get all enum values
    const randomIndex = Math.floor(Math.random() * values.length); // Generate a random index
    return values[randomIndex]; // Return the random value
}

// enable() warns whenever no customEndpoint is set, which most cases here omit.
// Silence it suite-wide so the output stays readable; the dedicated describe block
// below asserts on this same spy.
let warnSpy: jest.SpyInstance;

beforeEach(() => {
    NativeModules.O2SessionReplay.enable.mockClear();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
    warnSpy.mockRestore();
});

describe('SessionReplay', () => {
    describe('enable', () => {
        it('calls native session replay with default configuration', () => {
            SessionReplay.enable();

            expect(NativeModules.O2SessionReplay.enable).toHaveBeenCalledWith(
                100,
                '',
                'MASK_ALL',
                'HIDE',
                'MASK_ALL',
                true,
                false
            );
        });

        it('calls native session replay with provided configuration { w custom endpoint }', () => {
            SessionReplay.enable({
                replaySampleRate: 100,
                customEndpoint: 'https://session-replay.example.com'
            });

            expect(NativeModules.O2SessionReplay.enable).toHaveBeenCalledWith(
                100,
                'https://session-replay.example.com',
                'MASK_ALL',
                'HIDE',
                'MASK_ALL',
                true,
                false
            );
        });

        it('calls native session replay with provided configuration { w random privacy levels }', () => {
            const TIMES = 20;

            const image = getRandomEnumValue(ImagePrivacyLevel);
            const touch = getRandomEnumValue(TouchPrivacyLevel);
            const textAndInput = getRandomEnumValue(TextAndInputPrivacyLevel);

            for (let i = 0; i < TIMES; ++i) {
                SessionReplay.enable({
                    replaySampleRate: 100,
                    customEndpoint: 'https://session-replay.example.com',
                    imagePrivacyLevel: image,
                    touchPrivacyLevel: touch,
                    textAndInputPrivacyLevel: textAndInput
                });

                expect(
                    NativeModules.O2SessionReplay.enable
                ).toHaveBeenCalledWith(
                    100,
                    'https://session-replay.example.com',
                    image,
                    touch,
                    textAndInput,
                    true,
                    false
                );
            }
        });

        it('calls native session replay with edge cases in configuration', () => {
            SessionReplay.enable({
                replaySampleRate: 0,
                customEndpoint: ''
            });

            expect(NativeModules.O2SessionReplay.enable).toHaveBeenCalledWith(
                0,
                '',
                'MASK_ALL',
                'HIDE',
                'MASK_ALL',
                true,
                false
            );
        });

        describe('missing customEndpoint', () => {
            // Without a customEndpoint the native SDKs fall back to a built-in
            // OpenObserveSite host that does not resolve, so replay data is dropped
            // with no error. The warning is the only signal the user gets.
            it('warns when no customEndpoint is provided', () => {
                SessionReplay.enable();

                expect(warnSpy).toHaveBeenCalledTimes(1);
                expect(warnSpy.mock.calls[0][0]).toContain('customEndpoint');
            });

            it('warns when customEndpoint is explicitly empty', () => {
                SessionReplay.enable({ customEndpoint: '' });

                expect(warnSpy).toHaveBeenCalledTimes(1);
            });

            it('does not warn when a customEndpoint is provided', () => {
                SessionReplay.enable({
                    customEndpoint: 'https://example.openobserve.ai/rum/v1/org'
                });

                expect(warnSpy).not.toHaveBeenCalled();
            });

            it('still enables session replay despite the warning', () => {
                SessionReplay.enable();

                expect(
                    NativeModules.O2SessionReplay.enable
                ).toHaveBeenCalledTimes(1);
            });
        });
    });
});
