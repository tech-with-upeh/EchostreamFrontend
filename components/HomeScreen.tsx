import { useAppTheme } from '@/hooks/use-theme-color';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

const GamerTTSMascot: React.FC = () => {
  const { theme, isDark } = useAppTheme();

  const haloRotate = useRef(new Animated.Value(0)).current;

  const bar1 = useRef(new Animated.Value(6)).current;
  const bar2 = useRef(new Animated.Value(14)).current;
  const bar3 = useRef(new Animated.Value(18)).current;
  const bar4 = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(haloRotate, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const animateBar = (animVal: Animated.Value, minHeight: number, maxHeight: number, speed: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animVal, {
            toValue: maxHeight,
            duration: speed,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(animVal, {
            toValue: minHeight,
            duration: speed * 0.9,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      animateBar(bar1, 4, 16, 220),
      animateBar(bar2, 8, 26, 170),
      animateBar(bar3, 6, 22, 290),
      animateBar(bar4, 4, 18, 200),
    ]).start();
  }, []);

  const haloSpinDeg = haloRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Svg width={260} height={260} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={theme.primary} stopOpacity={isDark ? 0.7 : 0.4} />
          <Stop offset="100%" stopColor={theme.primary} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={theme.primary} stopOpacity={1} />
          <Stop offset="100%" stopColor={theme.primaryDim} stopOpacity={0.8} />
        </RadialGradient>
      </Defs>

      {/* --- BACK GLOW & ROTATING CYBER HALO --- */}
      <Circle cx="100" cy="100" r="85" fill="url(#cyanGlow)" />

      <AnimatedG origin="100, 100" rotation={haloSpinDeg}>
        <Circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke={theme.primary}
          strokeWidth="1.5"
          strokeDasharray="12, 16, 4, 16"
          opacity={0.6}
        />
        <Circle cx="100" cy="22" r="3" fill={theme.primary} />
        <Circle cx="100" cy="178" r="3" fill={theme.primary} />
      </AnimatedG>

      {/* --- GAMER HEADSET --- */}
      <Path
        d="M 28 90 A 74 74 0 0 1 172 90"
        stroke={theme.robotBorder}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M 28 90 A 74 74 0 0 1 172 90"
        stroke={theme.primary}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />

      {/* --- MAIN ROBOT HEAD --- */}
      <Rect
        x="36"
        y="50"
        width="128"
        height="88"
        rx="36"
        fill={theme.robotShell}
        stroke={theme.robotBorder}
        strokeWidth="2"
      />

      <Rect
        x="46"
        y="60"
        width="108"
        height="68"
        rx="24"
        fill={theme.robotVisor}
        stroke={theme.primary}
        strokeWidth="1.5"
      />

      {/* --- STATIC EYES --- */}
      <G>
        <Circle cx="72" cy="84" r="8" fill="url(#eyeGlow)" />
        <Circle cx="74" cy="82" r="2.5" fill="#FFFFFF" />
      </G>

      <G>
        <Circle cx="128" cy="84" r="8" fill="url(#eyeGlow)" />
        <Circle cx="130" cy="82" r="2.5" fill="#FFFFFF" />
      </G>

      {/* --- TTS AUDIO WAVEFORM MOUTH --- */}
      <G>
        <AnimatedRect
          x="84"
          y={Animated.subtract(106, Animated.divide(bar1, 2))}
          width="4"
          height={bar1}
          rx="2"
          fill={theme.primary}
        />
        <AnimatedRect
          x="94"
          y={Animated.subtract(106, Animated.divide(bar2, 2))}
          width="4"
          height={bar2}
          rx="2"
          fill={theme.primary}
        />
        <AnimatedRect
          x="104"
          y={Animated.subtract(106, Animated.divide(bar3, 2))}
          width="4"
          height={bar3}
          rx="2"
          fill={theme.primary}
        />
        <AnimatedRect
          x="114"
          y={Animated.subtract(106, Animated.divide(bar4, 2))}
          width="4"
          height={bar4}
          rx="2"
          fill={theme.primary}
        />
      </G>

      {/* --- GAMER EAR CUPS --- */}
      <Rect
        x="18"
        y="70"
        width="20"
        height="48"
        rx="10"
        fill={theme.robotShell}
        stroke={theme.primary}
        strokeWidth="2"
      />
      <Rect x="23" y="80" width="10" height="28" rx="5" fill={theme.primary} opacity={0.8} />

      <Rect
        x="162"
        y="70"
        width="20"
        height="48"
        rx="10"
        fill={theme.robotShell}
        stroke={theme.primary}
        strokeWidth="2"
      />
      <Rect x="167" y="80" width="10" height="28" rx="5" fill={theme.primary} opacity={0.8} />

      {/* --- BOOM MIC --- */}
      <Circle cx="72" cy="148" r="6" fill={theme.primary} />
      <Circle cx="72" cy="148" r="9" stroke={theme.primary} strokeWidth="1.5" fill="none" opacity={0.6} />

      {/* --- TORSO --- */}
      <Path
        d="M 64 142 C 64 135, 136 135, 136 142 L 146 185 C 146 195, 54 195, 54 185 Z"
        fill={theme.robotShell}
        stroke={theme.robotBorder}
        strokeWidth="1.5"
      />
      <Path d="M 85 152 L 115 152" stroke={theme.primary} strokeWidth="3" strokeLinecap="round" />
    </Svg>
  );
};

export default function HomeScreen() {
  const { theme, isDark } = useAppTheme();
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -14,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Dynamic Background Gradient */}
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={theme.bgGradient}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[theme.topGlow, 'transparent']}
          style={styles.topAmbientGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={[theme.bottomGlow, 'transparent']}
          style={styles.bottomAmbientGlow}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />
      </View>

      <View style={styles.mainContent}>
        {/* Centered Graphic + Copy */}
        <View style={styles.centerSection}>
          <Animated.View
            style={[
              styles.illustrationContainer,
              { transform: [{ translateY: floatAnim }] },
            ]}
          >
            <GamerTTSMascot />
          </Animated.View>

          <View style={styles.textContainer}>
            <Text style={[styles.tagline, { color: theme.primary }]}>
             • EchoStream AI •
            </Text>

            <Text style={[styles.heading, { color: theme.onSurface }]}>
              How you doing today!
            </Text>

            <Text style={[styles.body, { color: theme.onSurfaceVariant }]}>
              Empowering you with intelligent, real-time voice assistance. Turning
              complexity into simplicity instantly.
            </Text>
          </View>
        </View>

        {/* Bottom Pinned CTA */}
        {/* Bottom Pinned CTA */}
<View style={styles.bottomSection}>
  <Link href="/login" style={{ width: '100%' }} asChild>
  <TouchableOpacity activeOpacity={0.85} style={styles.buttonWrapper}>
    <View style={[styles.button, { backgroundColor: theme.primary }]}>
      <Text style={[styles.buttonText, { color: theme.buttonText }]}>
        Start Generating
      </Text>
    </View>
  </TouchableOpacity>
  </Link>
</View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topAmbientGlow: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    width: width * 1.2,
    height: height * 0.45,
    borderRadius: width,
  },
  bottomAmbientGlow: {
    position: 'absolute',
    bottom: -60,
    alignSelf: 'center',
    width: width * 1.2,
    height: height * 0.35,
    borderRadius: width,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  illustrationContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    maxWidth: 340,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.6,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
    textAlign: 'center',
    opacity: 0.9,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 9999,
    shadowColor: '#00EEFC',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});