/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.openobserve.reactnative.webview

import com.openobserve.android.api.SdkCore
import com.openobserve.android.core.InternalSdkCore
import com.openobserve.android.webview.WebViewTracking
import com.openobserve.reactnative.OpenObserveSDKWrapperStorage
import main.reactnative.tools.unit.GenericAssert.Companion.assertThat
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.uimanager.ThemedReactContext
import com.reactnativecommunity.webview.RNCWebView
import com.reactnativecommunity.webview.RNCWebViewWrapper
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.api.extension.Extensions
import org.mockito.Mock
import org.mockito.MockedStatic
import org.mockito.Mockito
import org.mockito.Mockito.mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.junit.jupiter.MockitoSettings
import org.mockito.kotlin.any
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.mockito.quality.Strictness

@Extensions(
    ExtendWith(MockitoExtension::class)
)
@MockitoSettings(strictness = Strictness.LENIENT)
internal class OpenObserveWebViewTest {

    @Mock
    lateinit var themedReactContext: ThemedReactContext

    @Mock
    lateinit var datadogCore: InternalSdkCore

    private lateinit var webViewTrackingMockedStatic: MockedStatic<WebViewTracking>

    @BeforeEach
    fun `set up`() {
        whenever(themedReactContext.runOnUiQueueThread(any())).thenAnswer { answer ->
            answer.getArgument<Runnable>(0).run()
            true
        }

        webViewTrackingMockedStatic = Mockito.mockStatic(WebViewTracking::class.java)
        webViewTrackingMockedStatic.`when`<Unit> {
            WebViewTracking.enable(
                webView = any(), // Mock the WebView parameter
                allowedHosts = any(), // Mock the list of allowed hosts
                logsSampleRate = any(), // Mock the logsSampleRate parameter
                sdkCore = any() // Mock the SdkCore parameter
            )
        }.then {} // Return Unit as the function has no return value
    }

    @AfterEach
    fun `tear down`() {
        webViewTrackingMockedStatic.close()
    }

    @Test
    fun `OpenObserve Core is set once initialized`() {
        val manager = O2SdkReactNativeWebViewManager(themedReactContext)
        assertThat(manager.datadogCore).isNull()

        OpenObserveSDKWrapperStorage.notifyOnInitializedListeners(datadogCore)

        assertThat(manager.datadogCore).isNotNull()
        assertThat(manager.datadogCore).isInstanceOf(SdkCore::class.java)
    }

    @Test
    fun `Registers to SdkCore listener if the SDK is not initialized`() {
        // =========
        //   Given
        // =========
        val manager = O2SdkReactNativeWebViewManager(themedReactContext)

        // When first initialized, the WebView manager core should be null
        assertThat(manager.datadogCore).isNull()

        // =========
        //   When
        // =========
        val rncWebView = mock(RNCWebView::class.java)
        val rncWebViewWrapper = mock(RNCWebViewWrapper::class.java)
        whenever(rncWebViewWrapper.webView) doReturn rncWebView

        // When JS sends allowedHosts through 'injectedJavaScriptBeforeContentLoaded' prop
        manager.setInjectedJavaScriptBeforeContentLoaded(
            rncWebViewWrapper,
            "// #allowedHosts=[\"example.com\",\"test.com\"]"
        )

        // =========
        //   Then
        // =========

        // When we notify listeners that the core is available...
        OpenObserveSDKWrapperStorage.notifyOnInitializedListeners(datadogCore)

        // ...the WebView should enable WebView tracking in the UI Thread.
        verify(themedReactContext).runOnUiQueueThread(any())

        // Native WebView tracking should be called
        val arrayList = ArrayList(listOf("example.com", "test.com"))
        webViewTrackingMockedStatic.verify {
            WebViewTracking.enable(rncWebView, arrayList, 100.0f, datadogCore)
        }
    }
}
