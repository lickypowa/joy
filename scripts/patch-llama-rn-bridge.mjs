import { readFileSync, writeFileSync } from 'node:fs';

const packagePath = 'node_modules/llama.rn/package.json';
const sourcePath = 'node_modules/llama.rn/ios/RNLlama.mm';
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
let source = readFileSync(sourcePath, 'utf8');

if (source.includes('RNLlamaRuntimeProvider')) {
  process.exit(0);
}

if (packageJson.version !== '0.12.9') {
  throw new Error(
    `JOY's llama.rn compatibility patch expects 0.12.9, found ${packageJson.version}. Review/remove this patch after upgrading llama.rn.`,
  );
}

const importAnchor = '#import <TargetConditionals.h>\n';
if (!source.includes(importAnchor)) {
  throw new Error('Could not find the expected llama.rn iOS import anchor.');
}

source = source.replace(
  importAnchor,
  `${importAnchor}\n#import <React/RCTLog.h>\n\n@protocol RNLlamaRuntimeProvider <NSObject>\n- (void *)runtime;\n@end\n`,
);

const oldBridgeAccess = `    RCTCxxBridge *cxxBridge = (RCTCxxBridge *)bridge.batchedBridge;
    if (!cxxBridge) {
        cxxBridge = (RCTCxxBridge *)bridge;
    }
    auto callInvoker = cxxBridge.jsCallInvoker ?: bridge.jsCallInvoker;
    if (!cxxBridge.runtime) {
        resolve(@false);
        return;
    }

    facebook::jsi::Runtime *runtime = static_cast<facebook::jsi::Runtime *>(cxxBridge.runtime);

    if (callInvoker) {
        callInvoker->invokeAsync([runtime, callInvoker]() {
            rnllama_jsi::installJSIBindings(*runtime, callInvoker);
        });
    } else {
        resolve(@false);
        return;
    }

    resolve(@true);`;

const newBridgeAccess = `    // RCTCxxBridge was removed in React Native 0.87. In bridgeless mode,
    // the bridge proxy exposes the JSI runtime through a runtime selector.
    facebook::jsi::Runtime *jsiRuntime = nullptr;
    @try {
        id<RNLlamaRuntimeProvider> provider = (id<RNLlamaRuntimeProvider>)bridge;
        jsiRuntime = (facebook::jsi::Runtime *)[provider runtime];
    } @catch (NSException *exception) {
        RCTLogError(@"[llama.rn] Could not obtain the JSI runtime: %@", exception);
        resolve(@false);
        return;
    }

    auto callInvoker = bridge.jsCallInvoker;
    if (jsiRuntime == nullptr || !callInvoker) {
        resolve(@false);
        return;
    }

    facebook::jsi::Runtime *runtime = jsiRuntime;
    callInvoker->invokeAsync([runtime, callInvoker]() {
        rnllama_jsi::installJSIBindings(*runtime, callInvoker);
    });

    resolve(@true);`;

if (!source.includes(oldBridgeAccess)) {
  throw new Error('Could not find the expected llama.rn bridge implementation.');
}

source = source.replace(oldBridgeAccess, newBridgeAccess);
writeFileSync(sourcePath, source);
