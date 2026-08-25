import PremiumBanner from '@/components/common/Premiumbanner';
import SegmentedTabs from '@/components/common/SegmentedTabs';
import Stepper from '@/components/common/Stepper';
import ToggleRow from '@/components/common/ToggleRow';
import SearchBar from '@/components/voices/SearchBar';
import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// Mock state — wire up to your real store/API
const SELECTED_VOICE = {
  name: 'Donald Trump',
  gender: 'Male',
  language: 'English (United States)',
  isPremium: true,
};
const IS_PRO_USER = true;

const DEFAULT_ALLOWED_USERS = {
  allUsers: false,
  followers: true,
  subscribers: true,
  moderators: true,
  teamMembers: true,
};

interface SoundAlert {
  id: string;
  emoji: string;
  label: string;
  enabled: boolean;
  editable: boolean;
}

const INITIAL_SOUND_ALERTS: SoundAlert[] = [
  { id: '1', emoji: '🎁', label: 'Any Gift', enabled: true, editable: true },
  { id: '2', emoji: '🌹', label: 'Rosa (10 Coins)', enabled: true, editable: true },

  { id: '3', emoji: '🎁', label: 'Any Gift', enabled: true, editable: true },
  { id: '4', emoji: '🚫', label: 'Follow', enabled: false, editable: true },
];

