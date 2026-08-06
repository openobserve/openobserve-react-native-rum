/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
import type { HostComponent, ViewProps } from 'react-native';

type Attributes = {
    type?: string;
    hash?: string;
    width?: string;
    height?: string;
};

interface O2PrivacyViewProps extends ViewProps {
    textAndInputPrivacy: string;
    imagePrivacy: string;
    touchPrivacy: string;
    hide: boolean;
    nativeID: string;
    attributes: Attributes;
}

export default codegenNativeComponent<O2PrivacyViewProps>('O2PrivacyView', {
    paperComponentName: 'O2PrivacyView'
}) as HostComponent<O2PrivacyViewProps>;
