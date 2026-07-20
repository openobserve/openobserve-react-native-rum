/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
import { getGlobalInstance } from '../utils/singletonUtils';

import { OoSdkWrapper } from './OoSdkInternal';
import type { OoSdkType } from './OoSdkInternal';

const CORE_MODULE = 'com.openobserve.reactnative.core';
export const OoSdk = getGlobalInstance(
    CORE_MODULE,
    () => new OoSdkWrapper()
) as OoSdkType;
