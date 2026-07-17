/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

package com.openobserve.reactnative.sessionreplay

import com.openobserve.android.sessionreplay.ExtensionSupport
import com.openobserve.android.sessionreplay.MapperTypeWrapper
import com.openobserve.android.sessionreplay.recorder.OptionSelectorDetector
import com.openobserve.android.sessionreplay.utils.DrawableToColorMapper
import com.openobserve.reactnative.sessionreplay.mappers.ReactEditTextMapper
import com.openobserve.reactnative.sessionreplay.mappers.ReactNativeImageViewMapper
import com.openobserve.reactnative.sessionreplay.mappers.ReactTextMapper
import com.openobserve.reactnative.sessionreplay.mappers.ReactViewGroupMapper
import com.openobserve.reactnative.sessionreplay.mappers.ReactViewModalMapper
import com.openobserve.reactnative.sessionreplay.mappers.SvgViewMapper
import com.openobserve.reactnative.sessionreplay.utils.text.TextViewUtils
import com.openobserve.reactnative.sessionreplay.views.OoPrivacyView
import com.facebook.react.views.image.ReactImageView
import com.facebook.react.views.modal.ReactModalHostView
import com.facebook.react.views.text.ReactTextView
import com.facebook.react.views.textinput.ReactEditText
import com.facebook.react.views.view.ReactViewGroup


internal class ReactNativeSessionReplayExtensionSupport(
    private val textViewUtils: TextViewUtils,
    private val internalCallback: ReactNativeInternalCallback
) : ExtensionSupport {
    override fun name(): String {
        return ReactNativeSessionReplayExtensionSupport::class.java.simpleName
    }

    override fun getCustomViewMappers(): List<MapperTypeWrapper<*>> {
        return listOf(
            MapperTypeWrapper(ReactImageView::class.java, ReactNativeImageViewMapper()),
            MapperTypeWrapper(OoPrivacyView::class.java, SvgViewMapper(internalCallback)),
            MapperTypeWrapper(ReactViewGroup::class.java, ReactViewGroupMapper()),
            MapperTypeWrapper(ReactTextView::class.java, ReactTextMapper(textViewUtils)),
            MapperTypeWrapper(ReactEditText::class.java, ReactEditTextMapper(textViewUtils)),
            MapperTypeWrapper(ReactModalHostView::class.java, ReactViewModalMapper()),
        )
    }

    override fun getOptionSelectorDetectors(): List<OptionSelectorDetector> {
        return listOf()
    }

    override fun getCustomDrawableMapper(): List<DrawableToColorMapper> {
        return emptyList()
    }
}
