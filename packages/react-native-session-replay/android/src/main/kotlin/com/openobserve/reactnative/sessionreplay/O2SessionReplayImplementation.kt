/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.openobserve.reactnative.sessionreplay

import android.annotation.SuppressLint
import com.openobserve.android.OpenObserve
import com.openobserve.android.api.feature.FeatureSdkCore
import com.openobserve.android.sessionreplay.SessionReplayConfiguration
import com.openobserve.android.sessionreplay._SessionReplayInternalProxy
import com.openobserve.reactnative.sessionreplay.utils.text.TextViewUtils
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactContext

/**
 * The entry point to use OpenObserve's Session Replay feature.
 */
class O2SessionReplayImplementation(
    private val reactContext: ReactContext,
    private val sessionReplayProvider: () -> SessionReplayWrapper = {
        SessionReplaySDKWrapper()
    }
) {
    /**
     * Enable session replay and start recording session.
     * @param replaySampleRate The sample rate applied for session replay.
     * @param customEndpoint Custom server url for sending replay data.
     * @param privacySettings Defines the way visual elements should be masked.
     * @param customEndpoint Custom server url for sending replay data.
     * @param startRecordingImmediately Whether the recording should start immediately when the feature is enabled.
     * @param enableHeatmaps Enables heatmap identifier computation.
     * Currently unused on Android; reserved for heatmap support.
     */
    @SuppressLint("VisibleForTests")
    @Suppress("LongParameterList", "UnusedParameter")
    fun enable(
        replaySampleRate: Double,
        customEndpoint: String,
        privacySettings: SessionReplayPrivacySettings,
        startRecordingImmediately: Boolean,
        enableHeatmaps: Boolean,
        promise: Promise
    ) {
        val sdkCore = OpenObserve.getInstance() as FeatureSdkCore
        val logger = sdkCore.internalLogger
        val textViewUtils = TextViewUtils.create(reactContext, logger)
        val internalCallback = ReactNativeInternalCallback(reactContext)
        val configuration = SessionReplayConfiguration.Builder(replaySampleRate.toFloat())
            .startRecordingImmediately(startRecordingImmediately)
            .setImagePrivacy(privacySettings.imagePrivacyLevel)
            .setTouchPrivacy(privacySettings.touchPrivacyLevel)
            .setTextAndInputPrivacy(privacySettings.textAndInputPrivacyLevel)
            .addExtensionSupport(ReactNativeSessionReplayExtensionSupport(textViewUtils, internalCallback))
            .let {
                _SessionReplayInternalProxy(it).setInternalCallback(internalCallback)
            }

        if (customEndpoint != "") {
            configuration.useCustomEndpoint(customEndpoint)
        }

        sessionReplayProvider().enable(configuration.build(), sdkCore)

        promise.resolve(null)
    }

    /**
     * Manually start recording the current session.
     */
    fun startRecording(promise: Promise) {
        sessionReplayProvider().startRecording(
            OpenObserve.getInstance() as FeatureSdkCore
        )
        promise.resolve(null)
    }

    /**
     * Manually stop recording the current session.
     */
    fun stopRecording(promise: Promise) {
        sessionReplayProvider().stopRecording(
            OpenObserve.getInstance() as FeatureSdkCore
        )
        promise.resolve(null)
    }

    internal companion object {
        internal const val NAME = "O2SessionReplay"
    }
}
