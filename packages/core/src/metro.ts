/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import {
    withOpenObserveMetroConfig,
    getOpenObserveExpoConfig
} from './metro/plugin/metroConfig';
import type { OpenObserveMetroConfigOptions } from './metro/plugin/metroConfig';
import type { OpenObserveExpoConfigOptions } from './metro/plugin/types/expoTypes';

export { withOpenObserveMetroConfig, getOpenObserveExpoConfig };
export type { OpenObserveMetroConfigOptions, OpenObserveExpoConfigOptions };
