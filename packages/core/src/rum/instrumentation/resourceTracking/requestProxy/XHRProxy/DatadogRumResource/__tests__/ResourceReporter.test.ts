/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { NativeModules } from 'react-native';

import { BufferSingleton } from '../../../../../../../sdk/DatadogProvider/Buffer/BufferSingleton';
import type { RUMResource } from '../../../interfaces/RumResource';
import { ResourceReporter } from '../ResourceReporter';

import { ResourceMockFactory } from './__utils__/ResourceMockFactory';

const resourceMockFactory = new ResourceMockFactory();
const OoRum = NativeModules.OoRum;
const flushPromises = () =>
    new Promise(jest.requireActual('timers').setImmediate);

beforeEach(() => {
    OoRum.startResource.mockClear();
    OoRum.stopResource.mockClear();
    BufferSingleton.onInitialization();
});

describe('Resource reporter', () => {
    it('reports resource when no mapper is passed', async () => {
        // GIVEN
        const resourceReporter = new ResourceReporter([]);
        const resource = resourceMockFactory.getBasicResource();

        // WHEN
        resourceReporter.reportResource(resource);
        await flushPromises();
        // THEN
        expect(OoRum.startResource).toHaveBeenCalledTimes(1);
        expect(OoRum.stopResource).toHaveBeenCalledTimes(1);
    });

    it('applies mappers when report resource is called', async () => {
        // GIVEN
        const setURLToGoogle = (resource: RUMResource) => {
            resource.request.url = 'https://google.com/';
            return resource;
        };
        const resourceReporter = new ResourceReporter([setURLToGoogle]);
        const resource = resourceMockFactory.getCustomResource({
            request: {
                method: 'GET',
                url: 'https://blabla.com',
                kind: 'xhr'
            }
        });

        // WHEN
        resourceReporter.reportResource(resource);
        await flushPromises();

        // THEN
        expect(OoRum.startResource).toHaveBeenCalledWith(
            expect.anything(),
            expect.anything(),
            'https://google.com/',
            expect.anything(),
            expect.anything()
        );
        expect(OoRum.stopResource).toHaveBeenCalledTimes(1);
    });

    it('drops the resource when a mapper returns null', async () => {
        // GIVEN
        const discardResource = (resource: RUMResource) => {
            return null;
        };
        const resourceReporter = new ResourceReporter([discardResource]);
        const resource = resourceMockFactory.getBasicResource();

        // WHEN
        resourceReporter.reportResource(resource);
        await flushPromises();

        // THEN
        expect(OoRum.startResource).not.toHaveBeenCalled();
        expect(OoRum.stopResource).not.toHaveBeenCalled();
    });
});
