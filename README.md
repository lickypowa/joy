# JOY

JOY is an Expo / React Native assistant for iOS. It combines deterministic local intent routing with an optional on-device llama.cpp model, Italian speech input/output, local conversation and memory storage, and native iOS actions. Weather queries use Open-Meteo; map directions open in Apple Maps or Google Maps; reminders and contacts use iOS frameworks; messages open the system composer for review.

## Local development (Ubuntu)

```sh
npm ci
npm run typecheck
npm start:go   # UI preview only in Expo Go
```

JOY's speech module, llama.cpp and other custom native modules require a development build. Install `expo-dev-client`, build the iOS app on macOS with `npx expo run:ios` (or a signed GitLab macOS job), then start Metro with `npm start` and open the project from the development client. Expo Go is only for previewing the UI; it cannot record speech through JOY's custom native module.

Android builds require Android Studio command-line tools and an installed SDK. iOS simulator/device builds require Apple's Xcode toolchain on macOS.

## GitLab iOS artifact pipeline

`.gitlab-ci.yml` runs dependency/type/config checks on a Linux runner. Its manual `ios_unsigned_ipa` job expects a self-managed macOS GitLab Runner tagged `macos-xcode`, with Xcode, command-line tools, CocoaPods, Node.js and npm available. GitLab does not provide macOS shared runners. The job reproduces the project's existing unsigned Xcode archive-to-IPA workflow and stores the IPA as a 14-day pipeline artifact.

The IPA is unsigned. It is useful as a build artifact but cannot be installed directly on an iPhone. Device installation or distribution requires signing and a provisioning profile, and App Store/TestFlight distribution requires the relevant Apple account setup. The pipeline does not submit, publish, or deploy the app.

## Native build and validation

Run `npm ci` before starting Metro or generating native projects. For the interface preview, start `npx expo start --go` and scan the QR with Expo Go for SDK 58. The local voice module and llama.rn require an Expo development build; Expo Go does not include those native modules. The app defers loading llama.rn so the interface can still open in Expo Go. The model is downloaded only when requested in Settings, stored in the app sandbox and checked against its SHA-256 before use. Memory is opt-in. Messages are prepared in the iOS composer and are never sent automatically.

SDK 58 requires Node.js 22.13+ or 24.3+ and the macOS native build requires Xcode 26.4+. The native module, llama.cpp/Metal path, on-device speech availability and model memory use have not yet been validated on an iPhone. The Linux checks cover TypeScript, unit tests and Expo configuration. Push the project to GitLab with this `.gitlab-ci.yml`; the validate stage runs on a Linux runner and the default branch exposes the manual `ios_unsigned_ipa` job. Run that job to compile the unsigned IPA; device installation requires signing and provisioning.
# joy
