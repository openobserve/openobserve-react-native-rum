/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.openobserve.reactnative.sessionreplay.views

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.O2PrivacyViewManagerDelegate
import com.facebook.react.viewmanagers.O2PrivacyViewManagerInterface

class O2PrivacyViewManager(context: ReactApplicationContext) : ViewGroupManager<O2PrivacyView>(),
    O2PrivacyViewManagerInterface<O2PrivacyView> {
    companion object {
        const val REACT_CLASS = "O2PrivacyView"
    }

    private val delegate: O2PrivacyViewManagerDelegate<O2PrivacyView, O2PrivacyViewManager> = O2PrivacyViewManagerDelegate(this)

    override fun getDelegate(): ViewManagerDelegate<O2PrivacyView> = delegate

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(context: ThemedReactContext): O2PrivacyView = O2PrivacyView(context)

    @ReactProp(name = "hide")
    override fun setHide(view: O2PrivacyView?, value: Boolean) {
        view?.let { view.hide = value }
    }

    @ReactProp(name = "textAndInputPrivacy")
    override fun setTextAndInputPrivacy(view: O2PrivacyView?, value: String?) {
        view?.let { view.textAndInputPrivacy = value }
    }

    @ReactProp(name = "imagePrivacy")
    override fun setImagePrivacy(view: O2PrivacyView?, value: String?) {
        view?.let { view.imagePrivacy = value }
    }

    @ReactProp(name = "touchPrivacy")
    override fun setTouchPrivacy(view: O2PrivacyView?, value: String?) {
        view?.let { view.touchPrivacy = value }
    }

    @ReactProp(name = "nativeID")
    override fun setNativeID(view: O2PrivacyView?, value: String?) {
        view?.nativeID = value
    }

    @ReactProp(name = "attributes")
    override fun setAttributes(view: O2PrivacyView?, map: ReadableMap?) {
        view?.attributes = map?.toHashMap()?.mapValues {
            it.value.toString() ?: ""
        }
    }
}
