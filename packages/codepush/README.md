# React-Native Monitoring for AppCenter CodePush

## Setup

This package is an integration for the [`react-native-code-push`][1] library. Before using it, install and setup the core [`mobile-react-native`][2] SDK.

To install with NPM, run:

```sh
npm install @openobserve/mobile-react-native-code-push
```

To install with Yarn, run:

```sh
yarn add @openobserve/mobile-react-native-code-push
```

## Initialize the SDK

To initialize the OpenObserve React Native SDK for RUM, use `OpenObserveCodepush.initialize` instead of `OoSdkReactNative.initialize`:

```js
import { OoSdkReactNativeConfiguration } from '@openobserve/mobile-react-native';
import { OpenObserveCodepush } from '@openobserve/mobile-react-native-code-push';

const config = new OoSdkReactNativeConfiguration(
    '<CLIENT_TOKEN>',
    '<ENVIRONMENT_NAME>',
    '<RUM_APPLICATION_ID>',
    true, // track user interactions (such as a tap on buttons). You can use the 'accessibilityLabel' element property to give the tap action a name, otherwise the element type is reported
    true, // track XHR resources
    true // track errors
);

await OpenObserveCodepush.initialize(config);
```

This method sets your reported version to the same value your source map upload tooling records for the CodePush bundle.

## Alternative to `@openobserve/mobile-react-native-code-push`

If your tooling uploads the CodePush bundle and source maps with a different format for the version, you can override the reported version in the SDK configuration object by using either:

-   `versionSuffix` (recommended) to add a suffix to the commercial version of your app
-   `version` to completely override the version

[1]: https://github.com/microsoft/react-native-code-push
[2]: https://github.com/openobserve/openobserve-react-native-rum/tree/main/packages/core
