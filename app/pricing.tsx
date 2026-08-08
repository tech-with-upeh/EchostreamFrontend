import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';

type Plan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  button: string;
  popular?: boolean;
};

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: '$0',
    description:
      'Essential tools for individual creators to begin their journey.',
    features: [
      'Basic AI generation (100 credits/mo)',
      'Standard export resolution',
      'Community support access',
    ],
    button: 'Get Started',
  },

  {
    name: 'Essential',
    price: '$9.99',
    description:
      'The definitive toolkit for professional creators and daily users.',
    features: [
      'Unlimited basic generations',
      'High-fidelity 4K exports',
      'Priority render queue',
      'Custom style training (up to 5)',
    ],
    button: 'Upgrade Now',
    popular: true,
  },

  {
    name: 'Pro',
    price: '$19.99',
    description:
      'Uncompromised power for studios and enterprise-scale workflows.',
    features: [
      'Everything in Essential',
      'API access & documentation',
      'Unlimited custom style training',
      'Dedicated account manager',
    ],
    button: 'Contact Sales',
  },
];

export default function PricingScreen() {
  const { theme, isDark } = useAppTheme();
  const { width } = useWindowDimensions();

  const isMobile = width < 700;

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* =========================================================
          ATMOSPHERIC BACKGROUND
          ========================================================= */}

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <LinearGradient
          colors={theme.bgGradient}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Top cyan atmosphere */}
        <LinearGradient
          colors={[theme.topGlow, 'transparent']}
          style={styles.topAmbientGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        {/* Bottom cyan atmosphere */}
        <LinearGradient
          colors={[theme.bottomGlow, 'transparent']}
          style={styles.bottomAmbientGlow}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />

        {/* Subtle center glow behind pricing */}
        <View
          style={[
            styles.centerGlow,
            {
              backgroundColor: theme.primary,
              opacity: isDark ? 0.025 : 0.018,
            },
          ]}
        />
      </View>

      {/* =========================================================
          CONTENT
          ========================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.mobileScrollContent,
        ]}
      >
        {/* =======================================================
            BRAND
            ======================================================= */}

        <View style={styles.brandContainer}>
          <View
            style={[
              styles.brandIcon,
              {
                borderColor: theme.primary,
              },
            ]}
          >
            <View
              style={[
                styles.wave,
                styles.waveOne,
                {
                  backgroundColor: theme.primary,
                },
              ]}
            />
            <View
              style={[
                styles.wave,
                styles.waveTwo,
                {
                  backgroundColor: theme.primary,
                },
              ]}
            />
            <View
              style={[
                styles.wave,
                styles.waveThree,
                {
                  backgroundColor: theme.primary,
                },
              ]}
            />
          </View>

          <Text
            style={[
              styles.brandText,
              {
                color: theme.onSurface,
              },
            ]}
          >
            EchoStream AI
          </Text>
        </View>

        {/* =======================================================
            HEADING
            ======================================================= */}

        <View style={styles.header}>
          <Text
            style={[
              styles.heading,
              {
                color: theme.onSurface,
              },
            ]}
          >
            Atmospheric Precision.
          </Text>

          <Text
            style={[
              styles.headingAccent,
              {
                color: theme.primary,
              },
            ]}
          >
            Choose your tier.
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color: theme.onSurfaceVariant,
              },
            ]}
          >
            Unlock the full potential of your AI workflow with tools
            designed for cinematic fidelity.
          </Text>
        </View>

        {/* =======================================================
            PRICING CARDS
            ======================================================= */}

        <View
          style={[
            styles.plansContainer,
            isMobile && styles.plansContainerMobile,
          ]}
        >
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              theme={theme}
              isDark={isDark}
              isMobile={isMobile}
            />
          ))}
        </View>

        {/* =======================================================
            FOOTER
            ======================================================= */}

        <Text
          style={[
            styles.legal,
            {
              color: theme.onSurfaceVariant,
            },
          ]}
        >
          By continuing, you agree to our Terms of Service and Privacy
          Policy.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =================================================================
   PRICING CARD
   ================================================================= */

