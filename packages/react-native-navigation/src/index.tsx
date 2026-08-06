/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import type {
    ViewNamePredicate,
    ViewTrackingPredicate,
    ParamsTrackingPredicate,
    NavigationTrackingOptions
} from './rum/instrumentation/O2RumReactNativeNavigationTracking';
import { O2RumReactNativeNavigationTracking } from './rum/instrumentation/O2RumReactNativeNavigationTracking';

export { O2RumReactNativeNavigationTracking };

export type {
    ViewNamePredicate,
    ViewTrackingPredicate,
    ParamsTrackingPredicate,
    NavigationTrackingOptions
};

export * from 'react-native-navigation';
