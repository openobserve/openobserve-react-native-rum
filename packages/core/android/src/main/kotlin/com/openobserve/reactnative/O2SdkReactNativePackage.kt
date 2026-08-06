/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.openobserve.reactnative

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Package of native openobserve-react-native-rum native modules.
 */
class O2SdkReactNativePackage : TurboReactPackage() {
    private val sdkWrapper = OpenObserveSDKWrapper()
    private val ddTelemetry = O2Telemetry()
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return when (name) {
            O2SdkImplementation.NAME -> O2Sdk(reactContext, sdkWrapper, ddTelemetry)
            O2RumImplementation.NAME -> O2Rum(reactContext, sdkWrapper)
            O2TraceImplementation.NAME -> O2Trace(reactContext)
            O2LogsImplementation.NAME -> O2Logs(reactContext, sdkWrapper)
            O2FlagsImplementation.NAME -> O2Flags(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            val isTurboModule: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            val moduleInfos = listOf(
                O2SdkImplementation.NAME,
                O2RumImplementation.NAME,
                O2TraceImplementation.NAME,
                O2LogsImplementation.NAME,
                O2FlagsImplementation.NAME
            ).associateWith {
                ReactModuleInfo(
                    it,
                    it,
                    false,  // canOverrideExistingModule
                    false,  // needsEagerInit
                    true,  // hasConstants
                    false,  // isCxxModule
                    isTurboModule // isTurboModule
                )
            }

            moduleInfos
        }
    }
}