function PricingCard({
  plan,
  theme,
  isDark,
  isMobile,
}: {
  plan: Plan;
  theme: any;
  isDark: boolean;
  isMobile: boolean;
}) {
  return (
    <View
      style={[
        styles.cardWrapper,
        isMobile && styles.cardWrapperMobile,
      ]}
    >
      {/* =========================================================
          POPULAR BADGE
          ========================================================= */}

      {plan.popular && (
        <View
          style={[
            styles.popularBadge,
            {
              backgroundColor: theme.primary,
            },
          ]}
        >
          <View
            style={[
              styles.badgeDot,
              {
                backgroundColor: theme.buttonText,
              },
            ]}
          />

          <Text
            style={[
              styles.popularBadgeText,
              {
                color: theme.buttonText,
              },
            ]}
          >
            BEST VALUE
          </Text>
        </View>
      )}

      {/* =========================================================
          CARD
          ========================================================= */}

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: plan.popular
              ? theme.primary
              : theme.outline,
          },

          plan.popular && {
            shadowColor: theme.primary,
            shadowOpacity: isDark ? 0.28 : 0.14,
            shadowRadius: 24,
            shadowOffset: {
              width: 0,
              height: 8,
            },
            elevation: 8,
          },
        ]}
      >
        {/* Small cyan indicator */}
        <View
          style={[
            styles.cardIndicator,
            {
              backgroundColor: plan.popular
                ? theme.primary
                : theme.primaryDim,
            },
          ]}
        />

        {/* Plan */}
        <Text
          style={[
            styles.planName,
            {
              color: plan.popular
                ? theme.primary
                : theme.onSurface,
            },
          ]}
        >
          {plan.name}
        </Text>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text
            style={[
              styles.price,
              {
                color: theme.onSurface,
              },
            ]}
          >
            {plan.price}
          </Text>

          <Text
            style={[
              styles.month,
              {
                color: theme.onSurfaceVariant,
              },
            ]}
          >
            /mo
          </Text>
        </View>

        {/* Description */}
        <Text
          style={[
            styles.description,
            {
              color: theme.onSurfaceVariant,
            },
          ]}
        >
          {plan.description}
        </Text>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.outline,
            },
          ]}
        />

        {/* Features */}
        <View style={styles.featuresContainer}>
          {plan.features.map((feature, index) => (
            <View
              key={index}
              style={styles.featureRow}
            >
              <View
                style={[
                  styles.checkCircle,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark"
                  size={8}
                  color={theme.buttonText}
                />
              </View>

              <Text
                style={[
                  styles.featureText,
                  {
                    color: theme.onSurfaceVariant,
                  },
                ]}
              >
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {/* Button pushed to bottom */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            activeOpacity={0.82}
            style={[
              styles.button,
              {
                borderColor: plan.popular
                  ? theme.primary
                  : theme.outline,
              },
            ]}
          >
            {plan.popular ? (
              <LinearGradient
                colors={[
                  theme.primary,
                  theme.primaryDim,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButtonGradient}
              >
                <Text
                  style={[
                    styles.buttonText,
                    {
                      color: theme.buttonText,
                    },
                  ]}
                >
                  {plan.button}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={theme.buttonText}
                  style={styles.buttonIcon}
                />
              </LinearGradient>
            ) : (
              <View style={styles.outlineButtonContent}>
                <Text
                  style={[
                    styles.buttonText,
                    {
                      color: theme.onSurface,
                    },
                  ]}
                >
                  {plan.button}
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={15}
                  color={theme.primary}
                  style={styles.buttonIcon}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* =================================================================
   STYLES
   ================================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 42,
  },

  mobileScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  /* ===============================================================
     BACKGROUND
     =============================================================== */

  topAmbientGlow: {
    position: 'absolute',
    top: -70,
    alignSelf: 'center',
    width: '125%',
    height: 430,
    borderRadius: 400,
  },

  bottomAmbientGlow: {
    position: 'absolute',
    bottom: -100,
    alignSelf: 'center',
    width: '130%',
    height: 380,
    borderRadius: 400,
  },

  centerGlow: {
    position: 'absolute',
    width: 500,
    height: 500,
    borderRadius: 250,
    alignSelf: 'center',
    top: '30%',
  },

  /* ===============================================================
     BRAND
     =============================================================== */

  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 58,
    gap: 10,
  },

  brandIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },

  wave: {
    width: 14,
    height: 2,
    borderRadius: 4,
  },

  waveOne: {
    transform: [{ rotate: '4deg' }],
  },

  waveTwo: {
    transform: [{ rotate: '-4deg' }],
  },

  waveThree: {
    transform: [{ rotate: '3deg' }],
  },

  brandText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  /* ===============================================================
     HEADER
     =============================================================== */

  header: {
    width: '100%',
    maxWidth: 620,
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 42,
  },

  heading: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '400',
    letterSpacing: -1.2,
    textAlign: 'center',
  },

  headingAccent: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '500',
    letterSpacing: -1.2,
    textAlign: 'center',
  },

  subtitle: {
    maxWidth: 540,
    marginTop: 17,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    opacity: 0.85,
  },

  /* ===============================================================
     PLANS
     =============================================================== */

  plansContainer: {
    width: '100%',
    maxWidth: 930,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'stretch',
    gap: 18,
    paddingHorizontal: 20,
  },

  plansContainerMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 22,
    paddingHorizontal: 0,
  },

  cardWrapper: {
    flex: 1,
    position: 'relative',
    minWidth: 0,
  },

  cardWrapperMobile: {
    width: '100%',
    flex: undefined,
  },

  /* ===============================================================
     CARD
     =============================================================== */

  card: {
    minHeight: 410,
    borderRadius: 17,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
  },

  cardIndicator: {
    position: 'absolute',
    left: 24,
    top: 0,
    width: 36,
    height: 2,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },

  popularBadge: {
    position: 'absolute',
    zIndex: 10,
    top: -1,
    left: '50%',
    transform: [{ translateX: -48 }],
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  badgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  popularBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  /* ===============================================================
     CARD TYPOGRAPHY
     =============================================================== */

  planName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  price: {
    fontSize: 36,
    fontWeight: '400',
    letterSpacing: -1.3,
  },

  month: {
    fontSize: 12,
    marginLeft: 5,
  },

  description: {
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 16,
    minHeight: 51,
    maxWidth: 250,
  },

  divider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
    marginVertical: 20,
  },

  /* ===============================================================
     FEATURES
     =============================================================== */

  featuresContainer: {
    gap: 14,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
  },

  checkCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },

  featureText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 16,
  },

  /* ===============================================================
     BUTTON
     =============================================================== */

  buttonContainer: {
    marginTop: 'auto',
    paddingTop: 28,
  },

  button: {
    height: 46,
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },

  primaryButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  outlineButtonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonText: {
    fontSize: 12,
    fontWeight: '700',
  },

  buttonIcon: {
    marginLeft: 7,
  },

  /* ===============================================================
     FOOTER
     =============================================================== */

  legal: {
    marginTop: 42,
    paddingHorizontal: 24,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    opacity: 0.55,
  },
});