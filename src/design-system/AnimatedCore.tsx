import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, LinearGradient, RadialGradient, Stop } from 'react-native-svg';
import type { CoreState } from '@/design-system/tokens';

type Props = { state?: CoreState; size?: number };

/** Minimal glass energy sphere with slow, restrained orbital motion. */
export function AnimatedCore({ state = 'idle', size = 300 }: Props) {
  const orbit = useSharedValue(0);
  const counterOrbit = useSharedValue(0);
  const breath = useSharedValue(0);
  const active = state === 'listening' || state === 'thinking' || state === 'transcribing' || state === 'executing';
  const tempo = state === 'thinking' || state === 'transcribing' ? 0.72 : 1;

  useEffect(() => {
    orbit.value = withRepeat(withTiming(360, { duration: 36000 * tempo, easing: Easing.linear }), -1, false);
    counterOrbit.value = withRepeat(withTiming(-360, { duration: 49000 * tempo, easing: Easing.linear }), -1, false);
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: (active ? 1300 : 3200) * tempo, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: (active ? 1300 : 3200) * tempo, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [active, breath, counterOrbit, orbit, tempo]);

  const auraStyle = useAnimatedStyle(() => ({
    opacity: interpolate(breath.value, [0, 1], [0.28, active ? 0.62 : 0.48], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(breath.value, [0, 1], [0.92, 1.08], Extrapolation.CLAMP) }],
  }));
  const sphereStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breath.value, [0, 1], [0.99, 1.018], Extrapolation.CLAMP) }],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1000 }, { rotateX: '68deg' }, { rotateZ: `${orbit.value}deg` }],
  }));
  const counterOrbitStyle = useAnimatedStyle(() => ({
    opacity: 0.72,
    transform: [{ perspective: 1000 }, { rotateY: '64deg' }, { rotateZ: `${counterOrbit.value}deg` }],
  }));

  return (
    <View style={[styles.root, { width: size, height: size }]}>
      <Animated.View style={[styles.layer, auraStyle]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 300 300">
          <Defs>
            <RadialGradient id="coreAura" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#72D9FF" stopOpacity="0.4" />
              <Stop offset="45%" stopColor="#768AFF" stopOpacity="0.17" />
              <Stop offset="100%" stopColor="#070A12" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="150" cy="150" r="116" fill="url(#coreAura)" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.layer, orbitStyle]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 300 300">
          <Defs>
            <LinearGradient id="orbitLight" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#B9F2FF" stopOpacity="0" />
              <Stop offset="38%" stopColor="#9CEBFF" stopOpacity="0.16" />
              <Stop offset="51%" stopColor="#E9FCFF" stopOpacity="0.88" />
              <Stop offset="59%" stopColor="#77CFFF" stopOpacity="0.56" />
              <Stop offset="100%" stopColor="#B9F2FF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Ellipse cx="150" cy="150" rx="124" ry="42" fill="none" stroke="url(#orbitLight)" strokeWidth="1.2" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.layer, counterOrbitStyle]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 300 300">
          <Defs>
            <LinearGradient id="orbitBlue" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#829AFF" stopOpacity="0" />
              <Stop offset="43%" stopColor="#A8B8FF" stopOpacity="0.14" />
              <Stop offset="54%" stopColor="#E9EDFF" stopOpacity="0.72" />
              <Stop offset="100%" stopColor="#829AFF" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Ellipse cx="150" cy="150" rx="108" ry="56" fill="none" stroke="url(#orbitBlue)" strokeWidth="0.9" />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.layer, sphereStyle]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 300 300">
          <Defs>
            <RadialGradient id="glassBody" cx="34%" cy="25%" rx="78%" ry="78%">
              <Stop offset="0%" stopColor="#29465E" />
              <Stop offset="42%" stopColor="#142535" />
              <Stop offset="100%" stopColor="#090F19" />
            </RadialGradient>
            <RadialGradient id="innerGlow" cx="36%" cy="28%" rx="70%" ry="70%">
              <Stop offset="0%" stopColor="#F2FEFF" stopOpacity="0.98" />
              <Stop offset="12%" stopColor="#A9EEFF" stopOpacity="0.94" />
              <Stop offset="42%" stopColor="#69A8FF" stopOpacity="0.58" />
              <Stop offset="100%" stopColor="#4758B4" stopOpacity="0.1" />
            </RadialGradient>
            <LinearGradient id="glassEdge" x1="8%" y1="2%" x2="92%" y2="100%">
              <Stop offset="0%" stopColor="#F1FDFF" stopOpacity="0.86" />
              <Stop offset="32%" stopColor="#A5E9FF" stopOpacity="0.48" />
              <Stop offset="68%" stopColor="#8897FF" stopOpacity="0.34" />
              <Stop offset="100%" stopColor="#E4FAFF" stopOpacity="0.72" />
            </LinearGradient>
          </Defs>

          <Ellipse cx="150" cy="229" rx="59" ry="11" fill="#000814" opacity="0.62" />
          <Circle cx="150" cy="145" r="64" fill="#142B43" opacity="0.5" />
          <Circle cx="150" cy="145" r="59" fill="url(#glassBody)" stroke="url(#glassEdge)" strokeWidth="2" />
          <Circle cx="150" cy="145" r="50" fill="none" stroke="#D9F7FF" strokeOpacity="0.2" strokeWidth="0.8" />
          <Ellipse cx="150" cy="145" rx="49" ry="18" fill="none" stroke="#DDF8FF" strokeOpacity="0.18" strokeWidth="0.8" transform="rotate(-24 150 145)" />
          <Ellipse cx="130" cy="118" rx="18" ry="6" fill="#F0FDFF" opacity="0.13" transform="rotate(-38 130 118)" />

          <Circle cx="150" cy="145" r="35" fill="url(#innerGlow)" opacity="0.96" />
          <Circle cx="150" cy="145" r="27" fill="none" stroke="#E7FCFF" strokeOpacity="0.38" strokeWidth="0.8" />
          <Ellipse cx="150" cy="145" rx="30" ry="9" fill="none" stroke="#D7F8FF" strokeOpacity="0.5" strokeWidth="0.8" />
          <Circle cx="139" cy="133" r="4.5" fill="#FFFFFF" opacity="0.68" />
          <Circle cx="150" cy="145" r="3.5" fill="#FFFFFF" opacity="0.96" />

          <Circle cx="51" cy="103" r="1.4" fill="#C2F2FF" opacity="0.78" />
          <Circle cx="241" cy="94" r="1.1" fill="#B4C5FF" opacity="0.76" />
          <Circle cx="244" cy="197" r="1.3" fill="#E4FAFF" opacity="0.65" />
          <Circle cx="68" cy="210" r="1" fill="#A9BAFF" opacity="0.7" />
          <Circle cx="191" cy="54" r="0.9" fill="#E0FAFF" opacity="0.72" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
  layer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});

