/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.datadog.reactnative

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * Package of native dd-sdk-reactnative native modules.
 */
class OoSdkReactNativePackage : TurboReactPackage() {
    private val sdkWrapper = DatadogSDKWrapper()
    private val ddTelemetry = OoTelemetry()
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return when (name) {
            OoSdkImplementation.NAME -> OoSdk(reactContext, sdkWrapper, ddTelemetry)
            OoRumImplementation.NAME -> OoRum(reactContext, sdkWrapper)
            OoTraceImplementation.NAME -> OoTrace(reactContext)
            OoLogsImplementation.NAME -> OoLogs(reactContext, sdkWrapper)
            OoFlagsImplementation.NAME -> OoFlags(reactContext)
            else -> null
        }
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            val isTurboModule: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            val moduleInfos = listOf(
                OoSdkImplementation.NAME,
                OoRumImplementation.NAME,
                OoTraceImplementation.NAME,
                OoLogsImplementation.NAME,
                OoFlagsImplementation.NAME
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
