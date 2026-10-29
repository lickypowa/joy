import { useEffect, useMemo, useRef, type ComponentType, type RefObject } from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import type { CoreState } from '@/design-system/tokens';
import { toJoyEngineState } from '@/design-system/joyCoreBridge';

type Props = {
  state?: CoreState;
  audioLevel?: number;
  size?: number;
  style?: ViewStyle;
};

type CoreBridge = {
  injectJavaScript: (script: string) => void;
};

type WebViewProps = {
  ref?: RefObject<CoreBridge | null>;
  source: { uri: string };
  style?: object;
  originWhitelist?: string[];
  allowFileAccess?: boolean;
  javaScriptEnabled?: boolean;
  domStorageEnabled?: boolean;
  onLoadEnd?: () => void;
};

/**
 * Native bridge: embeds the joy-core web build in a WebView.
 * In __DEV__ it points at the Vite lab server. For production, set
 * EXPO_PUBLIC_JOY_CORE_URL to a hosted build of joy-core/dist.
 */
export function JoyCoreView({ state = 'idle', audioLevel = 0, size = 300, style }: Props) {
  const webRef = useRef<CoreBridge | null>(null);

  const uri = useMemo(() => {
    const configured = process.env.EXPO_PUBLIC_JOY_CORE_URL;
    if (configured) return configured;
    if (__DEV__) {
      return Platform.OS === 'android' ? 'http://10.0.2.2:5173' : 'http://127.0.0.1:5173';
    }
    return null;
  }, []);

  useEffect(() => {
    const engineState = toJoyEngineState(state);
    webRef.current?.injectJavaScript(`
      window.__JOY_CORE__?.setState(${JSON.stringify(engineState)});
      true;
    `);
  }, [state]);

  useEffect(() => {
    webRef.current?.injectJavaScript(`
      window.__JOY_CORE__?.setAudioLevel(${Number(audioLevel) || 0});
      true;
    `);
  }, [audioLevel]);

  if (!uri) {
    return <View style={[styles.host, { width: size, height: size }, style, styles.fallback]} />;
  }

  const Web = WebView as unknown as ComponentType<WebViewProps>;

  return (
    <View style={[styles.host, { width: size, height: size }, style]}>
      <Web
        ref={webRef}
        source={{ uri }}
        style={styles.webview}
        originWhitelist={['*']}
        allowFileAccess
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={() => {
          const engineState = toJoyEngineState(state);
          webRef.current?.injectJavaScript(`
            window.__JOY_CORE__?.setState(${JSON.stringify(engineState)});
            window.__JOY_CORE__?.setAudioLevel(${Number(audioLevel) || 0});
            true;
          `);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    overflow: 'hidden',
    backgroundColor: '#030406',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fallback: {
    borderWidth: 1,
    borderColor: 'rgba(225,6,0,0.25)',
  },
});
