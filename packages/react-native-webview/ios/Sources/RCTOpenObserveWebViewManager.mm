/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

#import <Foundation/Foundation.h>
#import "RCTOpenObserveWebViewManager.h"
#import "RCTOpenObserveWebView.h"

#if __has_include("OpenObserveSDKReactNativeWebView-Swift.h")
#import <OpenObserveSDKReactNativeWebView-Swift.h>
#else
#import <OpenObserveSDKReactNativeWebView/OpenObserveSDKReactNativeWebView-Swift.h>
#endif

@interface RCTOpenObserveWebViewManager () <RNCWebViewDelegate, RCTOpenObserveWebViewDelegate>
    @property (nonatomic, strong) NSMutableSet *allowedHosts;
@property (nonatomic, strong) RCTOpenObserveWebViewTracking* webViewTracking;
@end

@implementation RCTOpenObserveWebViewManager { }

// The module is exported to React Native with the name defined here.
RCT_EXPORT_MODULE(O2ReactNativeWebView)

// Allowed Hosts (REQUIRED)
RCT_CUSTOM_VIEW_PROPERTY(allowedHosts, NSArray, RCTOpenObserveWebView)
{
    NSArray* allowedHosts = [RCTConvert NSArray:json];
    [self setupOpenObserveWebView:allowedHosts view:view];
}

+ (BOOL)requiresMainQueueSetup {
    return NO;
}

// MARK: - Initialization
- (instancetype)init
{
    self = [super init];
    if (self) {
        self.allowedHosts = [[NSMutableSet alloc] init];
        self.webViewTracking = [[RCTOpenObserveWebViewTracking alloc] init];
    }
    return self;
}

// MARK: - View Manager
- (UIView *)view
{
    RCTOpenObserveWebView *rctWebView = [RCTOpenObserveWebView new];
    rctWebView.delegate = self;
    rctWebView.ddWebViewDelegate = self;
    rctWebView.javaScriptEnabled = true;
    return rctWebView;
}

// MARK: - OpenObserve Setup

/**
 * Setups the OpenObserve WebView by setting the allowed hosts and enabling tracking.
 *
 * @param allowedHosts The list of allowed hosts
 * @param view The RCTOpenObserveWebView as returned by the ViewManager
 */
- (void)setupOpenObserveWebView:(NSArray *)allowedHosts view:(RCTOpenObserveWebView*)view {
    [self.allowedHosts removeAllObjects];
    for (NSObject* obj in allowedHosts) {
        if (![obj isKindOfClass:[NSString class]]) {
            continue;
        }
        [self.allowedHosts addObject:obj];
    }
    
    [self.webViewTracking enableWithWebView:view allowedHosts:self.allowedHosts];
}

// MARK: - RCTOpenObserveWebViewDelegate
- (void)didCreateWebView:(RCTOpenObserveWebView *)webView {
    if (self.allowedHosts.count == 0) {
        return;
    }
    [self.webViewTracking enableWithWebView:webView allowedHosts:self.allowedHosts];
}

// MARK: - WKWebViewDelegate
- (BOOL)webView:(nonnull RNCWebViewImpl *)webView shouldStartLoadForRequest:(nonnull NSMutableDictionary<NSString *,id> *)request withCallback:(nonnull RCTDirectEventBlock)callback {
    return true;
}

@end
