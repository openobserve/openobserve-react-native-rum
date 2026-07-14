/*
 * Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2016-Present Datadog, Inc.
 */

import { OoRum, InternalLog, SdkVerbosity } from '@openobserve/mobile-react-native';
import type { ComponentDidAppearEvent } from 'react-native-navigation';
import { Navigation } from 'react-native-navigation';
import type {
    AppStateStatus,
    EmitterSubscription,
    NativeEventSubscription
} from 'react-native';
import { AppState } from 'react-native';

export type NavigationTrackingOptions = {
    viewNamePredicate?: ViewNamePredicate;
    viewTrackingPredicate?: ViewTrackingPredicate;
    paramsTrackingPredicate?: ParamsTrackingPredicate;
};

export type ViewNamePredicate = (
    event: ComponentDidAppearEvent,
    trackedName: string
) => string | null;

export type ViewTrackingPredicate = (event: ComponentDidAppearEvent) => boolean;

export type ParamsTrackingPredicate = (
    event: ComponentDidAppearEvent
) => object | undefined;

function defaultViewNamePredicate(
    _event: ComponentDidAppearEvent,
    trackedName: string
) {
    return trackedName;
}

function defaultParamsPredicate(_event: ComponentDidAppearEvent) {
    return undefined;
}

function defaultViewTrackingPredicate(_event: ComponentDidAppearEvent) {
    return true;
}

// AppStateStatus can have values:
//     'active' - The app is running in the foreground
//     'background' - The app is running in the background. The user is either in another app or on the home screen
//     'inactive' [iOS] - This is a transition state that currently never happens for typical React Native apps.
//     'unknown' [iOS] - Initial value until the current app state is determined
//     'extension' [iOS] - The app is running as an app extension
declare type AppStateListener = (appStateStatus: AppStateStatus) => void | null;

/**
 * Provides RUM integration for the [React Native Navigation](https://wix.github.io/react-native-navigation) API.
 */
export class OoRumReactNativeNavigationTracking {
    private static isTracking = false;
    private static eventSubscription:
        | EmitterSubscription
        | undefined = undefined;
    private static appStateSubscription?: NativeEventSubscription;

    private static viewNamePredicate: ViewNamePredicate;
    private static viewTrackingPredicate: ViewTrackingPredicate;
    private static paramsTrackingPredicate: ParamsTrackingPredicate;
    private static lastView?:
        | {
              key: string;
              name: string;
          }
        | 'tracking_not_started' = 'tracking_not_started';

    /**
     * Starts tracking the Navigation and sends a RUM View event every time a root View component appear/disappear.
     */
    static startTracking(trackingOptions?: NavigationTrackingOptions): void {
        // extra safety to avoid wrapping more than 1 time this function
        if (OoRumReactNativeNavigationTracking.isTracking) {
            return;
        }

        const {
            viewNamePredicate = defaultViewNamePredicate,
            viewTrackingPredicate = defaultViewTrackingPredicate,
            paramsTrackingPredicate = defaultParamsPredicate
        } = trackingOptions ?? {};

        OoRumReactNativeNavigationTracking.eventSubscription = Navigation.events().registerComponentDidAppearListener(
            (event: ComponentDidAppearEvent) => {
                const predicate =
                    OoRumReactNativeNavigationTracking.viewNamePredicate;
                const screenName = predicate(event, event.componentName);
                const shouldTrack = OoRumReactNativeNavigationTracking.viewTrackingPredicate(
                    event
                );
                if (screenName !== null && shouldTrack) {
                    const passProps = OoRumReactNativeNavigationTracking.paramsTrackingPredicate(
                        event
                    );

                    if (passProps) {
                        OoRum.startView(event.componentId, screenName, {
                            passProps
                        });
                    } else {
                        OoRum.startView(event.componentId, screenName);
                    }

                    OoRumReactNativeNavigationTracking.lastView = {
                        key: event.componentId,
                        name: screenName
                    };
                }
            }
        );

        OoRumReactNativeNavigationTracking.isTracking = true;
        OoRumReactNativeNavigationTracking.viewNamePredicate = viewNamePredicate;
        OoRumReactNativeNavigationTracking.viewTrackingPredicate = viewTrackingPredicate;
        OoRumReactNativeNavigationTracking.paramsTrackingPredicate = paramsTrackingPredicate;
        this.appStateSubscription = AppState.addEventListener(
            'change',
            OoRumReactNativeNavigationTracking.appStateListener
        );
    }

    /**
     * Stops tracking Navigation.
     */
    static stopTracking(): void {
        if (!OoRumReactNativeNavigationTracking.isTracking) {
            return;
        }
        if (OoRumReactNativeNavigationTracking.eventSubscription) {
            OoRumReactNativeNavigationTracking.eventSubscription.remove();
        }
        // For versions of React Native below 0.65, addEventListener does not return a subscription.
        // We have to call AppState.removeEventListener instead.
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
        } else {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            AppState.removeEventListener(
                'change',
                OoRumReactNativeNavigationTracking.appStateListener
            );
        }

        OoRumReactNativeNavigationTracking.lastView = undefined;
        OoRumReactNativeNavigationTracking.isTracking = false;
        OoRumReactNativeNavigationTracking.viewNamePredicate = defaultViewNamePredicate;
        OoRumReactNativeNavigationTracking.viewTrackingPredicate = defaultViewTrackingPredicate;
        OoRumReactNativeNavigationTracking.paramsTrackingPredicate = defaultParamsPredicate;

        // eslint-disable-next-line func-names
        OoRumReactNativeNavigationTracking.viewNamePredicate = function (
            _event: ComponentDidAppearEvent,
            trackedName: string
        ) {
            return trackedName;
        };
    }

    private static appStateListener: AppStateListener = (
        appStateStatus: AppStateStatus
    ) => {
        const lastView = OoRumReactNativeNavigationTracking.lastView;
        if (lastView === undefined) {
            InternalLog.log(
                `We could not determine the route when changing the application state to: ${appStateStatus}. No RUM View event will be sent in this case.`,
                SdkVerbosity.ERROR
            );
            return;
        }

        if (lastView === 'tracking_not_started') {
            // Do nothing as no view has been tracked already
            return;
        }

        if (appStateStatus === 'background') {
            OoRum.stopView(lastView.key);
        } else if (
            appStateStatus === 'active' ||
            appStateStatus === undefined
        ) {
            // case when app goes into foreground,
            // in that case navigation listener won't be called
            OoRum.startView(lastView.key, lastView.name);
        }
    };
}
