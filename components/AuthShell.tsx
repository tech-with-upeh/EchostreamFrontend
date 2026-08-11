import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { ReactNode } from 'react';
import {
    Keyboard,
    Pressable,
    StatusBar,
    StyleSheet,
    View,
    useWindowDimensions,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInUp,
} from 'react-native-reanimated';
import {
    SafeAreaView,
    useSafeAreaInsets,
} from 'react-native-safe-area-context';

interface AuthShellProps {
  /** Show a circular back button floating over the gradient, top-left. */
  showBack?: boolean;

  /** Called when the back button is pressed. */
  onBack?: () => void;

  /**
   * Content rendered above the auth surface,
   * on top of the gradient background.
   */
  aboveSheet?: ReactNode;

  /**
   * Content rendered inside the auth surface.
   */
  children: ReactNode;
}

/**
 * Shared background + responsive auth chrome.
 *
 * PHONE
 * ─────────────────────────────────────────
 * Auth content behaves like a bottom sheet:
 * - Full width
 * - Rounded top corners
 * - Anchored to the bottom
 *
 * TABLET / IPAD
 * ─────────────────────────────────────────
 * Auth content becomes a centered card:
 * - Constrained width
 * - Rounded on all sides
 * - Centered vertically
 * - Gradient remains visible around it
 *
 * DESKTOP
 * ─────────────────────────────────────────
 * Same centered-card behavior with a slightly
 * larger maximum width.
 */
