/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

#import <React/RCTViewManager.h>
#if __has_include("OpenObserveSDKReactNativeSessionReplay-Swift.h")
#import <OpenObserveSDKReactNativeSessionReplay-Swift.h>
#else
#import <OpenObserveSDKReactNativeSessionReplay/OpenObserveSDKReactNativeSessionReplay-Swift.h>
#endif

@interface O2PrivacyView : UIView

@property (nonatomic, strong) NSString *textPrivacy;
@property (nonatomic, strong) NSString *imagePrivacy;
@property (nonatomic, strong) NSString *touchPrivacy;
@property (nonatomic, assign) BOOL hide;
@property (nonatomic, copy) NSString *nativeID;

@property (nonatomic, copy) NSDictionary<NSString *, NSString *> *attributes;

@end

@implementation O2PrivacyView
@end


@interface O2PrivacyViewPaper : RCTViewManager
@end

@implementation O2PrivacyViewPaper

RCT_EXPORT_MODULE(O2PrivacyView)

- (UIView *) view {
    return [[O2PrivacyView alloc] init];
}

RCT_CUSTOM_VIEW_PROPERTY(textAndInputPrivacy, NSString, O2PrivacyView) {
    view.textPrivacy = [RCTConvert NSString:json];
    [self setPrivacyOverridesFor:view];
}

RCT_CUSTOM_VIEW_PROPERTY(imagePrivacy, NSString, O2PrivacyView) {
    view.imagePrivacy = [RCTConvert NSString:json];
    [self setPrivacyOverridesFor:view];
}

RCT_CUSTOM_VIEW_PROPERTY(touchPrivacy, NSString, O2PrivacyView) {
    view.touchPrivacy = [RCTConvert NSString:json];
    [self setPrivacyOverridesFor:view];
}

RCT_CUSTOM_VIEW_PROPERTY(hide, BOOL, O2PrivacyView) {
    view.hide = json ? [json boolValue] : NO;
    [self setPrivacyOverridesFor:view];
}

RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString, O2PrivacyView) {
    view.nativeID = [RCTConvert NSString:json];
}

RCT_CUSTOM_VIEW_PROPERTY(attributes, NSDictionary, O2PrivacyView) {
    if (json && [json isKindOfClass:[NSDictionary class]]) {
        NSMutableDictionary<NSString *, NSString *> *dict = [NSMutableDictionary new];
        for (id key in json) {
            id value = json[key];
            if ([key isKindOfClass:[NSString class]] && [value isKindOfClass:[NSString class]]) {
                dict[key] = value;
            } else if ([key isKindOfClass:[NSString class]] && value != [NSNull null]) {
                dict[key] = [value description];
            }
        }
        view.attributes = dict;
    } else {
        view.attributes = nil;
    }
}

- (void) setPrivacyOverridesFor:(O2PrivacyView *) view {
    [O2PrivacyOverrider setOverridesFor:view textPrivacy:view.textPrivacy imagePrivacy:view.imagePrivacy touchPrivacy:view.touchPrivacy hide:view.hide];
}

@end
