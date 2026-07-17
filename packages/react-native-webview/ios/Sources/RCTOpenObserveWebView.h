/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

#import "RNCWebViewImpl.h"

@class RCTOpenObserveWebView;

@protocol RCTOpenObserveWebViewDelegate <NSObject>
- (void)didCreateWebView:(RCTOpenObserveWebView *)webView;
@end

@interface RCTOpenObserveWebView : RNCWebViewImpl

@property (nonatomic, weak) id<RCTOpenObserveWebViewDelegate> ddWebViewDelegate;
@property (nonatomic, assign) BOOL isTrackingEnabled;

- (WKWebView*) getWKWebView;
@end
