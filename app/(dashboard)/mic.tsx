import PremiumBanner from '@/components/common/Premiumbanner';
import Stepper from '@/components/common/Stepper';
import ToggleRow from '@/components/common/ToggleRow';
import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Mock state — wire up to your real store/API
const IS_PRO_USER = true;
const HAS_CLONED_VOICE = true; // becomes true once a sample has been recorded

const DEFAULT_ALLOWED_USERS = {
  allUsers: false,
  followers: true,
  subscribers: true,
  moderators: true,
  teamMembers: true,
};

export default function MicScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const [allowedUsers, setAllowedUsers] = useState(DEFAULT_ALLOWED_USERS);
  const [prefixEnabled, setPrefixEnabled] = useState(true);
  const [prefixText, setPrefixText] = useState('Someone said:');
  const [useClonedVoice, setUseClonedVoice] = useState(false);

  // New: comment restrictions
  const [minAccountAgeDays, setMinAccountAgeDays] = useState(7);
  const [mustBeFollowing, setMustBeFollowing] = useState(false);
  const [blockedWordsEnabled, setBlockedWordsEnabled] = useState(true);
  const [blockedWords, setBlockedWords] = useState('spam, scam, giveaway');

  const [spamProtection, setSpamProtection] = useState(true);
  const [cooldown, setCooldown] = useState(5);
  const [maxPerMinute, setMaxPerMinute] = useState(10);
  const [blockRepeats, setBlockRepeats] = useState(true);
  const [autoMute, setAutoMute] = useState(false);
  const [violationsBeforeMute, setViolationsBeforeMute] = useState(3);

  const toggleAllowedUser = (key: keyof typeof allowedUsers) =>
    setAllowedUsers((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
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

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
        <Ionicons name="mic" size={19} color={theme.primary} style={styles.headerIcon} />
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>Mic & Safety</Text>
        <View style={{ width: 19 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Voice cloning */}
        <Animated.Text
          entering={FadeInUp.duration(450).delay(100)}
          style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
        >
          Voice Cloning
        </Animated.Text>
        <Animated.View
          entering={FadeInUp.duration(500).delay(140)}
          style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}
        >
          <View style={styles.cloneHeader}>
            <View style={[styles.cloneIcon, { backgroundColor: theme.surface }]}>
              <Ionicons name="mic-circle-outline" size={26} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cloneTitle, { color: theme.onSurface }]}>Clone Your Voice</Text>
              <Text style={[styles.cloneSubtitle, { color: theme.onSurfaceVariant }]}>
                Record a short sample and let AI speak in your own voice.
              </Text>
            </View>
          </View>

          {IS_PRO_USER ? (
            <>
              <Pressable style={[styles.recordButton, { backgroundColor: theme.primary }]}>
                <Ionicons name="radio-button-on" size={16} color={theme.buttonText} />
                <Text style={[styles.recordButtonText, { color: theme.buttonText }]}>Record Voice Sample</Text>
              </Pressable>

              {HAS_CLONED_VOICE && (
                <>
                  <View style={[styles.divider, { backgroundColor: theme.outline }]} />
                  <ToggleRow
                    icon={<Ionicons name="person-circle-outline" size={18} color={theme.onSurfaceVariant} />}
                    label="Use My Cloned Voice for Replies"
                    subtitle="Otherwise your selected TTS voice is used"
                    value={useClonedVoice}
                    onValueChange={setUseClonedVoice}
                  />
                </>
              )}

              <View style={[styles.divider, { backgroundColor: theme.outline }]} />
              <Pressable
                onPress={() => router.push('/voice-samples' as any)}
                style={styles.manageRow}
              >
                <Text style={[styles.manageRowText, { color: theme.onSurface }]}>Manage Voice Samples</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.onSurfaceVariant} />
              </Pressable>
            </>
          ) : (
            <View style={styles.premiumBannerWrapper}>
              <PremiumBanner
                title="Clone your own voice with Premium!"
                onPress={() => router.push('/pricing')}
              />
            </View>
          )}
        </Animated.View>

        {/* Sound prefix */}
        <Animated.Text
          entering={FadeInUp.duration(450).delay(180)}
          style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
        >
          Sound Prefix
        </Animated.Text>
        <Animated.View
          entering={FadeInUp.duration(500).delay(220)}
          style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}
        >
          <ToggleRow
            icon={<Ionicons name="text-outline" size={18} color={theme.onSurfaceVariant} />}
            label="Add Prefix Before Speech"
            subtitle="Announce who triggered the message"
            value={prefixEnabled}
            onValueChange={setPrefixEnabled}
          />

          {prefixEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.outline }]} />
              <TextInput
                value={prefixText}
                onChangeText={setPrefixText}
                placeholder="e.g. Someone said:"
                placeholderTextColor={theme.onSurfaceVariant}
                style={[styles.prefixInput, { color: theme.onSurface, borderColor: theme.outline, backgroundColor: theme.surface }]}
              />
              <Text style={[styles.prefixPreview, { color: theme.onSurfaceVariant }]}>
                Preview: “{prefixText || '…'} Great stream today!”
              </Text>
            </>
          )}
        </Animated.View>

        {/* Allowed users */}
        <Animated.Text
          entering={FadeInUp.duration(450).delay(260)}
          style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
        >
          Who Can Trigger Voice Replies
        </Animated.Text>
        <Animated.View
          entering={FadeInUp.duration(500).delay(300)}
          style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}
        >
          <ToggleRow
            label="All Users"
            value={allowedUsers.allUsers}
            onValueChange={() => toggleAllowedUser('allUsers')}
            bold
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            label="Followers"
            value={allowedUsers.followers}
            onValueChange={() => toggleAllowedUser('followers')}
            disabled={allowedUsers.allUsers}
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            label="Subscribers"
            value={allowedUsers.subscribers}
            onValueChange={() => toggleAllowedUser('subscribers')}
            disabled={allowedUsers.allUsers}
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            label="Moderators"
            value={allowedUsers.moderators}
            onValueChange={() => toggleAllowedUser('moderators')}
            disabled={allowedUsers.allUsers}
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            label="Team Members"
            value={allowedUsers.teamMembers}
            onValueChange={() => toggleAllowedUser('teamMembers')}
            disabled={allowedUsers.allUsers}
          />
        </Animated.View>

        {/* Restrict comments — moderation, distinct from who can trigger the mic feature above */}
        <Animated.Text
          entering={FadeInUp.duration(450).delay(340)}
          style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
        >
          Restrict Comments
        </Animated.Text>
        <Animated.View
          entering={FadeInUp.duration(500).delay(380)}
          style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}
        >
          <Stepper
            label="Minimum Account Age"
            value={minAccountAgeDays}
            onChange={setMinAccountAgeDays}
            min={0}
            max={365}
            step={1}
            unit="d"
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            icon={<Ionicons name="people-outline" size={18} color={theme.onSurfaceVariant} />}
            label="Must Be Following You"
            value={mustBeFollowing}
            onValueChange={setMustBeFollowing}
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            icon={<Ionicons name="ban-outline" size={18} color={theme.onSurfaceVariant} />}
            label="Blocked Words List"
            subtitle="Comments containing these are ignored"
            value={blockedWordsEnabled}
            onValueChange={setBlockedWordsEnabled}
          />
          {blockedWordsEnabled && (
            <TextInput
              value={blockedWords}
              onChangeText={setBlockedWords}
              placeholder="word1, word2, word3"
              placeholderTextColor={theme.onSurfaceVariant}
              autoCapitalize="none"
              style={[styles.prefixInput, { color: theme.onSurface, borderColor: theme.outline, backgroundColor: theme.surface, marginTop: 4 }]}
            />
          )}
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <Pressable onPress={() => router.push('/muted-users' as any)} style={styles.manageRow}>
            <Text style={[styles.manageRowText, { color: theme.onSurface }]}>Manage Muted Users</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.onSurfaceVariant} />
          </Pressable>
        </Animated.View>

        {/* Spam protection */}
        <Animated.Text
          entering={FadeInUp.duration(450).delay(420)}
          style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
        >
          Spam Protection
        </Animated.Text>
        <Animated.View
          entering={FadeInUp.duration(500).delay(460)}
          style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}
        >
          <ToggleRow
            icon={<Ionicons name="shield-checkmark-outline" size={18} color={theme.onSurfaceVariant} />}
            label="Enable Spam Protection"
            value={spamProtection}
            onValueChange={setSpamProtection}
            bold
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <Stepper
            label="Cooldown Between Requests"
            value={cooldown}
            onChange={setCooldown}
            min={0}
            max={60}
            step={1}
            unit="s"
            disabled={!spamProtection}
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <Stepper
            label="Max Requests / Minute"
            value={maxPerMinute}
            onChange={setMaxPerMinute}
            min={1}
            max={60}
            step={1}
            disabled={!spamProtection}
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            label="Block Repeated Words"
            subtitle="Ignore identical requests sent back-to-back"
            value={blockRepeats}
            onValueChange={setBlockRepeats}
            disabled={!spamProtection}
          />
          <View style={[styles.divider, { backgroundColor: theme.outline }]} />
          <ToggleRow
            icon={<Ionicons name="volume-mute-outline" size={18} color={theme.onSurfaceVariant} />}
            label="Auto-Mute Repeat Offenders"
            subtitle="Temporarily mute users who trip spam limits"
            value={autoMute}
            onValueChange={setAutoMute}
            disabled={!spamProtection}
          />
          {spamProtection && autoMute && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.outline }]} />
              <Stepper
                label="Violations Before Mute"
                value={violationsBeforeMute}
                onChange={setViolationsBeforeMute}
                min={1}
                max={10}
                step={1}
              />
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  headerIcon: {
    position: 'absolute',
    left: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 140,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 22,
  },
  cloneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  cloneIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloneTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  cloneSubtitle: { fontSize: 12, lineHeight: 17 },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  recordButtonText: { fontSize: 13, fontWeight: '700' },
  premiumBannerWrapper: {},
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  manageRowText: { fontSize: 13.5, fontWeight: '600' },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  prefixInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginTop: 12,
    marginBottom: 8,
  },
  prefixPreview: {
    fontSize: 11.5,
    fontStyle: 'italic',
  },
});