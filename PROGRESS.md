# JOY implementation status

## Implemented

- Expo Router app with home, chat and settings screens, TypeScript strict checks, and a dark visual system.
- Local deterministic intent routing for weather, reminders, maps, contacts and prepared SMS. External actions are routed through iOS APIs and do not happen silently.
- Open-Meteo current and next-day forecasts for Palermo, Milano, Roma, Napoli, Torino and Catania.
- Optional llama.cpp runtime via `llama.rn`, Qwen3 GGUF manifest, resumable download controls, SHA-256 verification, disk/RAM checks, and Metal-to-CPU initialization fallback.
- iOS native module for on-device speech recognition, speech synthesis, reminder creation, contacts lookup, model checksum, preferences and memory reporting.
- Local conversation and opt-in memory repository using SQLite when available, with an in-memory fallback.
- Settings to manage model, voice replies, personal memory and conversation deletion.
- GitLab CI: Linux validation and a manual macOS `macos-xcode` job that archives and packages an unsigned IPA.

## Verification in this workspace

- TypeScript check, unit tests and Expo public configuration can run locally.
- Native iOS build, speech recognition, EventKit/Contacts permission flows, llama.cpp model loading, Metal acceleration and physical-device performance still require the macOS runner and an iPhone.
- Registry access was unavailable during implementation, so dependency installation and `npm ci` could not be verified locally.
- The IPA job requires a self-managed macOS GitLab Runner tagged `macos-xcode`, with Xcode, CocoaPods, Node.js, npm and network access to package sources.

## Delivery constraints

The IPA pipeline does not sign, publish or deploy. Device installation requires Apple signing and provisioning. The messaging integration only opens a prefilled system composer; the user reviews and sends the message.
