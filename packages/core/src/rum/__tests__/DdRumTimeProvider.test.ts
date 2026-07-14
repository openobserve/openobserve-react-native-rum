/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { OoRum } from '../OoRum';
import { MockTimeProvider } from '../__mocks__/MockTimeProvider';

jest.unmock('../../utils/time-provider/TimeProvider');

describe('OoRum', () => {
    describe('setTimeProvider', () => {
        it('overrides default time provider', async () => {
            const mockTimeProvider = new MockTimeProvider(1000, 2000);
            OoRum.setTimeProvider(mockTimeProvider);

            const timestamp = OoRum['timeProvider'].getTimestamp();
            expect(timestamp.unix).toBe(1000);
            expect(timestamp.reactNative).toBe(2000);
        });
    });
});
