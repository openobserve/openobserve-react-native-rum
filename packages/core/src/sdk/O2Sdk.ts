/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import { getGlobalInstance } from '../utils/singletonUtils';

import { O2SdkWrapper } from './O2SdkInternal';
import type { O2SdkType } from './O2SdkInternal';

const CORE_MODULE = 'com.openobserve.reactnative.core';
export const O2Sdk = getGlobalInstance(
    CORE_MODULE,
    () => new O2SdkWrapper()
) as O2SdkType;
