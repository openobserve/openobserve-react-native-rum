/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { OoRum } from '../../../../../OoRum';
import { TracingIdFormat } from '../../../distributedTracing/TracingIdentifier';
import type { RUMResource } from '../../interfaces/RumResource';

import { createTimings } from './resourceTiming';

type ResourceMapper = (resource: RUMResource) => RUMResource | null;

export class ResourceReporter {
    private mappers: ResourceMapper[];

    constructor(resourceMappers: ResourceMapper[]) {
        this.mappers = resourceMappers;
    }

    reportResource = (resource: RUMResource) => {
        let modifiedResource: RUMResource | null = resource;

        for (const mapper of this.mappers) {
            modifiedResource = mapper(resource);
            if (modifiedResource === null) {
                return;
            }
        }

        reportResource(modifiedResource);
    };
}

const formatResourceStartContext = (
    tracingAttributes: RUMResource['tracingAttributes']
): Record<string, string | number> => {
    const attributes: Record<string, string | number> = {};
    if (tracingAttributes.samplingPriorityHeader !== '0') {
        attributes['_o2.span_id'] = tracingAttributes.spanId.toString(
            TracingIdFormat.decimal
        );
        attributes['_o2.trace_id'] = tracingAttributes.traceId.toString(
            TracingIdFormat.paddedHex
        );
        attributes['_o2.rule_psr'] = tracingAttributes.rulePsr;
    }

    return attributes;
};

const formatResourceStopContext = (
    timings: RUMResource['timings'],
    graphqlAttributes: RUMResource['graphqlAttributes']
): Record<string, unknown> => {
    const attributes: Record<string, unknown> = {};

    if (timings.responseStartTime !== undefined) {
        attributes['_o2.resource_timings'] = createTimings(
            timings.startTime,
            timings.responseStartTime,
            timings.stopTime
        );
    }

    if (graphqlAttributes?.operationType) {
        attributes['_o2.graphql.operation_type'] =
            graphqlAttributes.operationType;
        if (graphqlAttributes.operationName) {
            attributes['_o2.graphql.operation_name'] =
                graphqlAttributes.operationName;
        }
        if (graphqlAttributes.variables) {
            attributes['_o2.graphql.variables'] = graphqlAttributes.variables;
        }

        if (graphqlAttributes.payload) {
            attributes['_o2.graphql.payload'] = graphqlAttributes.payload;
        }

        if (graphqlAttributes.errors) {
            attributes['_o2.graphql.errors'] = JSON.stringify(
                graphqlAttributes.errors
            );
        }
    }

    return attributes;
};

const reportResource = async (resource: RUMResource) => {
    await OoRum.startResource(
        resource.key,
        resource.request.method,
        resource.request.url,
        formatResourceStartContext(resource.tracingAttributes),
        resource.timings.startTime
    );

    OoRum.stopResource(
        resource.key,
        resource.response.statusCode,
        resource.request.kind,
        resource.response.size,
        formatResourceStopContext(resource.timings, resource.graphqlAttributes),
        resource.timings.stopTime,
        resource.resourceContext
    );
};
