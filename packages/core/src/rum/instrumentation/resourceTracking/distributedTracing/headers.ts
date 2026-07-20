/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0. This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

/**
 * OpenObserve headers
 *
 * openobserve: the x-<vendor>-{trace-id,parent-id,origin,sampling-priority,tags} constants
 * were removed with the proprietary propagator (see PropagatorType). They were read only by
 * an upstream-instrumented APM — never by OpenObserve, whose intake speaks W3C `traceparent`.
 */
export const TRACKED_BY_HEADER_KEY = 'x-openobserve-tracked-by';
export const TRACKED_BY_HEADER_VALUE = 'react-native';
export const DD_TRACE_ID_TAG = '_oo.p.tid';
export const DD_RUM_SESSION_ID_TAG = 'session.id';
export const DD_RUM_USER_ID_TAG = 'user.id';
export const DD_RUM_ACCOUNT_ID_TAG = 'account.id';

/**
 * OTel headers
 */
export const TRACECONTEXT_HEADER_KEY = 'traceparent';
export const TRACESTATE_HEADER_KEY = 'tracestate';
export const BAGGAGE_HEADER_KEY = 'baggage';
export const B3_HEADER_KEY = 'b3';
export const B3_MULTI_TRACE_ID_HEADER_KEY = 'X-B3-TraceId';
export const B3_MULTI_SPAN_ID_HEADER_KEY = 'X-B3-SpanId';
export const B3_MULTI_SAMPLED_HEADER_KEY = 'X-B3-Sampled';
