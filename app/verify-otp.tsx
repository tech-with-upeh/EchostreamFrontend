import { useAppTheme } from "@/hooks/use-theme-color";
import { resendVerification, setAuthTokens, verifyEmailCode } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import AuthShell from "@/components/AuthShell";

const RESEND_SECONDS = 60;

export default function VerifyOtpScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === "string" ? params.email : "";
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!email) {
      Alert.alert("Missing email", "Please start registration again.");
      router.replace("/login");
    }
  }, [email, router]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleVerify = async () => {
    const normalizedCode = code.replace(/\D/g, "");
    if (normalizedCode.length !== 6) {
      Alert.alert("Invalid code", "Enter the 6-digit verification code sent to your email.");
      return;
    }
    try {
      setVerifying(true);
      const result = await verifyEmailCode(email, normalizedCode);
      if (!result.access_token || !result.refresh_token) throw new Error("Verification succeeded but the server did not return a session.");
      setAuthTokens(result);
      router.replace("/(dashboard)");
    } catch (error) {
      Alert.alert("Verification failed", error instanceof Error ? error.message : "Unable to verify your email. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resending || secondsLeft > 0) return;
    try {
      setResending(true);
      await resendVerification(email);
      setSecondsLeft(RESEND_SECONDS);
      setCode("");
      Alert.alert("Code sent", "A new verification code has been sent to your email.");
    } catch (error) {
      Alert.alert("Couldn't resend code", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell showBack onBack={() => router.replace("/login")} aboveSheet={
      <View style={styles.header}>
        <View style={[styles.icon, { backgroundColor: theme.surfaceVariant }]}>
          <Ionicons name="mail-outline" size={28} color={theme.primary} />
        </View>
        <Text style={[styles.title, { color: theme.onSurface }]}>Verify your email</Text>
        <Text style={[styles.subtitle, { color: theme.onSurfaceVariant }]}>We sent a 6-digit code to</Text>
        <Text style={[styles.email, { color: theme.onSurface }]}>{email}</Text>
      </View>
    }>
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>Verification code</Text>
        <Pressable onPress={() => inputRef.current?.focus()} style={[styles.codeBox, { borderColor: theme.outline, backgroundColor: theme.surfaceVariant }]}>
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            style={[styles.codeInput, { color: theme.onSurface }]}
            placeholder="000000"
            placeholderTextColor={theme.onSurfaceVariant}
          />
        </Pressable>
        <Text style={[styles.helper, { color: theme.onSurfaceVariant }]}>Check your inbox and spam folder if you don't see it.</Text>

        <Pressable disabled={verifying} onPress={handleVerify} style={[styles.button, { backgroundColor: theme.primary, opacity: verifying ? 0.65 : 1 }]}>
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>{verifying ? "Verifying..." : "Verify Email"}</Text>
        </Pressable>

        <View style={styles.resendRow}>
          <Text style={[styles.resendText, { color: theme.onSurfaceVariant }]}>Didn't receive a code?</Text>
          <Pressable disabled={resending || secondsLeft > 0} onPress={handleResend}>
            <Text style={[styles.resendButton, { color: secondsLeft > 0 ? theme.onSurfaceVariant : theme.primary }]}>
              {resending ? "Sending..." : secondsLeft > 0 ? `Resend in ${secondsLeft}s` : "Resend code"}
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingBottom: 20 },
  icon: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: "700" },
  subtitle: { marginTop: 9, fontSize: 14 },
  email: { marginTop: 4, fontSize: 15, fontWeight: "700" },
  content: { gap: 10 },
  label: { fontSize: 13, fontWeight: "600" },
  codeBox: { height: 64, borderWidth: 1, borderRadius: 16, justifyContent: "center" },
  codeInput: { textAlign: "center", fontSize: 28, fontWeight: "700", letterSpacing: 8, paddingHorizontal: 12 },
  helper: { fontSize: 12, lineHeight: 18, marginBottom: 10 },
  button: { height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", marginTop: 6 },
  buttonText: { fontSize: 16, fontWeight: "700" },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5, marginTop: 12 },
  resendText: { fontSize: 13 },
  resendButton: { fontSize: 13, fontWeight: "700" },
});
