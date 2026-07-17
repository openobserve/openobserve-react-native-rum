/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */
@file:Suppress("TooManyFunctions")

package com.openobserve.reactnative

import android.content.Context
import com.openobserve.android.OpenObserve
import com.openobserve.android.api.InternalLogger
import com.openobserve.android.api.feature.FeatureSdkCore
import com.openobserve.android.core.InternalSdkCore
import com.openobserve.android.core.configuration.Configuration
import com.openobserve.android.privacy.TrackingConsent
import com.openobserve.android.rum.GlobalRumMonitor
import com.openobserve.android.rum.RumMonitor
import com.openobserve.android.webview.WebViewTracking
import com.facebook.react.bridge.ReadableMap

/**
 * Internal object used to add internal testing.
 */
object OpenObserveSDKWrapperStorage {
    internal val onInitializedListeners: MutableList<(InternalSdkCore) -> Unit> = mutableListOf()
    private var core: InternalSdkCore? = null

    /**
     * Adds a Listener called when the core is initialized.
     */
    fun addOnInitializedListener(listener: (InternalSdkCore) -> Unit) {
        onInitializedListeners.add(listener)
    }

    /**
     * Exposed for testing purposes only.
     */
    fun notifyOnInitializedListeners(ddCore: InternalSdkCore) {
        for (listener in onInitializedListeners) {
            listener(ddCore)
        }
    }
}

internal class OpenObserveSDKWrapper : OpenObserveWrapper {
    override var bundleLogsWithRum = DefaultConfiguration.bundleLogsWithRum
    override var bundleLogsWithTraces = DefaultConfiguration.bundleLogsWithTraces

    // We use Kotlin backing field here to initialize once the telemetry proxy
    // and make sure it is only after SDK is initialized.
    private var webViewProxy: WebViewTracking._InternalWebViewProxy? = null
        get() {
            if (field == null && isInitialized()) {
                field = WebViewTracking._InternalWebViewProxy(OpenObserve.getInstance())
            }

            return field
        }

    override fun setVerbosity(level: Int) {
        OpenObserve.setVerbosity(level)
    }

    override fun initialize(
        context: Context,
        configuration: Configuration,
        consent: TrackingConsent
    ) {
        val core = OpenObserve.initialize(context, configuration, consent)
        OpenObserveSDKWrapperStorage.notifyOnInitializedListeners(core as InternalSdkCore)
    }

    override fun setUserInfo(
        id: String,
        name: String?,
        email: String?,
        extraInfo: Map<String, Any?>
    ) {
        OpenObserve.setUserInfo(id, name, email, extraInfo)
    }

    override fun addUserExtraInfo(
        extraInfo: Map<String, Any?>
    ) {
        OpenObserve.addUserProperties(extraInfo)
    }

    override fun clearUserInfo() {
        OpenObserve.clearUserInfo()
    }

    override fun setAccountInfo(
        id: String,
        name: String?,
        extraInfo: Map<String, Any?>
    ) {
        OpenObserve.setAccountInfo(id, name, extraInfo)
    }

    override fun addAccountExtraInfo(
        extraInfo: Map<String, Any?>
    ) {
        OpenObserve.addAccountExtraInfo(extraInfo)
    }

    override fun clearAccountInfo() {
        OpenObserve.clearAccountInfo()
    }

    override fun addRumGlobalAttribute(key: String, value: Any?) {
        this.getRumMonitor().addAttribute(key, value)
    }

    override fun removeRumGlobalAttribute(key: String) {
        this.getRumMonitor().removeAttribute(key)
    }

    override fun addRumGlobalAttributes(attributes: Map<String, Any?>) {
        for (attribute in attributes) {
            this.addRumGlobalAttribute(attribute.key, attribute.value)
        }
    }

    override fun removeRumGlobalAttributes(keys: Array<String>) {
        for (key in keys) {
            this.removeRumGlobalAttribute(key)
        }
    }

    override fun setTrackingConsent(trackingConsent: TrackingConsent) {
        OpenObserve.setTrackingConsent(trackingConsent)
    }

    override fun consumeWebviewEvent(message: String) {
        webViewProxy?.consumeWebviewEvent(message)
    }

    override fun isInitialized(): Boolean {
        return OpenObserve.isInitialized()
    }

    override fun getRumMonitor(): RumMonitor {
        return GlobalRumMonitor.get(OpenObserve.getInstance())
    }

    override fun clearAllData() {
        return OpenObserve.clearAllData(OpenObserve.getInstance())
    }
}

