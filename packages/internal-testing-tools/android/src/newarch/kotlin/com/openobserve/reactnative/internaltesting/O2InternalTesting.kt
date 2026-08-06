/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.openobserve.reactnative.internaltesting

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod

/**
 * The entry point to use OpenObserve's internal testing feature.
 */
class O2InternalTesting(
    reactContext: ReactApplicationContext
) : NativeDdInternalTestingSpec(reactContext) {

    private val implementation = O2InternalTestingImplementation()

    override fun getName(): String = O2InternalTestingImplementation.NAME

    /**
     * Clears all data for all features.
     */
    @ReactMethod
    override fun clearData(promise: Promise) {
        implementation.clearData(promise)
    }

    /**
     * Retrieves the list of events for a given feature.
     */
    @ReactMethod
    override fun getAllEvents(feature: String, promise: Promise) {
        implementation.getAllEvents(feature, promise)
    }
    
    /**
     * Enable native testing module.
     */
    @ReactMethod
    override fun enable(promise: Promise) {
        implementation.enable(promise)
    }
}