export default function AuthShell({
  showBack = false,
  onBack,
  aboveSheet,
  children,
}: AuthShellProps) {
  const { theme, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();

  /*
   * useWindowDimensions instead of Dimensions.get()
   * so the layout updates automatically when:
   *
   * - iPad rotates
   * - Android changes window size
   * - split-screen is used
   * - desktop window is resized
   */
  const { width, height } = useWindowDimensions();

  /*
   * Breakpoint
   *
   * Phones:
   *   < 600
   *
   * Tablets:
   *   >= 600
   */
  const isTablet = width >= 600;

  /*
   * Landscape is useful because an iPad landscape
   * screen has considerably more horizontal space.
   */
  const isLandscape = width > height;

  /*
   * Determine maximum auth-panel width.
   *
   * iPad portrait:
   *   max ~520
   *
   * iPad landscape:
   *   max ~560
   *
   * Larger screens:
   *   still capped so the form doesn't become huge.
   */
  const panelWidth = isTablet
    ? Math.min(
        width - 64,
        isLandscape ? 560 : 520
      )
    : width;

  /*
   * On very short landscape screens, center the
   * panel but allow the content to scroll naturally
   * through the screen's own ScrollView if needed.
   */
  const tabletVerticalPadding = isLandscape ? 20 : 32;

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={
          isDark
            ? 'light-content'
            : 'dark-content'
        }
      />

      {/* =========================================================
          BACKGROUND
          ========================================================= */}

      <Pressable
        style={StyleSheet.absoluteFillObject}
        onPress={Keyboard.dismiss}
      >
        <View
          style={StyleSheet.absoluteFillObject}
        >
          {/* Main gradient */}
          <LinearGradient
            colors={theme.bgGradient}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top atmospheric glow */}
          <LinearGradient
            colors={[
              theme.topGlow,
              'transparent',
            ]}
            style={[
              styles.topAmbientGlow,
              {
                width: width * 1.2,
                height: height * 0.85,
              },
            ]}
            start={{
              x: 0.5,
              y: 0,
            }}
            end={{
              x: 0.5,
              y: 1,
            }}
          />

          {/* Bottom atmospheric glow */}
          <LinearGradient
            colors={[
              theme.bottomGlow,
              'transparent',
            ]}
            style={[
              styles.bottomAmbientGlow,
              {
                width: width * 1.2,
                height: height * 0.35,
              },
            ]}
            start={{
              x: 0.5,
              y: 1,
            }}
            end={{
              x: 0.5,
              y: 0,
            }}
          />
        </View>

        {/* =======================================================
            BACK BUTTON
            ======================================================= */}

        {showBack && (
          <Animated.View
            entering={FadeIn.duration(350)}
            style={[
              styles.backButtonRow,
              {
                top:
                  (StatusBar.currentHeight ?? 0) +
                  20,
              },
            ]}
          >
            <Pressable
              onPress={onBack}
              hitSlop={12}
              style={[
                styles.backButton,
                {
                  backgroundColor:
                    theme.surfaceVariant,
                },
              ]}
            >
              <Ionicons
                name="arrow-back"
                size={20}
                color={theme.onSurface}
              />
            </Pressable>
          </Animated.View>
        )}

        {/* =======================================================
            MAIN LAYOUT
            ======================================================= */}

        <View
          style={[
            styles.mainWrapper,

            isTablet
              ? styles.mainWrapperTablet
              : styles.mainWrapperPhone,
          ]}
        >
          {/* =====================================================
              HERO / HEADER
              ===================================================== */}

          <View
            style={[
              styles.aboveSheetWrapper,

              isTablet &&
                styles.aboveSheetWrapperTablet,

              isTablet && {
                width: panelWidth,
              },
            ]}
          >
            {aboveSheet}
          </View>

          {/* =====================================================
              AUTH SURFACE
              ===================================================== */}

          <Animated.View
            entering={FadeInUp
              .duration(700)
              .delay(80)
              .springify()
              .damping(18)}
            style={[
             
              /*
               * PHONE
               * Full-width bottom sheet.
               */
              !isTablet &&
                styles.mainContentPhone,

              /*
               * TABLET
               * Centered constrained panel.
               */
              isTablet &&
                styles.mainContentTablet,

              {
                width: isTablet
                  ? panelWidth
                  : '100%',

                backgroundColor:
                  theme.surface,

                /*
                 * Phone needs the home-indicator
                 * inset because the surface reaches
                 * the physical bottom.
                 *
                 * Tablet also gets the inset so
                 * content remains comfortable.
                 */
                paddingBottom:
                  insets.bottom + 20,
              },

              isTablet &&
                !isLandscape && {
                  paddingTop: 30,
                },

              isTablet &&
                isLandscape && {
                  paddingTop: tabletVerticalPadding,
                  paddingBottom:
                    Math.max(
                      insets.bottom + 20,
                      tabletVerticalPadding
                    ),
                },
            ]}
          >
            {children}
          </Animated.View>
        </View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /* =============================================================
     ROOT
     ============================================================= */

  container: {
    flex: 1,
  },

  /* =============================================================
     BACKGROUND GLOWS
     ============================================================= */

  topAmbientGlow: {
    position: 'absolute',
    top: -60,
    alignSelf: 'center',
    borderRadius: 9999,
  },

  bottomAmbientGlow: {
    position: 'absolute',
    bottom: -60,
    alignSelf: 'center',
    borderRadius: 9999,
  },

  /* =============================================================
     BACK BUTTON
     ============================================================= */

  backButtonRow: {
    position: 'absolute',
    left: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* =============================================================
     MAIN WRAPPER
     ============================================================= */

  mainWrapper: {
    flex: 1,
    width: '100%',
  },

  /*
   * PHONE
   *
   * Header stays above the bottom sheet.
   * Auth surface is pushed to the bottom.
   */
  mainWrapperPhone: {
    justifyContent: 'flex-end',
  },

  /*
   * TABLET / IPAD
   *
   * Everything is centered instead of being
   * pushed against the bottom edge.
   */
  mainWrapperTablet: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* =============================================================
     ABOVE-SHEET / HEADER
     ============================================================= */

  aboveSheetWrapper: {
    width: '100%',
  },

  aboveSheetWrapperTablet: {
    /*
     * Keeps the header aligned with the auth
     * panel instead of stretching across the iPad.
     */
    alignSelf: 'center',
  },

  /* =============================================================
     PHONE AUTH SURFACE
     ============================================================= */

  mainContentPhone: {
    width: '100%',

    paddingHorizontal: 20,
    paddingTop: 20,

    /*
     * Keep your original mobile bottom-sheet
     * appearance.
     */
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },

  /* =============================================================
     TABLET AUTH SURFACE
     ============================================================= */

  mainContentTablet: {
    /*
     * IMPORTANT:
     *
     * Unlike the phone version, the tablet
     * surface is NOT attached to the bottom.
     */
    paddingHorizontal: 34,

    borderRadius: 28,

    /*
     * Give the panel some visual separation
     * from the gradient background.
     */
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.12,
    shadowRadius: 35,

    elevation: 12,
  },
});