export default function TtsScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(0); // 0 = Chat, 1 = Gifts
  const [volume, setVolume] = useState(0.7);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [allowedUsers, setAllowedUsers] = useState(DEFAULT_ALLOWED_USERS);
  const [queueAlerts, setQueueAlerts] = useState(true);
  const [alerts, setAlerts] = useState(INITIAL_SOUND_ALERTS);
  const [alertQuery, setAlertQuery] = useState('');

  // New: message customization
  const [announceUsername, setAnnounceUsername] = useState(true);
  const [convertEmojis, setConvertEmojis] = useState(true);
  const [filterProfanity, setFilterProfanity] = useState(true);
  const [requireCommand, setRequireCommand] = useState(false);
  const [commandText, setCommandText] = useState('!tts');
  const [maxMessageLength, setMaxMessageLength] = useState(200);

  const toggleAllowedUser = (key: keyof typeof allowedUsers) =>
    setAllowedUsers((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleAlert = (id: string) =>
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)));

  const filteredAlerts = alerts.filter((a) => a.label.toLowerCase().includes(alertQuery.trim().toLowerCase()));

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
        <MaterialCommunityIcons name="waveform" size={20} color={theme.primary} style={styles.headerIcon} />
        <Text style={[styles.headerTitle, { color: theme.onSurface }]}>Alerts & Sounds</Text>
        <View style={{ width: 20 }} />
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tabs */}
        <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.tabsWrapper}>
          <SegmentedTabs tabs={['Text to speech Chat', 'Text to speech Gifts']} activeIndex={activeTab} onChange={setActiveTab} />
        </Animated.View>

        {activeTab === 0 ? (
          <>
            {/* Voice settings */}
            <Animated.Text
              entering={FadeInUp.duration(450).delay(140)}
              style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
            >
              Voice settings
            </Animated.Text>

            <Animated.View
              entering={FadeInUp.duration(500).delay(180)}
              style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}
            >
              <Pressable onPress={() => router.push('/voice-select')} style={styles.voiceRow}>
                <View style={styles.voiceInfo}>
                  <View style={styles.voiceNameRow}>
                    <Text style={[styles.voiceName, { color: theme.onSurface }]}>{SELECTED_VOICE.name}</Text>
                    <Text style={[styles.voiceGender, { color: theme.onSurfaceVariant }]}>
                      ({SELECTED_VOICE.gender})
                    </Text>
                    {SELECTED_VOICE.isPremium && (
                      <MaterialCommunityIcons name="crown" size={14} color="#FFB961" />
                    )}
                  </View>
                  <Text style={[styles.voiceLanguage, { color: theme.onSurfaceVariant }]}>
                    {SELECTED_VOICE.language}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.onSurfaceVariant} />
              </Pressable>

              {SELECTED_VOICE.isPremium && !IS_PRO_USER && (
                <View style={styles.premiumBannerWrapper}>
                  <PremiumBanner
                    title="You're using a Premium Voice. Upgrade to unlock!"
                    onPress={() => router.push('/pricing')}
                  />
                </View>
              )}

              <View style={[styles.divider, { backgroundColor: theme.outline }]} />

              {/* Volume */}
              <View style={styles.sliderLabelRow}>
                <Text style={[styles.sliderLabel, { color: theme.onSurface }]}>Volume</Text>
                <Text style={[styles.sliderValue, { color: theme.onSurfaceVariant }]}>
                  {Math.round(volume * 100)}%
                </Text>
              </View>
              <View style={styles.sliderRow}>
                <Ionicons name="volume-medium-outline" size={18} color={theme.onSurfaceVariant} />
                <Slider
                  style={styles.slider}
                  value={volume}
                  onValueChange={setVolume}
                  minimumValue={0}
                  maximumValue={1}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.outline}
                  thumbTintColor={theme.primary}
                />
                <Ionicons name="volume-high-outline" size={18} color={theme.onSurfaceVariant} />
              </View>

              {/* Speed */}
              <View style={[styles.sliderLabelRow, { marginTop: 16 }]}>
                <Text style={[styles.sliderLabel, { color: theme.onSurface }]}>Speed</Text>
                <Text style={[styles.sliderValue, { color: theme.onSurfaceVariant }]}>{speed.toFixed(2)}x</Text>
              </View>
              <View style={styles.sliderRow}>
                <Ionicons name="speedometer-outline" size={18} color={theme.onSurfaceVariant} />
                <Slider
                  style={styles.slider}
                  value={speed}
                  onValueChange={setSpeed}
                  minimumValue={0.5}
                  maximumValue={2}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.outline}
                  thumbTintColor={theme.primary}
                />
                <Ionicons name="flash-outline" size={18} color={theme.onSurfaceVariant} />
              </View>

              {/* Pitch */}
              <View style={[styles.sliderLabelRow, { marginTop: 16 }]}>
                <Text style={[styles.sliderLabel, { color: theme.onSurface }]}>Pitch</Text>
                <Text style={[styles.sliderValue, { color: theme.onSurfaceVariant }]}>{pitch.toFixed(2)}x</Text>
              </View>
              <View style={styles.sliderRow}>
                <Ionicons name="musical-note-outline" size={18} color={theme.onSurfaceVariant} />
                <Slider
                  style={styles.slider}
                  value={pitch}
                  onValueChange={setPitch}
                  minimumValue={0.5}
                  maximumValue={2}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.outline}
                  thumbTintColor={theme.primary}
                />
                <Ionicons name="musical-notes-outline" size={18} color={theme.onSurfaceVariant} />
              </View>

              <View style={[styles.divider, { backgroundColor: theme.outline, marginTop: 18 }]} />

              <Pressable
                onPress={() => setIsPreviewing((v) => !v)}
                style={[styles.previewButton, { borderColor: theme.outline }]}
              >
                <Ionicons name={isPreviewing ? 'pause' : 'play'} size={16} color={theme.primary} />
                <Text style={[styles.previewText, { color: theme.primary }]}>
                  {isPreviewing ? 'Playing…' : 'Voice Preview'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Message filters */}
            <Animated.Text
              entering={FadeInUp.duration(450).delay(220)}
              style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
            >
              Message Filters
            </Animated.Text>
            <Animated.View
              entering={FadeInUp.duration(500).delay(260)}
              style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}
            >
              
              <ToggleRow
                icon={<Ionicons name="happy-outline" size={18} color={theme.onSurfaceVariant} />}
                label="Convert Emojis to Words"
                subtitle={'e.g. "🔥" becomes "fire"'}
                value={convertEmojis}
                onValueChange={setConvertEmojis}
              />
              <View style={[styles.rowDivider, { backgroundColor: theme.outline }]} />
              <ToggleRow
                icon={<Ionicons name="shield-outline" size={18} color={theme.onSurfaceVariant} />}
                label="Filter Profanity"
                subtitle="Skip messages containing blocked words"
                value={filterProfanity}
                onValueChange={setFilterProfanity}
              />
              <View style={[styles.rowDivider, { backgroundColor: theme.outline }]} />

              <ToggleRow
                icon={<Ionicons name="terminal-outline" size={18} color={theme.onSurfaceVariant} />}
                label="Require Command Prefix"
                subtitle="Only read messages that start with a command"
                value={requireCommand}
                onValueChange={setRequireCommand}
              />
              {requireCommand && (
                <TextInput
                  value={commandText}
                  onChangeText={setCommandText}
                  placeholder="!tts"
                  placeholderTextColor={theme.onSurfaceVariant}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.commandInput,
                    { color: theme.onSurface, borderColor: theme.outline, backgroundColor: theme.surface },
                  ]}
                />
              )}

              <View style={[styles.rowDivider, { backgroundColor: theme.outline, marginTop: requireCommand ? 4 : 0 }]} />
              <Stepper
                label="Max Message Length"
                value={maxMessageLength}
                onChange={setMaxMessageLength}
                min={20}
                max={500}
                step={10}
                unit=" chars"
              />
            </Animated.View>

            {/* Allowed users */}
            <Animated.Text
              entering={FadeInUp.duration(450).delay(300)}
              style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}
            >
              Allowed Users
            </Animated.Text>
            <Animated.View
              entering={FadeInUp.duration(500).delay(340)}
              style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}
            >
              <ToggleRow
                label="All Users"
                value={allowedUsers.allUsers}
                onValueChange={() => toggleAllowedUser('allUsers')}
                bold
              />
              <View style={[styles.rowDivider, { backgroundColor: theme.outline }]} />
              <ToggleRow
                label="Followers"
                value={allowedUsers.followers}
                onValueChange={() => toggleAllowedUser('followers')}
                disabled={allowedUsers.allUsers}
              />
              <View style={[styles.rowDivider, { backgroundColor: theme.outline }]} />
              <ToggleRow
                label="Subscribers"
                value={allowedUsers.subscribers}
                onValueChange={() => toggleAllowedUser('subscribers')}
                disabled={allowedUsers.allUsers}
              />
              <View style={[styles.rowDivider, { backgroundColor: theme.outline }]} />
              <ToggleRow
                label="Moderators"
                value={allowedUsers.moderators}
                onValueChange={() => toggleAllowedUser('moderators')}
                disabled={allowedUsers.allUsers}
              />
              <View style={[styles.rowDivider, { backgroundColor: theme.outline }]} />
              <ToggleRow
                label="Team Members"
                value={allowedUsers.teamMembers}
                onValueChange={() => toggleAllowedUser('teamMembers')}
                disabled={allowedUsers.allUsers}
              />
            </Animated.View>
          </>
        ) : (
          <>
            {/* Gifts tab */}
            <Animated.View entering={FadeInUp.duration(450).delay(140)} style={styles.searchWrapper}>
              <SearchBar value={alertQuery} onChangeText={setAlertQuery} placeholder="Search…" />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(500).delay(180)}
              style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline, marginBottom: 14 }]}
            >
              <ToggleRow
                label="Queue Sound Alerts (by event)"
                value={queueAlerts}
                onValueChange={setQueueAlerts}
                bold
              />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(500).delay(220)}
              style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}
            >
              {filteredAlerts.map((alert, index) => (
                <View key={alert.id}>
                  <ToggleRow
                    icon={<Text style={styles.alertEmoji}>{alert.emoji}</Text>}
                    label={alert.label}
                    value={alert.enabled}
                    onValueChange={() => toggleAlert(alert.id)}
                    onPress={() => router.push(`/sound-alert/${alert.id}` as any)}
                    showChevron
                  />
                  {index < filteredAlerts.length - 1 && (
                    <View style={[styles.rowDivider, { backgroundColor: theme.outline }]} />
                  )}
                </View>
              ))}

              <View style={[styles.rowDivider, { backgroundColor: theme.outline }]} />
              <Pressable style={styles.addAlertButton} onPress={() => router.push('/sound-alert/new' as any)}>
                <Ionicons name="add-circle-outline" size={18} color={theme.primaryDim} />
                <Text style={[styles.addAlertText, { color: theme.primaryDim }]}>Add new Sound Alert</Text>
              </Pressable>
            </Animated.View>
          </>
        )}
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
  tabsWrapper: {
    marginBottom: 22,
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
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voiceInfo: { flex: 1 },
  voiceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  voiceName: { fontSize: 15, fontWeight: '700' },
  voiceGender: { fontSize: 12.5 },
  voiceLanguage: { fontSize: 12 },
  premiumBannerWrapper: {
    marginTop: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 16,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sliderLabel: { fontSize: 13, fontWeight: '600' },
  sliderValue: { fontSize: 12, fontWeight: '600' },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 32,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewText: { fontSize: 13, fontWeight: '700' },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
  },
  commandInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  searchWrapper: {
    marginBottom: 14,
  },
  addAlertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  addAlertText: { fontSize: 13, fontWeight: '700' },
  alertEmoji: { fontSize: 17 },
});