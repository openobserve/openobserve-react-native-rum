/*
* Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
* This product includes software developed at Datadog (https://www.datadoghq.com/).
* Copyright 2016-Present Datadog, Inc.
*/
package com.openobserve.reactnative.webview

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

class O2SdkReactNativeWebViewPackage : TurboReactPackage() {
    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): MutableList<ViewManager<*,*>> {
        return mutableListOf(
            O2SdkReactNativeWebViewManager(reactContext)
        )
    }

    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return null
    }
    
    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf<String, ReactModuleInfo>()
        }
    }
}
