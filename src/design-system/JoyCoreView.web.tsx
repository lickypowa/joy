import { createElement, useEffect, useRef } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { JoyCore } from '../../joy-core/src/core/JoyCore';
import type { CoreState } from '@/design-system/tokens';
import { toJoyEngineState } from '@/design-system/joyCoreBridge';

type Props = {
  state?: CoreState;
  audioLevel?: number;
  size?: number;
  style?: ViewStyle;
};

/**
 * Web bridge: mounts the standalone Three.js JoyCore engine on a canvas.
 */
export function JoyCoreView({ state = 'idle', audioLevel = 0, size = 300, style }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const coreRef = useRef<JoyCore | null>(null);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    node.appendChild(canvas);

    const core = new JoyCore({ canvas, initialState: toJoyEngineState(state) });
    core.setAudioLevel(audioLevel);
    core.start();
    coreRef.current = core;

    const ro = new ResizeObserver(() => core.resize());
    ro.observe(node);

    return () => {
      ro.disconnect();
      core.dispose();
      coreRef.current = null;
      if (canvas.parentNode === node) node.removeChild(canvas);
    };
    // Mount once; state/audio sync via effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    coreRef.current?.setState(toJoyEngineState(state));
  }, [state]);

  useEffect(() => {
    coreRef.current?.setAudioLevel(audioLevel);
  }, [audioLevel]);

  return (
    <View style={[styles.host, { width: size, height: size }, style]}>
      {createElement('div', {
        ref: hostRef,
        style: { width: '100%', height: '100%' },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
});
