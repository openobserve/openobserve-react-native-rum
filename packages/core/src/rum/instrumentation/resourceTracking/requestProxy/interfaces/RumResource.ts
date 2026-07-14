/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import type { ResourceKind } from '../../../../types';
import type { OoRumResourceTracingAttributes } from '../../distributedTracing/distributedTracingAttributes';

export interface RUMResource {
    key: string;
    request: {
        method: string;
        url: string;
        kind: ResourceKind;
    };
    tracingAttributes: OoRumResourceTracingAttributes;
    graphqlAttributes?: OoRumResourceGraphqlAttributes;
    response: {
        statusCode: number;
        size: number;
    };
    timings: {
        startTime: number;
        stopTime: number;
        responseStartTime?: number;
    };
    resourceContext?: XMLHttpRequest;
}

export type OoRumResourceGraphqlError = {
    message: string;
    code?: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
};

export type OoRumResourceGraphqlAttributes = {
    operationType?: string;
    operationName?: string;
    variables?: string;
    payload?: string;
    errors?: OoRumResourceGraphqlError[];
};
