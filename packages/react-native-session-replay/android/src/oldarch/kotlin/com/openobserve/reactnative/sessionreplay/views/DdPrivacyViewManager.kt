/*
 *  Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 *  This product includes software developed at Datadog (https://www.datadoghq.com/).
 *  Copyright 2016-Present Datadog, Inc.
 */
package com.openobserve.reactnative.sessionreplay.views

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.annotations.ReactProp

class OoPrivacyViewManager(context: ReactApplicationContext) : ViewGroupManager<OoPrivacyView>() {
    companion object {
        const val REACT_CLASS = "OoPrivacyView"
    }

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(context: ThemedReactContext): OoPrivacyView {
        return OoPrivacyView(context)
    }

    @ReactProp(name = "hide")
    fun setHide(view: OoPrivacyView?, value: Boolean) {
        view?.let { view.hide = value }
    }

    @ReactProp(name = "textAndInputPrivacy")
    fun setTextAndInputPrivacy(view: OoPrivacyView?, value: String?) {
        view?.let { view.textAndInputPrivacy = value }
    }

    @ReactProp(name = "imagePrivacy")
    fun setImagePrivacy(view: OoPrivacyView?, value: String?) {
        view?.let { view.imagePrivacy = value }
    }

    @ReactProp(name = "touchPrivacy")
    fun setTouchPrivacy(view: OoPrivacyView?, value: String?) {
        view?.let { view.touchPrivacy = value }
    }

    @ReactProp(name = "nativeID")
    fun setNativeID(view: OoPrivacyView?, value: String?) {
        view?.nativeID = value
    }

    @ReactProp(name = "attributes")
    fun setAttributes(view: OoPrivacyView?, map: ReadableMap?) {
        view?.attributes = map?.toHashMap()?.mapValues {
            it.value.toString() ?: ""
        }
    }
}
