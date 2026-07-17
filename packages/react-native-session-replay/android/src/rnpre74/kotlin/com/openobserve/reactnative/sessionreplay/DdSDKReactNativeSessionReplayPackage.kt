/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.openobserve.reactnative.sessionreplay

import com.openobserve.reactnative.sessionreplay.views.OoPrivacyViewManager
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Package of native openobserve-react-native-rum native modules.
 */
class OoSDKReactNativeSessionReplayPackage : ReactPackage {

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> {
        return listOf(OoPrivacyViewManager(reactContext))
    }

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> {
        return listOf(OoSessionReplay(reactContext))
    }
}
