/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { ApolloLink } from '@apollo/client';
import {
    OPENOBSERVE_GRAPH_QL_OPERATION_TYPE_HEADER,
    OPENOBSERVE_GRAPH_QL_OPERATION_NAME_HEADER,
    OPENOBSERVE_GRAPH_QL_VARIABLES_HEADER,
    OPENOBSERVE_GRAPH_QL_PAYLOAD_HEADER,
    OPENOBSERVE_GRAPH_QL_ERROR_HEADER
} from '@openobserve/mobile-react-native';

import {
    getOperationName,
    getVariables,
    getOperationType,
    getPayload
} from './helpers';

export type OpenObserveLinkOptions = {
    trackVariables?: boolean;
    trackPayload?: boolean;
    trackErrors?: boolean;
};

export class OpenObserveLink extends ApolloLink {
    private trackVariables = true;
    private trackPayload = false;
    private trackErrors = false;

    constructor(options: OpenObserveLinkOptions = {}) {
        super((operation, forward) => {
            const operationName = getOperationName(operation);
            const formattedVariables = getVariables(
                operation,
                this.trackVariables
            );
            const operationType = getOperationType(operation);
            const payload = getPayload(operation, this.trackPayload);

            operation.setContext(({ headers = {} }) => {
                const newHeaders: Record<string, string | null> = {
                    ...headers
                };

                newHeaders[
                    OPENOBSERVE_GRAPH_QL_OPERATION_TYPE_HEADER
                ] = operationType;

                newHeaders[
                    OPENOBSERVE_GRAPH_QL_OPERATION_NAME_HEADER
                ] = operationName;

                if (formattedVariables) {
                    newHeaders[
                        OPENOBSERVE_GRAPH_QL_VARIABLES_HEADER
                    ] = formattedVariables;
                }

                if (payload) {
                    newHeaders[OPENOBSERVE_GRAPH_QL_PAYLOAD_HEADER] = payload;
                }

                newHeaders[OPENOBSERVE_GRAPH_QL_ERROR_HEADER] = this.trackErrors
                    ? 'true'
                    : 'false';

                return {
                    headers: newHeaders
                };
            });

            return forward(operation);
        });

        this.trackVariables = options.trackVariables ?? true;
        this.trackPayload = options.trackPayload ?? false;
        this.trackErrors = options.trackErrors ?? false;
    }
}
