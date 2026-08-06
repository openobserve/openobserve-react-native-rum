/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { NativeModules } from 'react-native';

import { BufferSingleton } from '../../../../sdk/OpenObserveProvider/Buffer/BufferSingleton';
import { PropagatorType } from '../../../types';
import { O2RumResourceTracking } from '../O2RumResourceTracking';
import { TRACECONTEXT_HEADER_KEY } from '../distributedTracing/headers';

import { XMLHttpRequestMock } from './__utils__/XMLHttpRequestMock';

const O2Rum = NativeModules.O2Rum;

const flushPromises = () =>
    new Promise(jest.requireActual('timers').setImmediate);

beforeEach(() => {
    O2Rum.startResource.mockClear();
    O2Rum.stopResource.mockClear();
    BufferSingleton.onInitialization();
    global.XMLHttpRequest = XMLHttpRequestMock;
});

afterEach(() => {
    global.XMLHttpRequest = undefined;
});

const executeRequest = (url: string = 'https://api.example.com/v2/user') => {
    const xhr = new XMLHttpRequestMock();
    xhr.open('GET', url);
    xhr.send();
    xhr.notifyResponseArrived();
    xhr.complete(200, 'ok');
};

describe('O2RumResourceTracking', () => {
    it('removes all side effects when tracking is stopped', async () => {
        // GIVEN
        global.XMLHttpRequest = XMLHttpRequestMock;
        O2RumResourceTracking.startTracking({
            resourceTraceSampleRate: 100,
            firstPartyHosts: [
                {
                    match: 'example.com',
                    propagatorTypes: []
                }
            ]
        });

        // WHEN
        executeRequest();
        await flushPromises();

        // THEN
        expect(O2Rum.startResource).toHaveBeenCalledTimes(1);
        expect(O2Rum.stopResource).toHaveBeenCalledTimes(1);

        // WHEN
        O2Rum.startResource.mockClear();
        O2Rum.stopResource.mockClear();
        O2RumResourceTracking.stopTracking();
        executeRequest();

        // THEN
        expect(O2Rum.startResource).toHaveBeenCalledTimes(0);
        expect(O2Rum.stopResource).toHaveBeenCalledTimes(0);
    });

    it('does not report the resource when it is an internal resource', async () => {
        // GIVEN
        global.XMLHttpRequest = XMLHttpRequestMock;
        O2RumResourceTracking.startTracking({
            resourceTraceSampleRate: 100,
            firstPartyHosts: [
                {
                    match: 'example.com',
                    propagatorTypes: []
                }
            ]
        });

        // WHEN
        executeRequest('http://192.168.1.20:8081/logs');
        await flushPromises();

        // THEN
        expect(O2Rum.startResource).not.toHaveBeenCalled();
        expect(O2Rum.stopResource).not.toHaveBeenCalled();
    });

    describe('updateTrackingContext', () => {
        beforeEach(() => {
            O2RumResourceTracking.stopTracking();
        });

        afterEach(() => {
            O2RumResourceTracking.stopTracking();
        });

        it('is a no-op when called before startTracking', async () => {
            // GIVEN tracking was never started

            // WHEN
            O2RumResourceTracking.updateTrackingContext({
                resourceTraceSampleRate: 100
            });

            executeRequest('https://api.example.com/v2/user');
            await flushPromises();

            // THEN: no XHR proxy was installed; no resource events captured
            expect(O2Rum.startResource).not.toHaveBeenCalled();
            expect(O2Rum.stopResource).not.toHaveBeenCalled();
        });

        it('applies the updated sampling rate to subsequent requests', () => {
            // GIVEN tracking installed with rate=0
            O2RumResourceTracking.startTracking({
                resourceTraceSampleRate: 0,
                firstPartyHosts: [
                    {
                        match: 'api.example.com',
                        propagatorTypes: [PropagatorType.TRACECONTEXT]
                    }
                ]
            });

            // pre-update request is not sampled
            const xhrBeforeUpdate = new XMLHttpRequestMock();
            xhrBeforeUpdate.open('GET', 'https://api.example.com/v2/user');
            xhrBeforeUpdate.send();
            expect(
                xhrBeforeUpdate.requestHeaders.get(TRACECONTEXT_HEADER_KEY)
            ).toMatch(/-00$/);

            // WHEN
            O2RumResourceTracking.updateTrackingContext({
                resourceTraceSampleRate: 100
            });

            // THEN: post-update request uses the new rate
            const xhrAfterUpdate = new XMLHttpRequestMock();
            xhrAfterUpdate.open('GET', 'https://api.example.com/v2/user');
            xhrAfterUpdate.send();
            expect(
                xhrAfterUpdate.requestHeaders.get(TRACECONTEXT_HEADER_KEY)
            ).toMatch(/-01$/);
        });

        it('is a no-op after tracking has been stopped', async () => {
            // GIVEN
            O2RumResourceTracking.startTracking({
                resourceTraceSampleRate: 100,
                firstPartyHosts: [
                    {
                        match: 'api.example.com',
                        propagatorTypes: []
                    }
                ]
            });
            O2RumResourceTracking.stopTracking();

            // WHEN
            O2RumResourceTracking.updateTrackingContext({
                resourceTraceSampleRate: 100
            });

            executeRequest('https://api.example.com/v2/user');
            await flushPromises();

            // THEN: tracking remains stopped, nothing captured
            expect(O2Rum.startResource).not.toHaveBeenCalled();
            expect(O2Rum.stopResource).not.toHaveBeenCalled();
        });
    });
});
