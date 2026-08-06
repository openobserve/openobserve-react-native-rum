/*
* Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
* This product includes software developed at Datadog (https://www.datadoghq.com/).
* Copyright 2016-Present Datadog, Inc.
*/

package com.openobserve.reactnative.webview

import android.annotation.SuppressLint
import com.openobserve.android.api.SdkCore
import com.openobserve.android.webview.WebViewTracking
import com.openobserve.reactnative.OpenObserveSDKWrapperStorage
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.ThemedReactContext
import com.reactnativecommunity.webview.RNCWebView
import com.reactnativecommunity.webview.RNCWebViewClient
import com.reactnativecommunity.webview.RNCWebViewManager
import com.reactnativecommunity.webview.RNCWebViewWrapper
import org.json.JSONArray

/**
 * The entry point to use OpenObserve auto-instrumented WebView feature.
 */
class O2SdkReactNativeWebViewManager(
    private val reactContext: ReactContext
) : RNCWebViewManager() {
    // The name used to reference this custom View from React Native.
    override fun getName(): String {
        return VIEW_NAME
    }

    /**
     * The instance of OpenObserve SDK Core.
     */
    @Volatile private var _datadogCore: SdkCore? = null
    val datadogCore: SdkCore?
        get() = _datadogCore

    init {
        OpenObserveSDKWrapperStorage.addOnInitializedListener { core ->
            _datadogCore = core
        }
    }

    /**
     * Intercepts the WebView wrapper instance before it is returned and ensures that
     * JavaScript is enabled on the underlying WebView. JavaScript must be enabled
     * for OpenObserve WebView tracking to function correctly.
     */
    @SuppressLint("SetJavaScriptEnabled")
    override fun createViewInstance(context: ThemedReactContext): RNCWebViewWrapper {
        val viewInstance = super.createViewInstance(context)
        viewInstance.webView.settings.javaScriptEnabled = true
        return viewInstance
    }

    /**
     * Intercepts the JavaScript injected before the WebView loads.
     *
     * In the New Architecture, WebView props from React Native are ignored,
     * so this callback is the only reliable place to extract the
     * `// #allowedHosts=<JSON>` configuration and apply OpenObserve WebView tracking.
     */
    override fun setInjectedJavaScriptBeforeContentLoaded(
        view: RNCWebViewWrapper?,
        value: String?
    ) {
        val allowedHosts = value?.let { extractAllowedHosts(it) }
        val webView = view?.webView

        if (allowedHosts != null && webView != null) {
            configureWebViewTracking(webView, allowedHosts)
        }

        super.setInjectedJavaScriptBeforeContentLoaded(view, value)
    }

    private fun configureWebViewTracking(webView: RNCWebView, allowedHosts: List<String>) {
        val datadogCore = _datadogCore
        if (datadogCore != null) {
            WebViewTracking.enable(
                webView,
                allowedHosts = allowedHosts,
                sdkCore = datadogCore
            )
        } else {
            OpenObserveSDKWrapperStorage.addOnInitializedListener { core ->
                reactContext.runOnUiQueueThread {
                    WebViewTracking.enable(
                        webView,
                        allowedHosts = allowedHosts,
                        sdkCore = core
                    )
                }
            }
        }
    }

    override fun addEventEmitters(
        reactContext: ThemedReactContext,
        view: RNCWebViewWrapper
    ) {
        view.webView.webViewClient = RNCWebViewClient()
    }

    companion object {
        // The name used to reference this custom View from React Native.
        const val VIEW_NAME = "O2ReactNativeWebView"

        private fun extractAllowedHosts(input: String): List<String>? {
            // Regex that captures everything after "// #allowedHosts="
            val regex = Regex("""//\s*#allowedHosts\s*=\s*(.+)""")

            val match = regex.find(input) ?: return null
            val jsonString = match.groupValues[1].trim()

            return try {
                val jsonArray = JSONArray(jsonString)
                (0 until jsonArray.length()).map { jsonArray.getString(it) }
            } catch (e: Exception) {
                null
            }
        }
    }
}
