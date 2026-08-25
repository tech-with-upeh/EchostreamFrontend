import SettingsRow from '@/components/settings/Settingsrow';
import UpgradeToProCard from '@/components/Upgradetoprocard';
import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const DESTRUCTIVE = '#FF5C5C';

const USER = {
  name: 'Andrew Ainsley',
  email: 'andrew.ainsley@yourdomain.com',
  avatar: 'https://i.pravatar.cc/150?img=13',
};

const MENU_ITEMS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}[] = [
  {
    icon: 'people-outline',
    label: 'Switch User',
  },
  {
    icon: 'notifications-outline',
    label: 'Notifications',
  },
  {
    icon: 'shield-checkmark-outline',
    label: 'Account & Security',
  },
  {
    icon: 'star-outline',
    label: 'Billing & Subscriptions',
  },
  {
    icon: 'headset-outline',
    label: 'Support',
  },
  {
    icon: 'document-text-outline',
    label: 'Terms of Service',
  },
  {
    icon: 'globe-outline',
    label: 'Language',
  },
];

const APP_VERSION =
  Constants.expoConfig?.version ?? '1.0.0';

type SheetType =
  | 'Switch User'
  | 'Notifications'
  | 'Account & Security'
  | 'Billing & Subscriptions'
  | 'Support'
  | 'Terms of Service'
  | 'Language'
  | null;

/* ============================================================
   SWITCH
============================================================ */

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  trackColor: {
    false: string;
    true: string;
  };
  thumbColor: string;
};

