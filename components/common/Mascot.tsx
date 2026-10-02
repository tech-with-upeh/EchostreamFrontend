import { useAppTheme } from "@/hooks/use-theme-color";
import React, { useEffect, useRef } from "react";
import { Easing, Animated as RNAnimated } from "react-native";
import Svg, {
    Circle,
    Defs,
    G,
    Path,
    RadialGradient,
    Rect,
    Stop,
} from "react-native-svg";

const AnimatedG = RNAnimated.createAnimatedComponent(G);
const AnimatedRect = RNAnimated.createAnimatedComponent(Rect);

export default function GamerTTSMascot({
  height,
  width,
}: {
  height: number;
  width: number;
}) {
  const { theme, isDark } = useAppTheme();

  const haloRotate = useRef(new RNAnimated.Value(0)).current;

  const bar1 = useRef(new RNAnimated.Value(6)).current;
  const bar2 = useRef(new RNAnimated.Value(14)).current;
  const bar3 = useRef(new RNAnimated.Value(18)).current;
  const bar4 = useRef(new RNAnimated.Value(8)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.timing(haloRotate, {
        toValue: 1,
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    const animateBar = (
      animVal: RNAnimated.Value,
      minHeight: number,
      maxHeight: number,
      speed: number,
    ) => {
      return RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(animVal, {
            toValue: maxHeight,
            duration: speed,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          RNAnimated.timing(animVal, {
            toValue: minHeight,
            duration: speed * 0.9,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
    };

    RNAnimated.parallel([
      animateBar(bar1, 4, 16, 220),
      animateBar(bar2, 8, 26, 170),
      animateBar(bar3, 6, 22, 290),
      animateBar(bar4, 4, 18, 200),
    ]).start();
  }, []);

  const haloSpinDeg = haloRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Svg width={width} height={height} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id="cyanGlow" cx="50%" cy="50%" r="50%">
          <Stop
            offset="0%"
            stopColor={theme.primary}
            stopOpacity={isDark ? 0.7 : 0.4}
          />
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
          y={RNAnimated.subtract(106, RNAnimated.divide(bar1, 2))}
          width="4"
          height={bar1}
          rx="2"
          fill={theme.primary}
        />
        <AnimatedRect
          x="94"
          y={RNAnimated.subtract(106, RNAnimated.divide(bar2, 2))}
          width="4"
          height={bar2}
          rx="2"
          fill={theme.primary}
        />
        <AnimatedRect
          x="104"
          y={RNAnimated.subtract(106, RNAnimated.divide(bar3, 2))}
          width="4"
          height={bar3}
          rx="2"
          fill={theme.primary}
        />
        <AnimatedRect
          x="114"
          y={RNAnimated.subtract(106, RNAnimated.divide(bar4, 2))}
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
      <Rect
        x="23"
        y="80"
        width="10"
        height="28"
        rx="5"
        fill={theme.primary}
        opacity={0.8}
      />

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
      <Rect
        x="167"
        y="80"
        width="10"
        height="28"
        rx="5"
        fill={theme.primary}
        opacity={0.8}
      />

      {/* --- BOOM MIC --- */}
      <Circle cx="72" cy="148" r="6" fill={theme.primary} />
      <Circle
        cx="72"
        cy="148"
        r="9"
        stroke={theme.primary}
        strokeWidth="1.5"
        fill="none"
        opacity={0.6}
      />

      {/* --- TORSO --- */}
      <Path
        d="M 64 142 C 64 135, 136 135, 136 142 L 146 185 C 146 195, 54 195, 54 185 Z"
        fill={theme.robotShell}
        stroke={theme.robotBorder}
        strokeWidth="1.5"
      />
      <Path
        d="M 85 152 L 115 152"
        stroke={theme.primary}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
  );
}
