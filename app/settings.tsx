import SettingsRow from "@/components/settings/Settingsrow";
import UpgradeToProCard from "@/components/Upgradetoprocard";
import { useAppTheme } from "@/hooks/use-theme-color";
import { clearVoicePreviewCache } from "@/lib/voice";

import { useAuthStore } from "@/store/auth.store";
import { reportError, reportInfo } from "@/store/error.store";
import { useUserStore } from "@/store/user.store";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");
const DESTRUCTIVE = "#FF5C5C";
const MENU_ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "logo-tiktok", label: "Connect TikTok" },
  { icon: "notifications-outline", label: "Notifications" },
  { icon: "shield-checkmark-outline", label: "Account & Security" },
  { icon: "star-outline", label: "Billing & Subscriptions" },
  { icon: "headset-outline", label: "Support" },
  { icon: "document-text-outline", label: "Terms of Service" },
  { icon: "globe-outline", label: "Language" },
];
const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
type SheetType =
  | "Connect TikTok"
  | "Notifications"
  | "Account & Security"
  | "Billing & Subscriptions"
  | "Support"
  | "Terms of Service"
  | "Language"
  | null;
type ChangePasswordStep = "idle" | "otp" | "password" | "success";

type SwitchProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  trackColor: { false: string; true: string };
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
      style={({ pressed }) => [
        styles.switchTrack,
        {
          backgroundColor: value ? trackColor.true : trackColor.false,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.switchThumb,
          {
            backgroundColor: thumbColor,
            transform: [{ translateX: value ? 18 : 2 }],
          },
        ]}
      />
    </Pressable>
  );
}
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
    <View style={[styles.settingControl, { borderBottomColor: theme.outline }]}>
      <View style={styles.settingControlLeft}>
        <View style={[styles.controlIcon, { backgroundColor: theme.surface }]}>
          <Ionicons name={icon} size={19} color={theme.primary} />
        </View>
        <View style={styles.controlText}>
          <Text style={[styles.controlTitle, { color: theme.onSurface }]}>
            {title}
          </Text>
          {description ? (
            <Text
              style={[
                styles.controlDescription,
                { color: theme.onSurfaceVariant },
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
        trackColor={{ false: theme.outline, true: theme.primaryDim }}
        thumbColor={value ? theme.primary : theme.onSurfaceVariant}
      />
    </View>
  );
}
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
      style={({ pressed }) => [
        styles.actionRow,
        { borderBottomColor: theme.outline, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <View style={styles.actionLeft}>
        <View style={[styles.controlIcon, { backgroundColor: theme.surface }]}>
          <Ionicons
            name={icon}
            size={19}
            color={danger ? DESTRUCTIVE : theme.primary}
          />
        </View>
        <View style={styles.controlText}>
          <Text
            style={[
              styles.controlTitle,
              { color: danger ? DESTRUCTIVE : theme.onSurface },
            ]}
          >
            {title}
          </Text>
          {description ? (
            <Text
              style={[
                styles.controlDescription,
                { color: theme.onSurfaceVariant },
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
      style={({ pressed }) => [
        styles.optionRow,
        {
          backgroundColor: selected ? theme.surface : "transparent",
          borderColor: selected ? theme.primary : theme.outline,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View
        style={[styles.optionIcon, { backgroundColor: theme.surfaceVariant }]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={selected ? theme.primary : theme.onSurface}
        />
      </View>
      <View style={styles.optionContent}>
        <Text style={[styles.optionTitle, { color: theme.onSurface }]}>
          {title}
        </Text>
        {description ? (
          <Text
            style={[
              styles.optionDescription,
              { color: theme.onSurfaceVariant },
            ]}
          >
            {description}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={21} color={theme.primary} />
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
  const tabletWidth = Math.min(width - 48, 720);
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
          { paddingBottom: isTablet ? Math.max(insets.bottom, 24) : 0 },
        ]}
      >
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <Animated.View
          entering={SlideInDown.duration(300)}
          exiting={SlideOutDown.duration(220)}
          style={[
            styles.bottomSheet,
            isTablet ? styles.bottomSheetTablet : styles.bottomSheetPhone,
            {
              width: isTablet ? tabletWidth : "100%",
              maxHeight: sheetHeight,
              backgroundColor: theme.background,
              borderColor: theme.outline,
              paddingBottom: isTablet
                ? Math.max(insets.bottom, 18)
                : Math.max(insets.bottom, 12),
            },
          ]}
        >
          <View style={styles.dragArea}>
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: theme.onSurfaceVariant },
              ]}
            />
          </View>
          <View
            style={[styles.sheetHeader, { borderBottomColor: theme.outline }]}
          >
            <View style={styles.sheetTitleRow}>
              <View
                style={[
                  styles.sheetTitleIcon,
                  { backgroundColor: theme.surfaceVariant },
                ]}
              >
                <Ionicons name={icon} size={20} color={theme.primary} />
              </View>
              <Text style={[styles.sheetTitle, { color: theme.onSurface }]}>
                {title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: theme.surfaceVariant,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Ionicons name="close" size={20} color={theme.onSurface} />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.sheetContent,
              isTablet && styles.sheetContentTablet,
            ]}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function SettingsScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isLoggingOut, setisLoggingOut] = useState(false);
  const [tiktokUsername, setTiktokUsername] = useState("");
  const [connectedTikTokUsername, setConnectedTikTokUsername] = useState<
    string | null
  >(null);
  const [isConnectingTikTok, setIsConnectingTikTok] = useState(false);
  const [changePasswordStep, setChangePasswordStep] =
    useState<ChangePasswordStep>("idle");
  const [changePasswordOtp, setChangePasswordOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isSendingPasswordOtp, setIsSendingPasswordOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const openSheet = (label: SheetType) => setActiveSheet(label);
  const closeSheet = () => setActiveSheet(null);
  const showComingSoon = (feature: string) =>
    Alert.alert(feature, `${feature} will be available here.`);
  const logout = useAuthStore((state) => state.logout);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const user = useUserStore((state) => state.user);
  const fullName = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .join(" ") || "Your account";
  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean)
    .map((name) => name!.charAt(0).toUpperCase())
    .join("") || "?";
  const currentPlan = user?.plan
    ? `${user.plan.charAt(0).toUpperCase()}${user.plan.slice(1)}`
    : "Free";
  const isPaidUser = user?.plan === "essential" || user?.plan === "pro";
  const accountEmail = user?.email?.trim() ?? "";
  const cleanTikTokUsername = tiktokUsername.trim().replace(/^@/, "");
  const isTikTokUsernameValid = cleanTikTokUsername.length >= 2;
  const normalizedChangePasswordOtp = changePasswordOtp
    .replace(/\D/g, "")
    .slice(0, 6);
  const canContinuePasswordChange =
    normalizedChangePasswordOtp.length === 6 && !isSendingPasswordOtp;
  const canSubmitPasswordChange =
    canContinuePasswordChange &&
    newPassword.length >= 8 &&
    newPassword === confirmNewPassword &&
    !isChangingPassword;
  const resetChangePasswordForm = () => {
    setChangePasswordOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };
  const handleSendPasswordOtp = async () => {
    if (isSendingPasswordOtp) return;

    if (!accountEmail) {
      reportError("We could not find an email address for this account.");
      return;
    }

    setIsSendingPasswordOtp(true);
    try {
      await forgotPassword(accountEmail);
      resetChangePasswordForm();
      setChangePasswordStep("otp");
      reportInfo(`Verification code sent to ${accountEmail}.`);
    } catch (error) {
      reportError(error, "Unable to send the verification code.");
    } finally {
      setIsSendingPasswordOtp(false);
    }
  };
  const handleContinuePasswordChange = () => {
    if (!canContinuePasswordChange) {
      reportError("Please enter the 6-digit verification code.");
      return;
    }

    setChangePasswordStep("password");
  };
  const handleSubmitPasswordChange = async () => {
    if (!canContinuePasswordChange) {
      reportError("Please enter the 6-digit verification code.");
      return;
    }

    if (newPassword.length < 8) {
      reportError("Your password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      reportError("Please make sure both passwords are the same.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await resetPassword(normalizedChangePasswordOtp, accountEmail, newPassword);
      resetChangePasswordForm();
      setChangePasswordStep("success");
      reportInfo("Your password has been updated.");
    } catch (error) {
      reportError(error, "Unable to update your password.");
    } finally {
      setIsChangingPassword(false);
    }
  };
  const handleConnectTikTok = () => {
    if (!isTikTokUsernameValid || isConnectingTikTok) return;

    setIsConnectingTikTok(true);
    setTimeout(() => {
      setConnectedTikTokUsername(cleanTikTokUsername);
      setTiktokUsername(cleanTikTokUsername);
      setIsConnectingTikTok(false);
    }, 500);
  };
  const handleLogout = () =>
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          setisLoggingOut(true);

          try {
            await logout();
          } finally {
            setisLoggingOut(false);
            router.replace("/login");
          }
        },
      },
    ]);
  const isTablet = width >= 768;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top", "left", "right"]}
    >
      <View style={StyleSheet.absoluteFillObject}>
        <LinearGradient
          colors={theme.bgGradient}
          style={StyleSheet.absoluteFillObject}
        />
        <LinearGradient
          colors={[theme.topGlow, "transparent"]}
          style={styles.topAmbientGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <LinearGradient
          colors={[theme.bottomGlow, "transparent"]}
          style={styles.bottomAmbientGlow}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0 }}
        />
      </View>
      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <Link href="/(dashboard)" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={theme.primary}
            />
          </Pressable>
        </Link>
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>
          Account
        </Text>
        <View style={styles.headerIconSlot}>
          <MaterialCommunityIcons
            name="waveform"
            size={20}
            color={theme.primary}
          />
        </View>
      </Animated.View>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500).delay(80)}>
          <Pressable
            onPress={() => {
              clearVoicePreviewCache();
            }}
            style={({ pressed }) => [
              styles.profileRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: theme.primary },
              ]}
            >
              <Text style={[styles.avatarInitials, { color: theme.buttonText }]}>
                {initials}
              </Text>
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.profileName, { color: theme.onSurface }]}>
                {fullName}
              </Text>
              <Text
                style={[styles.profileEmail, { color: theme.onSurfaceVariant }]}
              >
                {user?.email ?? "Loading account details…"}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.onSurfaceVariant}
            />
          </Pressable>
        </Animated.View>
        <Animated.View
          entering={FadeInUp.duration(500).delay(120)}
          style={styles.creditsWrapper}
        >
          <View
            style={[
              styles.creditsCard,
              {
                backgroundColor: theme.surfaceVariant,
                borderColor: theme.outline,
              },
            ]}
          >
            <View style={styles.creditsHeader}>
              <View>
                <Text
                  style={[
                    styles.creditsLabel,
                    { color: theme.onSurfaceVariant },
                  ]}
                >
                  CURRENT PLAN
                </Text>
                <Text style={[styles.creditsTitle, { color: theme.onSurface }]}>
                  {currentPlan}
                </Text>
              </View>
              <View
                style={[
                  styles.creditsBadge,
                  { backgroundColor: theme.surface },
                ]}
              >
                <Ionicons name="flash" size={15} color={theme.primary} />
                <Text
                  style={[styles.creditsBadgeText, { color: theme.primary }]}
                >
                  {isPaidUser ? "PAID" : "FREE"}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.creditsDivider,
                { backgroundColor: theme.outline },
              ]}
            />
            <View style={styles.creditsUsageRow}>
              <Text
                style={[
                  styles.creditsUsageLabel,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                Plan status
              </Text>
              <Text
                style={[styles.creditsUsageValue, { color: theme.onSurface }]}
              >
                {user?.subscription_status || (isPaidUser ? "Active" : "Free plan")}
              </Text>
            </View>
          </View>
        </Animated.View>
        {!isPaidUser && (
          <Animated.View
            entering={FadeInUp.duration(500).delay(160)}
            style={styles.proWrapper}
          >
            <UpgradeToProCard onPress={() => router.push("/pricing")} />
          </Animated.View>
        )}
        <Animated.View
          entering={FadeInUp.duration(500).delay(240)}
          style={[
            styles.menuCard,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.outline,
            },
            isTablet && styles.menuCardTablet,
          ]}
        >
          {MENU_ITEMS.map((item) => (
            <SettingsRow
              key={item.label}
              icon={item.icon}
              label={item.label}
              onPress={() => openSheet(item.label as SheetType)}
            />
          ))}
        </Animated.View>
        <Animated.View
          entering={FadeInUp.duration(500).delay(300)}
          style={[styles.logoutWrapper, isTablet && styles.tabletContentWidth]}
        >
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              {
                backgroundColor: theme.surfaceVariant,
                borderColor: theme.outline,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {isLoggingOut ? (
              <ActivityIndicator
                color={theme.onSurface}
                animating={isLoggingOut}
              />
            ) : (
              <View style={{ display: "flex", flexDirection: "row", gap: "3" }}>
                <Ionicons name="log-out" size={19} color={DESTRUCTIVE} />
                <Text style={[styles.logoutText, { color: DESTRUCTIVE }]}>
                  Log Out
                </Text>
              </View>
            )}
          </Pressable>
        </Animated.View>
        <Animated.Text
          entering={FadeInUp.duration(400).delay(360)}
          style={[styles.version, { color: theme.onSurfaceVariant }]}
        >
          EchoStream AI · v{APP_VERSION}
        </Animated.Text>
      </ScrollView>

      <BottomSheet
        visible={activeSheet === "Connect TikTok"}
        title="Connect TikTok"
        icon="logo-tiktok"
        onClose={closeSheet}
      >
        <View
          style={[
            styles.tiktokConnectCard,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.outline,
            },
          ]}
        >
          <View
            style={[
              styles.tiktokConnectIcon,
              { backgroundColor: theme.surface },
            ]}
          >
            <Ionicons name="logo-tiktok" size={24} color={theme.onSurface} />
          </View>
          <Text style={[styles.tiktokConnectTitle, { color: theme.onSurface }]}>
            Connect your TikTok
          </Text>
          <Text
            style={[
              styles.tiktokConnectSubtitle,
              { color: theme.onSurfaceVariant },
            ]}
          >
            Enter your TikTok username so EchoStream can listen for live
            comments.
          </Text>
          <View
            style={[
              styles.tiktokInputRow,
              {
                borderColor: theme.outline,
                backgroundColor: theme.surface,
              },
            ]}
          >
            <Text
              style={[styles.tiktokAtSign, { color: theme.onSurfaceVariant }]}
            >
              @
            </Text>
            <TextInput
              value={tiktokUsername}
              onChangeText={setTiktokUsername}
              placeholder="yourusername"
              placeholderTextColor={theme.onSurfaceVariant}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleConnectTikTok}
              style={[styles.tiktokInput, { color: theme.onSurface }]}
            />
          </View>
          {connectedTikTokUsername ? (
            <View
              style={[
                styles.connectedTikTokPill,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.outline,
                },
              ]}
            >
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={theme.primary}
              />
              <Text
                style={[
                  styles.connectedTikTokText,
                  { color: theme.onSurfaceVariant },
                ]}
              >
                Connected to @{connectedTikTokUsername}
              </Text>
            </View>
          ) : null}
          <Pressable
            onPress={handleConnectTikTok}
            disabled={!isTikTokUsernameValid || isConnectingTikTok}
            style={({ pressed }) => [
              styles.tiktokConnectButton,
              {
                backgroundColor: theme.primary,
                opacity:
                  isTikTokUsernameValid && !isConnectingTikTok
                    ? pressed
                      ? 0.75
                      : 1
                    : 0.5,
              },
            ]}
          >
            {isConnectingTikTok ? (
              <ActivityIndicator color={theme.buttonText} />
            ) : (
              <>
                <Text
                  style={[
                    styles.tiktokConnectButtonText,
                    { color: theme.buttonText },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
                >
                  Connect Account
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={theme.buttonText}
                />
              </>
            )}
          </Pressable>
        </View>
      </BottomSheet>
      <BottomSheet
        visible={activeSheet === "Notifications"}
        title="Notifications"
        icon="notifications-outline"
        onClose={closeSheet}
      >
        <Text style={[styles.sheetIntro, { color: theme.onSurfaceVariant }]}>
          Control how EchoStream AI keeps you informed.
        </Text>
        <View
          style={[
            styles.controlGroup,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.outline,
            },
          ]}
        >
          <ToggleRow
            icon="notifications-outline"
            title="Push Notifications"
            description="Receive notifications from EchoStream AI."
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
          <ToggleRow
            icon="chatbubble-outline"
            title="Comment Notifications"
            description="Get notified when new comments are available."
            value={commentNotifications}
            onValueChange={setCommentNotifications}
          />
          <ToggleRow
            icon="information-circle-outline"
            title="System Notifications"
            description="Important updates and account information."
            value={systemNotifications}
            onValueChange={setSystemNotifications}
          />
          <ToggleRow
            icon="volume-high-outline"
            title="Notification Sound"
            description="Play a sound when a notification arrives."
            value={notificationSound}
            onValueChange={setNotificationSound}
          />
        </View>
      </BottomSheet>
      <BottomSheet
        visible={activeSheet === "Account & Security"}
        title="Account & Security"
        icon="shield-checkmark-outline"
        onClose={closeSheet}
      >
        <Text style={[styles.sheetIntro, { color: theme.onSurfaceVariant }]}>
          Manage your password, authentication methods, and account security.
        </Text>
        <View
          style={[
            styles.controlGroup,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.outline,
            },
          ]}
        >
          <ActionRow
            icon="lock-closed-outline"
            title="Change Password"
            description={
              changePasswordStep === "idle"
                ? "Send a verification code to update your password."
                : `Code sent to ${accountEmail || "your account email"}.`
            }
            onPress={() => {
              void handleSendPasswordOtp();
            }}
          />
          <ToggleRow
            icon="finger-print-outline"
            title="Biometric Authentication"
            description="Use Face ID or fingerprint to unlock the app."
            value={biometrics}
            onValueChange={setBiometrics}
          />
          <ToggleRow
            icon="shield-outline"
            title="Two-Factor Authentication"
            description="Add another layer of protection to your account."
            value={twoFactor}
            onValueChange={setTwoFactor}
          />
          <ActionRow
            icon="phone-portrait-outline"
            title="Active Sessions"
            description="Review devices currently signed into your account."
            onPress={() => showComingSoon("Active Sessions")}
          />
        </View>
        {changePasswordStep !== "idle" ? (
          <View
            style={[
              styles.passwordFlowCard,
              {
                backgroundColor: theme.surfaceVariant,
                borderColor: theme.outline,
              },
            ]}
          >
            <View style={styles.passwordFlowHeader}>
              <View
                style={[
                  styles.passwordFlowIcon,
                  { backgroundColor: theme.surface },
                ]}
              >
                <Ionicons
                  name={
                    changePasswordStep === "success"
                      ? "checkmark-circle-outline"
                      : "keypad-outline"
                  }
                  size={20}
                  color={theme.primary}
                />
              </View>
              <View style={styles.passwordFlowHeaderText}>
                <Text
                  style={[styles.passwordFlowTitle, { color: theme.onSurface }]}
                >
                  {changePasswordStep === "success"
                    ? "Password updated"
                    : "Verify it is you"}
                </Text>
                <Text
                  style={[
                    styles.passwordFlowSubtitle,
                    { color: theme.onSurfaceVariant },
                  ]}
                >
                  {changePasswordStep === "success"
                    ? "Your new password is ready to use."
                    : `Enter the code sent to ${accountEmail || "your email"}.`}
                </Text>
              </View>
            </View>
            {changePasswordStep === "otp" ? (
              <>
                <View
                  style={[
                    styles.passwordInputRow,
                    {
                      borderColor: theme.outline,
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={theme.onSurfaceVariant}
                  />
                  <TextInput
                    value={changePasswordOtp}
                    onChangeText={(value) =>
                      setChangePasswordOtp(value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    placeholderTextColor={theme.onSurfaceVariant}
                    keyboardType="number-pad"
                    maxLength={6}
                    textContentType="oneTimeCode"
                    autoComplete="sms-otp"
                    returnKeyType="done"
                    onSubmitEditing={handleContinuePasswordChange}
                    style={[
                      styles.passwordInput,
                      styles.passwordCodeInput,
                      { color: theme.onSurface },
                    ]}
                  />
                </View>
                <Pressable
                  onPress={handleContinuePasswordChange}
                  disabled={!canContinuePasswordChange}
                  style={({ pressed }) => [
                    styles.passwordPrimaryButton,
                    {
                      backgroundColor: theme.primary,
                      opacity: canContinuePasswordChange
                        ? pressed
                          ? 0.75
                          : 1
                        : 0.5,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.passwordPrimaryButtonText,
                      { color: theme.buttonText },
                    ]}
                  >
                    Continue
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={theme.buttonText}
                  />
                </Pressable>
                <Pressable
                  onPress={() => {
                    void handleSendPasswordOtp();
                  }}
                  disabled={isSendingPasswordOtp}
                  style={styles.passwordTextButton}
                >
                  <Text
                    style={[
                      styles.passwordTextButtonText,
                      { color: theme.primary },
                    ]}
                  >
                    {isSendingPasswordOtp ? "Sending code..." : "Resend code"}
                  </Text>
                </Pressable>
              </>
            ) : null}
            {changePasswordStep === "password" ? (
              <>
                <View
                  style={[
                    styles.passwordInputRow,
                    {
                      borderColor: theme.outline,
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={theme.onSurfaceVariant}
                  />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="New password"
                    placeholderTextColor={theme.onSurfaceVariant}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.passwordInput, { color: theme.onSurface }]}
                  />
                  <Pressable
                    onPress={() => setShowNewPassword((value) => !value)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                      size={18}
                      color={theme.onSurfaceVariant}
                    />
                  </Pressable>
                </View>
                <View
                  style={[
                    styles.passwordInputRow,
                    {
                      borderColor: theme.outline,
                      backgroundColor: theme.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={theme.onSurfaceVariant}
                  />
                  <TextInput
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor={theme.onSurfaceVariant}
                    secureTextEntry={!showConfirmNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmitPasswordChange}
                    style={[styles.passwordInput, { color: theme.onSurface }]}
                  />
                  <Pressable
                    onPress={() =>
                      setShowConfirmNewPassword((value) => !value)
                    }
                    hitSlop={8}
                  >
                    <Ionicons
                      name={
                        showConfirmNewPassword
                          ? "eye-outline"
                          : "eye-off-outline"
                      }
                      size={18}
                      color={theme.onSurfaceVariant}
                    />
                  </Pressable>
                </View>
                <Text
                  style={[
                    styles.passwordHint,
                    {
                      color:
                        newPassword && newPassword.length < 8
                          ? DESTRUCTIVE
                          : theme.onSurfaceVariant,
                    },
                  ]}
                >
                  At least 8 characters
                </Text>
                <Pressable
                  onPress={handleSubmitPasswordChange}
                  disabled={!canSubmitPasswordChange}
                  style={({ pressed }) => [
                    styles.passwordPrimaryButton,
                    {
                      backgroundColor: theme.primary,
                      opacity: canSubmitPasswordChange
                        ? pressed
                          ? 0.75
                          : 1
                        : 0.5,
                    },
                  ]}
                >
                  {isChangingPassword ? (
                    <ActivityIndicator color={theme.buttonText} />
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.passwordPrimaryButtonText,
                          { color: theme.buttonText },
                        ]}
                      >
                        Update Password
                      </Text>
                      <Ionicons
                        name="checkmark"
                        size={17}
                        color={theme.buttonText}
                      />
                    </>
                  )}
                </Pressable>
              </>
            ) : null}
            {changePasswordStep === "success" ? (
              <Pressable
                onPress={() => {
                  resetChangePasswordForm();
                  setChangePasswordStep("idle");
                }}
                style={({ pressed }) => [
                  styles.passwordPrimaryButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.passwordPrimaryButtonText,
                    { color: theme.buttonText },
                  ]}
                >
                  Done
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        <View
          style={[
            styles.securityBadge,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.outline,
            },
          ]}
        >
          <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
          <View style={styles.securityBadgeText}>
            <Text
              style={[styles.securityBadgeTitle, { color: theme.onSurface }]}
            >
              Your account is protected
            </Text>
            <Text
              style={[
                styles.securityBadgeDescription,
                { color: theme.onSurfaceVariant },
              ]}
            >
              Keep your authentication details private and never share your
              password.
            </Text>
          </View>
        </View>
      </BottomSheet>
      <BottomSheet
        visible={activeSheet === "Billing & Subscriptions"}
        title="Billing & Subscriptions"
        icon="star-outline"
        onClose={closeSheet}
      >
        <Text style={[styles.sheetIntro, { color: theme.onSurfaceVariant }]}>
          Manage your EchoStream AI plan and subscription.
        </Text>
        <View
          style={[
            styles.planCard,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.primary,
            },
          ]}
        >
          <View style={styles.planHeader}>
            <View>
              <Text
                style={[styles.planLabel, { color: theme.onSurfaceVariant }]}
              >
                CURRENT PLAN
              </Text>
              <Text style={[styles.planName, { color: theme.onSurface }]}>
                Free
              </Text>
            </View>
            <View
              style={[styles.planBadge, { backgroundColor: theme.surface }]}
            >
              <Ionicons name="sparkles" size={15} color={theme.primary} />
              <Text style={[styles.planBadgeText, { color: theme.primary }]}>
                FREE
              </Text>
            </View>
          </View>
          <View
            style={[styles.usageDivider, { backgroundColor: theme.outline }]}
          />
          <View style={styles.usageRow}>
            <Text
              style={[styles.usageLabel, { color: theme.onSurfaceVariant }]}
            >
              Monthly usage
            </Text>
            <Text style={[styles.usageValue, { color: theme.onSurface }]}>
              0 / 100
            </Text>
          </View>
          <View
            style={[styles.progressTrack, { backgroundColor: theme.outline }]}
          >
            <View
              style={[
                styles.progressFill,
                { backgroundColor: theme.primary, width: "2%" },
              ]}
            />
          </View>
        </View>
        <Pressable
          onPress={() => {
            closeSheet();
            router.push("/pricing");
          }}
          style={({ pressed }) => [
            styles.primaryAction,
            { backgroundColor: theme.primary, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Ionicons name="rocket-outline" size={20} color={theme.buttonText} />
          <Text style={[styles.primaryActionText, { color: theme.buttonText }]}>
            Upgrade Your Plan
          </Text>
        </Pressable>
        <ActionRow
          icon="receipt-outline"
          title="Billing History"
          description="View previous payments and invoices."
          onPress={() => showComingSoon("Billing History")}
        />
        <ActionRow
          icon="card-outline"
          title="Payment Method"
          description="Manage your saved payment method."
          onPress={() => showComingSoon("Payment Method")}
        />
      </BottomSheet>
      <BottomSheet
        visible={activeSheet === "Support"}
        title="Support"
        icon="headset-outline"
        onClose={closeSheet}
      >
        <Text style={[styles.sheetIntro, { color: theme.onSurfaceVariant }]}>
          Need help? Find answers or get in touch with the EchoStream AI team.
        </Text>
        <View
          style={[
            styles.controlGroup,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.outline,
            },
          ]}
        >
          <ActionRow
            icon="help-circle-outline"
            title="Help Center"
            description="Browse frequently asked questions and guides."
            onPress={() => showComingSoon("Help Center")}
          />
          <ActionRow
            icon="chatbubbles-outline"
            title="Contact Support"
            description="Talk to our support team."
            onPress={() => showComingSoon("Contact Support")}
          />
          <ActionRow
            icon="bug-outline"
            title="Report a Problem"
            description="Tell us about a bug or technical issue."
            onPress={() => showComingSoon("Report a Problem")}
          />
          <ActionRow
            icon="bulb-outline"
            title="Send Feedback"
            description="Share an idea or suggestion."
            onPress={() => showComingSoon("Send Feedback")}
          />
        </View>
        <View
          style={[
            styles.supportFooter,
            {
              backgroundColor: theme.surfaceVariant,
              borderColor: theme.outline,
            },
          ]}
        >
          <Ionicons name="mail-outline" size={18} color={theme.primary} />
          <Text
            style={[
              styles.supportFooterText,
              { color: theme.onSurfaceVariant },
            ]}
          >
            support@echostream.ai
          </Text>
        </View>
      </BottomSheet>
      <BottomSheet
        visible={activeSheet === "Terms of Service"}
        title="Terms of Service"
        icon="document-text-outline"
        onClose={closeSheet}
        maxHeight={0.88}
      >
        <View style={styles.termsContainer}>
          <Text
            style={[styles.termsUpdated, { color: theme.onSurfaceVariant }]}
          >
            Last updated: August 2026
          </Text>
          <Text style={[styles.termsHeading, { color: theme.onSurface }]}>
            1. Acceptance of Terms
          </Text>
          <Text style={[styles.termsText, { color: theme.onSurfaceVariant }]}>
            By using EchoStream AI, you agree to these Terms of Service. If you
            do not agree with these terms, please do not use the service.
          </Text>
          <Text style={[styles.termsHeading, { color: theme.onSurface }]}>
            2. Use of the Service
          </Text>
          <Text style={[styles.termsText, { color: theme.onSurfaceVariant }]}>
            EchoStream AI provides tools for processing, transforming, and
            generating audio content. You are responsible for how you use the
            generated content and the service.
          </Text>
          <Text style={[styles.termsHeading, { color: theme.onSurface }]}>
            3. Your Account
          </Text>
          <Text style={[styles.termsText, { color: theme.onSurfaceVariant }]}>
            You are responsible for maintaining the security of your account
            credentials and for activities performed through your account.
          </Text>
          <Text style={[styles.termsHeading, { color: theme.onSurface }]}>
            4. Prohibited Use
          </Text>
          <Text style={[styles.termsText, { color: theme.onSurfaceVariant }]}>
            You may not use EchoStream AI for unlawful, abusive, fraudulent, or
            harmful activities. You must comply with applicable laws when using
            the service.
          </Text>
          <Text style={[styles.termsHeading, { color: theme.onSurface }]}>
            5. Subscriptions
          </Text>
          <Text style={[styles.termsText, { color: theme.onSurfaceVariant }]}>
            Paid subscriptions may provide additional features, usage limits,
            and capabilities. Subscription terms and pricing may change from
            time to time.
          </Text>
          <Text style={[styles.termsHeading, { color: theme.onSurface }]}>
            6. Changes to These Terms
          </Text>
          <Text style={[styles.termsText, { color: theme.onSurfaceVariant }]}>
            We may update these terms when necessary. Continued use of
            EchoStream AI after changes take effect means you accept the updated
            terms.
          </Text>
          <Text style={[styles.termsHeading, { color: theme.onSurface }]}>
            7. Contact
          </Text>
          <Text style={[styles.termsText, { color: theme.onSurfaceVariant }]}>
            If you have questions about these Terms of Service, please contact
            our support team.
          </Text>
        </View>
      </BottomSheet>
      <BottomSheet
        visible={activeSheet === "Language"}
        title="Language"
        icon="globe-outline"
        onClose={closeSheet}
      >
        <Text style={[styles.sheetIntro, { color: theme.onSurfaceVariant }]}>
          Choose the language used throughout the app.
        </Text>
        <SheetOption
          icon="language-outline"
          title="English"
          description="English"
          selected={selectedLanguage === "English"}
          onPress={() => {
            setSelectedLanguage("English");
            closeSheet();
          }}
        />
        <SheetOption
          icon="language-outline"
          title="French"
          description="Français"
          selected={selectedLanguage === "French"}
          onPress={() => {
            setSelectedLanguage("French");
            closeSheet();
          }}
        />
        <SheetOption
          icon="language-outline"
          title="Spanish"
          description="Español"
          selected={selectedLanguage === "Spanish"}
          onPress={() => {
            setSelectedLanguage("Spanish");
            closeSheet();
          }}
        />
        <SheetOption
          icon="language-outline"
          title="German"
          description="Deutsch"
          selected={selectedLanguage === "German"}
          onPress={() => {
            setSelectedLanguage("German");
            closeSheet();
          }}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topAmbientGlow: {
    position: "absolute",
    top: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.45,
    borderRadius: width,
  },
  bottomAmbientGlow: {
    position: "absolute",
    bottom: -60,
    alignSelf: "center",
    width: width * 1.2,
    height: height * 0.35,
    borderRadius: width,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    width: "100%",
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  headerIconSlot: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
  scrollContentTablet: { alignSelf: "center", width: "100%", maxWidth: 760 },
  tabletContentWidth: { width: "100%" },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarInitials: { fontSize: 17, fontWeight: "800" },
  profileText: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },
  profileEmail: { fontSize: 12.5 },
  creditsWrapper: { marginBottom: 20 },
  creditsCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  creditsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  creditsLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 5,
  },
  creditsTitle: { fontSize: 18, fontWeight: "800" },
  creditsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  creditsBadgeText: { fontSize: 10, fontWeight: "800" },
  creditsDivider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  creditsUsageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  creditsUsageLabel: { fontSize: 12 },
  creditsUsageValue: { fontSize: 12, fontWeight: "700" },
  creditsProgressTrack: { height: 6, borderRadius: 10, overflow: "hidden" },
  creditsProgressFill: { height: "100%", borderRadius: 10 },
  proWrapper: { marginBottom: 24 },
  menuCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  menuCardTablet: { width: "100%" },
  logoutWrapper: { marginBottom: 16 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
  },
  logoutText: { fontSize: 15, fontWeight: "700" },
  version: { fontSize: 12, textAlign: "center" },
  modalRoot: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  bottomSheet: { borderWidth: 1, overflow: "hidden" },
  bottomSheetPhone: {
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  bottomSheetTablet: {
    width: "100%",
    maxWidth: 720,
    borderRadius: 28,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  dragArea: {
    width: "100%",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 8,
  },
  dragHandle: { width: 42, height: 4, borderRadius: 10, opacity: 0.45 },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  sheetTitleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetTitle: { fontSize: 18, fontWeight: "700" },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetContent: { padding: 20, paddingBottom: 10 },
  sheetContentTablet: {
    paddingHorizontal: 28,
    paddingTop: 22,
    paddingBottom: 20,
  },
  sheetIntro: { fontSize: 13.5, lineHeight: 20, marginBottom: 18 },
  optionRow: {
    minHeight: 68,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 12,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: { flex: 1 },
  optionTitle: { fontSize: 14.5, fontWeight: "700", marginBottom: 3 },
  optionDescription: { fontSize: 12, lineHeight: 17 },
  controlGroup: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    overflow: "hidden",
    marginBottom: 18,
  },
  settingControl: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingControlLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  controlIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  controlText: { flex: 1 },
  controlTitle: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  controlDescription: { fontSize: 11.5, lineHeight: 16 },
  actionRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 11,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 10,
  },
  switchTrack: {
    width: 42,
    height: 24,
    borderRadius: 14,
    justifyContent: "center",
  },
  switchThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  primaryAction: {
    minHeight: 52,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 18,
  },
  primaryActionText: { fontSize: 14.5, fontWeight: "800" },
  tiktokConnectCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  tiktokConnectIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  tiktokConnectTitle: { fontSize: 17, fontWeight: "700", marginBottom: 6 },
  tiktokConnectSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 6,
    marginBottom: 18,
  },
  tiktokInputRow: {
    width: "100%",
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  tiktokAtSign: { fontSize: 14, fontWeight: "700" },
  tiktokInput: { flex: 1, fontSize: 14, padding: 0 },
  connectedTikTokPill: {
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  connectedTikTokText: { fontSize: 12, fontWeight: "600" },
  tiktokConnectButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tiktokConnectButtonText: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1,
  },
  securityBadgeText: { flex: 1 },
  securityBadgeTitle: { fontSize: 13.5, fontWeight: "700", marginBottom: 3 },
  securityBadgeDescription: { fontSize: 11.5, lineHeight: 17 },
  passwordFlowCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  passwordFlowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  passwordFlowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  passwordFlowHeaderText: { flex: 1 },
  passwordFlowTitle: { fontSize: 14.5, fontWeight: "800", marginBottom: 3 },
  passwordFlowSubtitle: { fontSize: 12, lineHeight: 17 },
  passwordInputRow: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  passwordInput: { flex: 1, fontSize: 14, padding: 0 },
  passwordCodeInput: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
    textAlign: "center",
  },
  passwordHint: { fontSize: 12, marginBottom: 14 },
  passwordPrimaryButton: {
    minHeight: 52,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  passwordPrimaryButtonText: { fontSize: 14, fontWeight: "800" },
  passwordTextButton: {
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  passwordTextButtonText: { fontSize: 13, fontWeight: "700" },
  planCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 18 },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 5,
  },
  planName: { fontSize: 24, fontWeight: "800" },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  planBadgeText: { fontSize: 10, fontWeight: "800" },
  usageDivider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  usageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  usageLabel: { fontSize: 12 },
  usageValue: { fontSize: 12, fontWeight: "700" },
  progressTrack: { height: 6, borderRadius: 10, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 10 },
  supportFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 2,
  },
  supportFooterText: { fontSize: 12.5, fontWeight: "600" },
  termsContainer: { paddingBottom: 10 },
  termsUpdated: { fontSize: 11.5, marginBottom: 22 },
  termsHeading: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 8,
  },
  termsText: { fontSize: 13, lineHeight: 21, marginBottom: 14 },
});