function ToggleSwitch({
  value,
  onValueChange,
  trackColor,
  thumbColor,
}: SwitchProps) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={({ pressed }): StyleProp<ViewStyle> => [
        styles.switchTrack,
        {
          backgroundColor: value
            ? trackColor.true
            : trackColor.false,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.switchThumb,
          {
            backgroundColor: thumbColor,
            transform: [
              {
                translateX: value ? 18 : 2,
              },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

/* ============================================================
   TOGGLE ROW
============================================================ */

type ToggleRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleRow({
  icon,
  title,
  description,
  value,
  onValueChange,
}: ToggleRowProps) {
  const { theme } = useAppTheme();

  return (
    <View
      style={[
        styles.settingControl,
        {
          borderBottomColor: theme.outline,
        },
      ]}
    >
      <View style={styles.settingControlLeft}>
        <View
          style={[
            styles.controlIcon,
            {
              backgroundColor: theme.surface,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={19}
            color={theme.primary}
          />
        </View>

        <View style={styles.controlText}>
          <Text
            style={[
              styles.controlTitle,
              {
                color: theme.onSurface,
              },
            ]}
          >
            {title}
          </Text>

          {description ? (
            <Text
              style={[
                styles.controlDescription,
                {
                  color: theme.onSurfaceVariant,
                },
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      <ToggleSwitch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: theme.outline,
          true: theme.primaryDim,
        }}
        thumbColor={
          value
            ? theme.primary
            : theme.onSurfaceVariant
        }
      />
    </View>
  );
}

/* ============================================================
   ACTION ROW
============================================================ */

type ActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  onPress: () => void;
  danger?: boolean;
};

function ActionRow({
  icon,
  title,
  description,
  onPress,
  danger = false,
}: ActionRowProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }): StyleProp<ViewStyle> => [
        styles.actionRow,
        {
          borderBottomColor: theme.outline,
          opacity: pressed ? 0.6 : 1,
        },
      ]}
    >
      <View style={styles.actionLeft}>
        <View
          style={[
            styles.controlIcon,
            {
              backgroundColor: theme.surface,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={19}
            color={
              danger
                ? DESTRUCTIVE
                : theme.primary
            }
          />
        </View>

        <View style={styles.controlText}>
          <Text
            style={[
              styles.controlTitle,
              {
                color: danger
                  ? DESTRUCTIVE
                  : theme.onSurface,
              },
            ]}
          >
            {title}
          </Text>

          {description ? (
            <Text
              style={[
                styles.controlDescription,
                {
                  color: theme.onSurfaceVariant,
                },
              ]}
            >
              {description}
            </Text>
          ) : null}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={theme.onSurfaceVariant}
      />
    </Pressable>
  );
}

/* ============================================================
   SHEET OPTION
============================================================ */

type SheetOptionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
};

function SheetOption({
  icon,
  title,
  description,
  selected = false,
  onPress,
}: SheetOptionProps) {
  const { theme } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }): StyleProp<ViewStyle> => [
        styles.optionRow,
        {
          backgroundColor: selected
            ? theme.surface
            : 'transparent',
          borderColor: selected
            ? theme.primary
            : theme.outline,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.optionIcon,
          {
            backgroundColor:
              theme.surfaceVariant,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={
            selected
              ? theme.primary
              : theme.onSurface
          }
        />
      </View>

      <View style={styles.optionContent}>
        <Text
          style={[
            styles.optionTitle,
            {
              color: theme.onSurface,
            },
          ]}
        >
          {title}
        </Text>

        {description ? (
          <Text
            style={[
              styles.optionDescription,
              {
                color: theme.onSurfaceVariant,
              },
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>

      {selected ? (
        <Ionicons
          name="checkmark-circle"
          size={21}
          color={theme.primary}
        />
      ) : (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.onSurfaceVariant}
        />
      )}
    </Pressable>
  );
}

/* ============================================================
   BOTTOM SHEET
============================================================ */

type BottomSheetProps = {
  visible: boolean;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onClose: () => void;
  children: React.ReactNode;
  maxHeight?: number;
};

function BottomSheet({
  visible,
  title,
  icon,
  onClose,
  children,
  maxHeight = 0.82,
}: BottomSheetProps) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;

  
  const tabletWidth = Math.min(
    width - 48,
    720,
  );

  const sheetHeight = Math.min(
    height * maxHeight,
    isTablet ? 720 : height * maxHeight,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.modalRoot,
          {
            paddingBottom: isTablet
              ? Math.max(insets.bottom, 24)
              : 0,
          },
        ]}
      >
        {/* Backdrop */}
        <Pressable
          style={styles.modalBackdrop}
          onPress={onClose}
        />

        {/* Sheet */}
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(220)}
          style={[
            styles.bottomSheet,
            isTablet
              ? styles.bottomSheetTablet
              : styles.bottomSheetPhone,
            {
              width: isTablet
                ? tabletWidth
                : '100%',
              maxHeight: sheetHeight,
              backgroundColor:
                theme.background,
              borderColor: theme.outline,
              paddingBottom: isTablet
                ? Math.max(
                    insets.bottom,
                    18,
                  )
                : Math.max(
                    insets.bottom,
                    12,
                  ),
            },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.dragArea}>
            <View
              style={[
                styles.dragHandle,
                {
                  backgroundColor:
                    theme.onSurfaceVariant,
                },
              ]}
            />
          </View>

          {/* Header */}
          <View
            style={[
              styles.sheetHeader,
              {
                borderBottomColor:
                  theme.outline,
              },
            ]}
          >
            <View style={styles.sheetTitleRow}>
              <View
                style={[
                  styles.sheetTitleIcon,
                  {
                    backgroundColor:
                      theme.surfaceVariant,
                  },
                ]}
              >
                <Ionicons
                  name={icon}
                  size={20}
                  color={theme.primary}
                />
              </View>

              <Text
                style={[
                  styles.sheetTitle,
                  {
                    color: theme.onSurface,
                  },
                ]}
              >
                {title}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }): StyleProp<ViewStyle> => [
                styles.closeButton,
                {
                  backgroundColor:
                    theme.surfaceVariant,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme.onSurface}
              />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.sheetContent,
              isTablet &&
                styles.sheetContentTablet,
            ]}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ============================================================
   SETTINGS SCREEN
============================================================ */

export default function SettingsScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const { width } = useWindowDimensions();

  const [activeSheet, setActiveSheet] =
    useState<SheetType>(null);

  /* Notifications */
  const [pushNotifications, setPushNotifications] =
    useState(true);

  const [
    commentNotifications,
    setCommentNotifications,
  ] = useState(true);

  const [
    systemNotifications,
    setSystemNotifications,
  ] = useState(true);

  const [
    notificationSound,
    setNotificationSound,
  ] = useState(true);

  /* Security */
  const [biometrics, setBiometrics] =
    useState(false);

  const [twoFactor, setTwoFactor] =
    useState(false);

  /* Language */
  const [selectedLanguage, setSelectedLanguage] =
    useState('English');

  const openSheet = (label: SheetType) => {
    setActiveSheet(label);
  };

  const closeSheet = () => {
    setActiveSheet(null);
  };

  const showComingSoon = (feature: string) => {
    Alert.alert(
      feature,
      `${feature} will be available here.`,
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            // TODO:
            // Clear your auth session/token here.
            router.replace('/login');
          },
        },
      ],
    );
  };

  const isTablet = width >= 768;

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor:
            theme.background,
        },
      ]}
      edges={[
        'top',
        'left',
        'right',
      ]}
    >
      <View style={StyleSheet.absoluteFillObject}>
              <LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFillObject} />
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
      {/* =====================================================
          HEADER
      ===================================================== */}

      <Animated.View
        entering={FadeInDown.duration(450)}
        style={styles.header}
      >
        <Link href="/(dashboard)" asChild>
          <Pressable
            style={({ pressed }): StyleProp<ViewStyle> => [
              styles.headerButton,
              {
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={theme.primary}
            />
          </Pressable>
        </Link>

        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.onSurface,
            },
          ]}
        >
          Account
        </Text>

        <MaterialCommunityIcons
          name="waveform"
          size={20}
          color={theme.primary}
          style={styles.waveform}
        />
      </Animated.View>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet &&
            styles.scrollContentTablet,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(
            80,
          )}
        >
          <Pressable
            onPress={() => {}}
            style={({ pressed }): StyleProp<ViewStyle> => [
              styles.profileRow,
              {
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Image
              source={{
                uri: USER.avatar,
              }}
              style={styles.avatar}
            />

            <View style={styles.profileText}>
              <Text
                style={[
                  styles.profileName,
                  {
                    color:
                      theme.onSurface,
                  },
                ]}
              >
                {USER.name}
              </Text>

              <Text
                style={[
                  styles.profileEmail,
                  {
                    color:
                      theme.onSurfaceVariant,
                  },
                ]}
              >
                {USER.email}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={
                theme.onSurfaceVariant
              }
            />
          </Pressable>
        </Animated.View>

        {/* Upgrade */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(
            160,
          )}
          style={styles.proWrapper}
        >
          <UpgradeToProCard
            onPress={() =>
              router.push('/pricing')
            }
          />
        </Animated.View>

        {/* Menu */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(
            240,
          )}
          style={[
            styles.menuCard,
            {
              backgroundColor:
                theme.surfaceVariant,
              borderColor:
                theme.outline,
            },
            isTablet &&
              styles.menuCardTablet,
          ]}
        >
          {MENU_ITEMS.map((item) => (
            <SettingsRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={() =>
                openSheet(
                  item.label as SheetType,
                )
              }
            />
          ))}
        </Animated.View>

        {/* Logout */}
        <Animated.View
          entering={FadeInUp.duration(500).delay(
            300,
          )}
          style={[
            styles.logoutWrapper,
            isTablet &&
              styles.tabletContentWidth,
          ]}
        >
          <Pressable
            onPress={handleLogout}
            style={({ pressed }): StyleProp<ViewStyle> => [
              styles.logoutButton,
              {
                backgroundColor:
                  theme.surfaceVariant,
                borderColor:
                  theme.outline,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={19}
              color={DESTRUCTIVE}
            />

            <Text
              style={[
                styles.logoutText,
                {
                  color: DESTRUCTIVE,
                },
              ]}
            >
              Log Out
            </Text>
          </Pressable>
        </Animated.View>

        {/* Version */}
        <Animated.Text
          entering={FadeInUp.duration(400).delay(
            360,
          )}
          style={[
            styles.version,
            {
              color:
                theme.onSurfaceVariant,
            },
          ]}
        >
          EchoStream AI · v{APP_VERSION}
        </Animated.Text>
      </ScrollView>

      {/* =====================================================
          SWITCH USER
      ===================================================== */}

      <BottomSheet
        visible={
          activeSheet === 'Switch User'
        }
        title="Switch User"
        icon="people-outline"
        onClose={closeSheet}
      >
        <Text
          style={[
            styles.sheetIntro,
            {
              color:
                theme.onSurfaceVariant,
            },
          ]}
        >
          Choose which account you want to
          use with EchoStream AI.
        </Text>

        <SheetOption
          icon="person"
          title="Andrew Ainsley"
          description={USER.email}
          selected
          onPress={closeSheet}
        />

        <SheetOption
          icon="person-outline"
          title="Guest Account"
          description="guest@yourdomain.com"
          onPress={() =>
            showComingSoon(
              'Switch User',
            )
          }
        />

        <Pressable
          onPress={() =>
            showComingSoon(
              'Add another account',
            )
          }
          style={({ pressed }): StyleProp<ViewStyle> => [
            styles.primaryAction,
            {
              backgroundColor:
                theme.primary,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons
            name="add"
            size={20}
            color={theme.buttonText}
          />

          <Text
            style={[
              styles.primaryActionText,
              {
                color:
                  theme.buttonText,
              },
            ]}
          >
            Add Another Account
          </Text>
        </Pressable>
      </BottomSheet>

      {/* =====================================================
          NOTIFICATIONS
      ===================================================== */}

      <BottomSheet
        visible={
          activeSheet ===
          'Notifications'
        }
        title="Notifications"
        icon="notifications-outline"
        onClose={closeSheet}
      >
        <Text
          style={[
            styles.sheetIntro,
            {
              color:
                theme.onSurfaceVariant,
            },
          ]}
        >
          Control how EchoStream AI keeps
          you informed.
        </Text>

        <View
          style={[
            styles.controlGroup,
            {
              backgroundColor:
                theme.surfaceVariant,
              borderColor:
                theme.outline,
            },
          ]}
        >
          <ToggleRow
            icon="notifications-outline"
            title="Push Notifications"
            description="Receive notifications from EchoStream AI."
            value={pushNotifications}
            onValueChange={
              setPushNotifications
            }
          />

          <ToggleRow
            icon="chatbubble-outline"
            title="Comment Notifications"
            description="Get notified when new comments are available."
            value={
              commentNotifications
            }
            onValueChange={
              setCommentNotifications
            }
          />

          <ToggleRow
            icon="information-circle-outline"
            title="System Notifications"
            description="Important updates and account information."
            value={
              systemNotifications
            }
            onValueChange={
              setSystemNotifications
            }
          />

          <ToggleRow
            icon="volume-high-outline"
            title="Notification Sound"
            description="Play a sound when a notification arrives."
            value={notificationSound}
            onValueChange={
              setNotificationSound
            }
          />
        </View>
      </BottomSheet>

      {/* =====================================================
          ACCOUNT & SECURITY
      ===================================================== */}

      <BottomSheet
        visible={
          activeSheet ===
          'Account & Security'
        }
        title="Account & Security"
        icon="shield-checkmark-outline"
        onClose={closeSheet}
      >
        <Text
          style={[
            styles.sheetIntro,
            {
              color:
                theme.onSurfaceVariant,
            },
          ]}
        >
          Manage your password, authentication
          methods, and account security.
        </Text>

        <View
          style={[
            styles.controlGroup,
            {
              backgroundColor:
                theme.surfaceVariant,
              borderColor:
                theme.outline,
            },
          ]}
        >
          <ActionRow
            icon="lock-closed-outline"
            title="Change Password"
            description="Update your account password."
            onPress={() =>
              showComingSoon(
                'Change Password',
              )
            }
          />

          <ToggleRow
            icon="finger-print-outline"
            title="Biometric Authentication"
            description="Use Face ID or fingerprint to unlock the app."
            value={biometrics}
            onValueChange={
              setBiometrics
            }
          />

          <ToggleRow
            icon="shield-outline"
            title="Two-Factor Authentication"
            description="Add another layer of protection to your account."
            value={twoFactor}
            onValueChange={
              setTwoFactor
            }
          />

          <ActionRow
            icon="phone-portrait-outline"
            title="Active Sessions"
            description="Review devices currently signed into your account."
            onPress={() =>
              showComingSoon(
                'Active Sessions',
              )
            }
          />
        </View>

        <View
          style={[
            styles.securityBadge,
            {
              backgroundColor:
                theme.surfaceVariant,
              borderColor:
                theme.outline,
            },
          ]}
        >
          <Ionicons
            name="shield-checkmark"
            size={24}
            color={theme.primary}
          />

          <View
            style={
              styles.securityBadgeText
            }
          >
            <Text
              style={[
                styles.securityBadgeTitle,
                {
                  color:
                    theme.onSurface,
                },
              ]}
            >
              Your account is protected
            </Text>

            <Text
              style={[
                styles.securityBadgeDescription,
                {
                  color:
                    theme.onSurfaceVariant,
                },
              ]}
            >
              Keep your authentication details
              private and never share your
              password.
            </Text>
          </View>
        </View>
      </BottomSheet>

      {/* =====================================================
          BILLING
      ===================================================== */}

      <BottomSheet
        visible={
          activeSheet ===
          'Billing & Subscriptions'
        }
        title="Billing & Subscriptions"
        icon="star-outline"
        onClose={closeSheet}
      >
        <Text
          style={[
            styles.sheetIntro,
            {
              color:
                theme.onSurfaceVariant,
            },
          ]}
        >
          Manage your EchoStream AI plan
          and subscription.
        </Text>

        <View
          style={[
            styles.planCard,
            {
              backgroundColor:
                theme.surfaceVariant,
              borderColor:
                theme.primary,
            },
          ]}
        >
          <View style={styles.planHeader}>
            <View>
              <Text
                style={[
                  styles.planLabel,
                  {
                    color:
                      theme.onSurfaceVariant,
                  },
                ]}
              >
                CURRENT PLAN
              </Text>

              <Text
                style={[
                  styles.planName,
                  {
                    color:
                      theme.onSurface,
                  },
                ]}
              >
                Free
              </Text>
            </View>

            <View
              style={[
                styles.planBadge,
                {
                  backgroundColor:
                    theme.surface,
                },
              ]}
            >
              <Ionicons
                name="sparkles"
                size={15}
                color={theme.primary}
              />

              <Text
                style={[
                  styles.planBadgeText,
                  {
                    color:
                      theme.primary,
                  },
                ]}
              >
                FREE
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.usageDivider,
              {
                backgroundColor:
                  theme.outline,
              },
            ]}
          />

          <View style={styles.usageRow}>
            <Text
              style={[
                styles.usageLabel,
                {
                  color:
                    theme.onSurfaceVariant,
                },
              ]}
            >
              Monthly usage
            </Text>

            <Text
              style={[
                styles.usageValue,
                {
                  color:
                    theme.onSurface,
                },
              ]}
            >
              0 / 100
            </Text>
          </View>

          <View
            style={[
              styles.progressTrack,
              {
                backgroundColor:
                  theme.outline,
              },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor:
                    theme.primary,
                    width: '2%',
                },
              ]}
            />
          </View>
        </View>

        <Pressable
          onPress={() => {
            closeSheet();
            router.push('/pricing');
          }}
          style={({ pressed }): StyleProp<ViewStyle> => [
            styles.primaryAction,
            {
              backgroundColor:
                theme.primary,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons
            name="rocket-outline"
            size={20}
            color={theme.buttonText}
          />

          <Text
            style={[
              styles.primaryActionText,
              {
                color:
                  theme.buttonText,
              },
            ]}
          >
            Upgrade Your Plan
          </Text>
        </Pressable>

        <ActionRow
          icon="receipt-outline"
          title="Billing History"
          description="View previous payments and invoices."
          onPress={() =>
            showComingSoon(
              'Billing History',
            )
          }
        />

        <ActionRow
          icon="card-outline"
          title="Payment Method"
          description="Manage your saved payment method."
          onPress={() =>
            showComingSoon(
              'Payment Method',
            )
          }
        />
      </BottomSheet>

      {/* =====================================================
          SUPPORT
      ===================================================== */}

      <BottomSheet
        visible={
          activeSheet === 'Support'
        }
        title="Support"
        icon="headset-outline"
        onClose={closeSheet}
      >
        <Text
          style={[
            styles.sheetIntro,
            {
              color:
                theme.onSurfaceVariant,
            },
          ]}
        >
          Need help? Find answers or get in
          touch with the EchoStream AI team.
        </Text>

        <View
          style={[
            styles.controlGroup,
            {
              backgroundColor:
                theme.surfaceVariant,
              borderColor:
                theme.outline,
            },
          ]}
        >
          <ActionRow
            icon="help-circle-outline"
            title="Help Center"
            description="Browse frequently asked questions and guides."
            onPress={() =>
              showComingSoon(
                'Help Center',
              )
            }
          />

          <ActionRow
            icon="chatbubbles-outline"
            title="Contact Support"
            description="Talk to our support team."
            onPress={() =>
              showComingSoon(
                'Contact Support',
              )
            }
          />

          <ActionRow
            icon="bug-outline"
            title="Report a Problem"
            description="Tell us about a bug or technical issue."
            onPress={() =>
              showComingSoon(
                'Report a Problem',
              )
            }
          />

          <ActionRow
            icon="bulb-outline"
            title="Send Feedback"
            description="Share an idea or suggestion."
            onPress={() =>
              showComingSoon(
                'Send Feedback',
              )
            }
          />
        </View>

        <View
          style={[
            styles.supportFooter,
            {
              backgroundColor:
                theme.surfaceVariant,
              borderColor:
                theme.outline,
            },
          ]}
        >
          <Ionicons
            name="mail-outline"
            size={18}
            color={theme.primary}
          />

          <Text
            style={[
              styles.supportFooterText,
              {
                color:
                  theme.onSurfaceVariant,
              },
            ]}
          >
            support@echostream.ai
          </Text>
        </View>
      </BottomSheet>

      {/* =====================================================
          TERMS OF SERVICE
      ===================================================== */}

      <BottomSheet
        visible={
          activeSheet ===
          'Terms of Service'
        }
        title="Terms of Service"
        icon="document-text-outline"
        onClose={closeSheet}
        maxHeight={0.88}
      >
        <View style={styles.termsContainer}>
          <Text
            style={[
              styles.termsUpdated,
              {
                color:
                  theme.onSurfaceVariant,
              },
            ]}
          >
            Last updated: August 2026
          </Text>

          <Text
            style={[
              styles.termsHeading,
              {
                color: theme.onSurface,
              },
            ]}
          >
            1. Acceptance of Terms
          </Text>

          <Text
            style={[
              styles.termsText,
              {
                color:
                  theme.onSurfaceVariant,
              },
            ]}
          >
            By using EchoStream AI, you agree to
            these Terms of Service. If you do not
            agree with these terms, please do not
            use the service.
          </Text>

          <Text
            style={[
              styles.termsHeading,
              {
                color: theme.onSurface,
              },
            ]}
          >
            2. Use of the Service
          </Text>

          <Text
            style={[
              styles.termsText,
              {
                color:
                  theme.onSurfaceVariant,
              },
            ]}
          >
            EchoStream AI provides tools for
            processing, transforming, and generating
            audio content. You are responsible for
            how you use the generated content and
            the service.
          </Text>

          <Text
            style={[
              styles.termsHeading,
              {
                color: theme.onSurface,
              },
            ]}
          >
            3. Your Account
          </Text>

          <Text
            style={[
              styles.termsText,
              {
                color:
                  theme.onSurfaceVariant,
              },
            ]}
          >
            You are responsible for maintaining the
            security of your account credentials and
            for activities performed through your
            account.
          </Text>

          <Text
            style={[
              styles.termsHeading,
              {
                color: theme.onSurface,
              },
            ]}
          >
            4. Prohibited Use
          </Text>

          <Text
            style={[
              styles.termsText,
              {
                color:
                  theme.onSurfaceVariant,
              },
            ]}
          >
            You may not use EchoStream AI for
            unlawful, abusive, fraudulent, or harmful
            activities. You must comply with applicable
            laws when using the service.
          </Text>

          <Text
            style={[
              styles.termsHeading,
              {
                color: theme.onSurface,
              },
            ]}
          >
            5. Subscriptions
          </Text>

          <Text
            style={[
              styles.termsText,
              {
                color:
                  theme.onSurfaceVariant,
              },
            ]}
          >
            Paid subscriptions may provide additional
            features, usage limits, and capabilities.
            Subscription terms and pricing may change
            from time to time.
          </Text>

          <Text
            style={[
              styles.termsHeading,
              {
                color: theme.onSurface,
              },
            ]}
          >
            6. Changes to These Terms
          </Text>

          <Text
            style={[
              styles.termsText,
              {
                color:
                  theme.onSurfaceVariant,
              },
            ]}
          >
            We may update these terms when necessary.
            Continued use of EchoStream AI after changes
            take effect means you accept the updated
            terms.
          </Text>

          <Text
            style={[
              styles.termsHeading,
              {
                color: theme.onSurface,
              },
            ]}
          >
            7. Contact
          </Text>

          <Text
            style={[
              styles.termsText,
              {
                color:
                  theme.onSurfaceVariant,
              },
            ]}
          >
            If you have questions about these Terms
            of Service, please contact our support
            team.
          </Text>
        </View>
      </BottomSheet>

      {/* =====================================================
          LANGUAGE
      ===================================================== */}

      <BottomSheet
        visible={
          activeSheet === 'Language'
        }
        title="Language"
        icon="globe-outline"
        onClose={closeSheet}
      >
        <Text
          style={[
            styles.sheetIntro,
            {
              color:
                theme.onSurfaceVariant,
            },
          ]}
        >
          Choose the language used throughout
          the app.
        </Text>

        <SheetOption
          icon="language-outline"
          title="English"
          description="English"
          selected={
            selectedLanguage === 'English'
          }
          onPress={() => {
            setSelectedLanguage(
              'English',
            );
            closeSheet();
          }}
        />

        <SheetOption
          icon="language-outline"
          title="French"
          description="Français"
          selected={
            selectedLanguage === 'French'
          }
          onPress={() => {
            setSelectedLanguage(
              'French',
            );
            closeSheet();
          }}
        />

        <SheetOption
          icon="language-outline"
          title="Spanish"
          description="Español"
          selected={
            selectedLanguage === 'Spanish'
          }
          onPress={() => {
            setSelectedLanguage(
              'Spanish',
            );
            closeSheet();
          }}
        />

        <SheetOption
          icon="language-outline"
          title="German"
          description="Deutsch"
          selected={
            selectedLanguage === 'German'
          }
          onPress={() => {
            setSelectedLanguage(
              'German',
            );
            closeSheet();
          }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

/* ============================================================
   STYLES
============================================================ */

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

  /* ==========================================================
     HEADER
  ========================================================== */

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: '100%',
  },

  headerButton: {
    position: 'absolute',
    left: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  waveform: {
    position: 'absolute',
    right: 20,
  },

  /* ==========================================================
     MAIN CONTENT
  ========================================================== */

  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },

  scrollContentTablet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 760,
  },

  tabletContentWidth: {
    width: '100%',
  },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },

  profileText: {
    flex: 1,
  },

  profileName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },

  profileEmail: {
    fontSize: 12.5,
  },

  proWrapper: {
    marginBottom: 24,
  },

  menuCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },

  menuCardTablet: {
    width: '100%',
  },

  logoutWrapper: {
    marginBottom: 16,
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: '700',
  },

  version: {
    fontSize: 12,
    textAlign: 'center',
  },

  /* ==========================================================
     MODAL
  ========================================================== */

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },

  /* ==========================================================
     BOTTOM SHEET
  ========================================================== */

  bottomSheet: {
    borderWidth: 1,
    overflow: 'hidden',
  },

  bottomSheetPhone: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  bottomSheetTablet: {
    width: '100%',
    maxWidth: 720,
    borderRadius: 28,
    marginHorizontal: 24,
    marginBottom: 24,
  },

  dragArea: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
  },

  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: 10,
    opacity: 0.45,
  },

  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },

  sheetTitleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetContent: {
    padding: 20,
    paddingBottom: 10,
  },

  sheetContentTablet: {
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 20,
  },

  sheetIntro: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 18,
  },

  /* ==========================================================
     OPTIONS
  ========================================================== */

  optionRow: {
    minHeight: 68,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 12,
  },

  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 3,
  },

  optionDescription: {
    fontSize: 12,
    lineHeight: 17,
  },

  /* ==========================================================
     CONTROLS
  ========================================================== */

  controlGroup: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    overflow: 'hidden',
    marginBottom: 18,
  },

  settingControl: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth:
      StyleSheet.hairlineWidth,
  },

  settingControlLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },

  controlIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  controlText: {
    flex: 1,
  },

  controlTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },

  controlDescription: {
    fontSize: 11.5,
    lineHeight: 16,
  },

  actionRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth:
      StyleSheet.hairlineWidth,
    paddingVertical: 11,
  },

  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },

  /* ==========================================================
     SWITCH
  ========================================================== */

  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 14,
    justifyContent: 'center',
  },

  switchThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },

  /* ==========================================================
     BUTTONS
  ========================================================== */

  primaryAction: {
    minHeight: 52,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 18,
  },

  primaryActionText: {
    fontSize: 14.5,
    fontWeight: '800',
  },

  /* ==========================================================
     SECURITY
  ========================================================== */

  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
  },

  securityBadgeText: {
    flex: 1,
  },

  securityBadgeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 3,
  },

  securityBadgeDescription: {
    fontSize: 11.5,
    lineHeight: 17,
  },

  /* ==========================================================
     BILLING
  ========================================================== */

  planCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginBottom: 18,
  },

  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  planLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 5,
  },

  planName: {
    fontSize: 24,
    fontWeight: '800',
  },

  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  planBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  usageDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },

  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  usageLabel: {
    fontSize: 12,
  },

  usageValue: {
    fontSize: 12,
    fontWeight: '700',
  },

  progressTrack: {
    height: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 10,
  },

  /* ==========================================================
     SUPPORT
  ========================================================== */

  supportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
  },

  supportFooterText: {
    fontSize: 12.5,
    fontWeight: '600',
  },

  /* ==========================================================
     TERMS
  ========================================================== */

  termsContainer: {
    paddingBottom: 10,
  },

  termsUpdated: {
    fontSize: 11.5,
    marginBottom: 22,
  },

  termsHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 8,
  },

  termsText: {
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 14,
  },
});