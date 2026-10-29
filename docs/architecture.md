# JOY architecture

JOY uses Expo Router for navigation and a strict TypeScript React Native client. UI features depend on domain interfaces; native capabilities are adapters behind providers. The microphone captures speech only after an explicit tap and iOS permission. Model inference is local through llama.cpp; weather retrieval is the only assistant path that contacts a network service.

## Planned boundaries

- `core/ai`: `LLMProvider` and local runtime adapter.
- `core/orchestration`: turn lifecycle, intent result and bounded tool planning.
- `core/tools`: schema-validated, permission-aware registered tools.
- `infrastructure`: SQLite repositories, network clients, model files.
- `modules`: Expo Modules for iOS Speech, AVFoundation and integrations.

Local inference is the default. Model/provider swaps must not change feature or UI code. Treat model output and remote content as untrusted data and require schema validation before tool dispatch.

## Current executable behavior

The assistant first routes supported action intents deterministically. General chat uses the installed local GGUF model when it has been loaded; otherwise it reports that generative chat is offline. Weather intents call Open-Meteo for a small explicit city-coordinate map. Reminder and contacts access use EventKit and Contacts; maps open a native map URL; SMS is prepared in the system composer and requires the user to send. Conversation and opt-in memory storage use SQLite when available and an in-memory fallback otherwise.

## Platform boundary

Ubuntu can run Metro, TypeScript checks and Android builds when Android SDK tooling is installed. Apple's SDK, Xcode compilation, simulator, signing and physical iPhone validation require macOS/Xcode and appropriate Apple provisioning. Expo Go is not sufficient for custom native modules; use an Expo development build.
