import PremiumBanner from '@/components/common/Premiumbanner';
import SegmentedTabs from '@/components/common/SegmentedTabs';
import Stepper from '@/components/common/Stepper';
import ToggleRow from '@/components/common/ToggleRow';
import SearchBar from '@/components/voices/SearchBar';
import { TIKTOK_GIFTS } from '@/data/sound-alerts';
import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const SELECTED_VOICE = { name: 'Donald Trump', gender: 'Male', language: 'English (United States)', isPremium: true };
const IS_PRO_USER = true;
const DEFAULT_ALLOWED_USERS = { allUsers: false, followers: true, subscribers: true, moderators: true, teamMembers: true };

type AlertItem = { id: string; giftId: string; emoji: string; label: string; enabled: boolean };
const INITIAL_ALERTS: AlertItem[] = [
  { id: '1', giftId: 'any-gift', emoji: '🎁', label: 'Any Gift', enabled: true },
  { id: '2', giftId: 'rosa', emoji: '🌹', label: 'Rosa (10 Coins)', enabled: true },
];

export default function TtsScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [allowedUsers, setAllowedUsers] = useState(DEFAULT_ALLOWED_USERS);
  const [queueAlerts, setQueueAlerts] = useState(true);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [alertQuery, setAlertQuery] = useState('');
  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
  const [convertEmojis, setConvertEmojis] = useState(true);
  const [filterProfanity, setFilterProfanity] = useState(true);
  const [requireCommand, setRequireCommand] = useState(false);
  const [commandText, setCommandText] = useState('!tts');
  const [maxMessageLength, setMaxMessageLength] = useState(200);

  const toggleAllowedUser = (key: keyof typeof allowedUsers) => setAllowedUsers(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAlert = (id: string) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  const filteredAlerts = alerts.filter(a => a.label.toLowerCase().includes(alertQuery.trim().toLowerCase()));
  const selectedGift = TIKTOK_GIFTS.find(g => g.id === selectedGiftId);
  const filteredGifts = useMemo(() => TIKTOK_GIFTS.filter(g => `${g.name} ${g.category}`.toLowerCase().includes(alertQuery.trim().toLowerCase())), [alertQuery]);

  const addGiftAlert = () => {
    if (!selectedGift) return;
    setAlerts(prev => prev.some(a => a.giftId === selectedGift.id) ? prev : [...prev, { id: `gift-${selectedGift.id}`, giftId: selectedGift.id, emoji: selectedGift.emoji, label: selectedGift.isAnyGift ? 'Any Gift' : `${selectedGift.name}${selectedGift.coins ? ` (${selectedGift.coins} Coins)` : ''}`, enabled: true }]);
    setSelectedGiftId(null);
    setAlertQuery('');
    setGiftPickerOpen(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <View style={StyleSheet.absoluteFillObject}><LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFillObject} /><LinearGradient colors={[theme.topGlow, 'transparent']} style={styles.topGlow} /><LinearGradient colors={[theme.bottomGlow, 'transparent']} style={styles.bottomGlow} /></View>
      <Animated.View entering={FadeInDown.duration(450)} style={styles.header}><MaterialCommunityIcons name="waveform" size={20} color={theme.primary} style={styles.headerIcon} /><Text style={[styles.headerTitle, { color: theme.onSurface }]}>Alerts & Sounds</Text></Animated.View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(500).delay(80)} style={styles.tabsWrapper}><SegmentedTabs tabs={['Text to speech Chat', 'Text to speech Gifts']} activeIndex={activeTab} onChange={setActiveTab} /></Animated.View>

        {activeTab === 0 ? <>
          <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>Voice settings</Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
            <Pressable onPress={() => router.push('/voice-select')} style={styles.voiceRow}><View style={styles.voiceInfo}><View style={styles.voiceNameRow}><Text style={[styles.voiceName, { color: theme.onSurface }]}>{SELECTED_VOICE.name}</Text><Text style={[styles.voiceGender, { color: theme.onSurfaceVariant }]}>({SELECTED_VOICE.gender})</Text>{SELECTED_VOICE.isPremium && <MaterialCommunityIcons name="crown" size={14} color="#FFB961" />}</View><Text style={[styles.voiceLanguage, { color: theme.onSurfaceVariant }]}>{SELECTED_VOICE.language}</Text></View><Ionicons name="chevron-forward" size={18} color={theme.onSurfaceVariant} /></Pressable>
            {SELECTED_VOICE.isPremium && !IS_PRO_USER && <PremiumBanner title="You're using a Premium Voice. Upgrade to unlock!" onPress={() => router.push('/pricing')} />}
            <View style={[styles.divider, { backgroundColor: theme.outline }]} />
            <SliderBlock label="Volume" value={volume} display={`${Math.round(volume * 100)}%`} min={0} max={1} setValue={setVolume} left="volume-medium-outline" right="volume-high-outline" theme={theme} />
            <SliderBlock label="Speed" value={speed} display={`${speed.toFixed(2)}x`} min={0.5} max={2} setValue={setSpeed} left="speedometer-outline" right="flash-outline" theme={theme} />
            <SliderBlock label="Pitch" value={pitch} display={`${pitch.toFixed(2)}x`} min={0.5} max={2} setValue={setPitch} left="musical-note-outline" right="musical-notes-outline" theme={theme} />
            <View style={[styles.divider, { backgroundColor: theme.outline }]} /><Pressable onPress={() => setIsPreviewing(v => !v)} style={[styles.previewButton, { borderColor: theme.outline }]}><Ionicons name={isPreviewing ? 'pause' : 'play'} size={16} color={theme.primary} /><Text style={[styles.previewText, { color: theme.primary }]}>{isPreviewing ? 'Playing…' : 'Voice Preview'}</Text></Pressable>
          </View>
          <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>Message Filters</Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}><ToggleRow icon={<Ionicons name="happy-outline" size={18} color={theme.onSurfaceVariant} />} label="Convert Emojis to Words" subtitle={'e.g. "🔥" becomes "fire"'} value={convertEmojis} onValueChange={setConvertEmojis} /><View style={[styles.rowDivider, { backgroundColor: theme.outline }]} /><ToggleRow icon={<Ionicons name="shield-outline" size={18} color={theme.onSurfaceVariant} />} label="Filter Profanity" subtitle="Skip messages containing blocked words" value={filterProfanity} onValueChange={setFilterProfanity} /><View style={[styles.rowDivider, { backgroundColor: theme.outline }]} /><ToggleRow icon={<Ionicons name="terminal-outline" size={18} color={theme.onSurfaceVariant} />} label="Require Command Prefix" subtitle="Only read messages that start with a command" value={requireCommand} onValueChange={setRequireCommand} />{requireCommand && <TextInput value={commandText} onChangeText={setCommandText} placeholder="!tts" placeholderTextColor={theme.onSurfaceVariant} autoCapitalize="none" autoCorrect={false} style={[styles.commandInput, { color: theme.onSurface, borderColor: theme.outline, backgroundColor: theme.surface }]} />}<View style={[styles.rowDivider, { backgroundColor: theme.outline }]} /><Stepper label="Max Message Length" value={maxMessageLength} onChange={setMaxMessageLength} min={20} max={500} step={10} unit=" chars" /></View>
          <Text style={[styles.sectionLabel, { color: theme.onSurfaceVariant }]}>Allowed Users</Text>
          <View style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>{(['allUsers','followers','subscribers','moderators','teamMembers'] as const).map((key, index) => <React.Fragment key={key}><ToggleRow label={{allUsers:'All Users',followers:'Followers',subscribers:'Subscribers',moderators:'Moderators',teamMembers:'Team Members'}[key]} value={allowedUsers[key]} onValueChange={() => toggleAllowedUser(key)} disabled={key !== 'allUsers' && allowedUsers.allUsers} bold={key === 'allUsers'} />{index < 4 && <View style={[styles.rowDivider, { backgroundColor: theme.outline }]} />}</React.Fragment>)}</View>
        </> : <>
          <View style={styles.searchWrapper}><SearchBar value={alertQuery} onChangeText={setAlertQuery} placeholder="Search alerts…" /></View>
          <View style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline, marginBottom: 14 }]}><ToggleRow label="Queue Sound Alerts (by event)" value={queueAlerts} onValueChange={setQueueAlerts} bold /></View>
          <View style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
            {filteredAlerts.map((alert, index) => <React.Fragment key={alert.id}><ToggleRow icon={<Text style={styles.alertEmoji}>{alert.emoji}</Text>} label={alert.label} value={alert.enabled} onValueChange={() => toggleAlert(alert.id)} onPress={() => router.push(`/sound-alert/${alert.id}` as any)} showChevron />{index < filteredAlerts.length - 1 && <View style={[styles.rowDivider, { backgroundColor: theme.outline }]} />}</React.Fragment>)}
            <View style={[styles.rowDivider, { backgroundColor: theme.outline }]} />
            {!giftPickerOpen ? <Pressable style={styles.addAlertButton} onPress={() => { setGiftPickerOpen(true); setAlertQuery(''); }}><Ionicons name="add-circle-outline" size={18} color={theme.primaryDim} /><Text style={[styles.addAlertText, { color: theme.primaryDim }]}>Add new Sound Alert</Text></Pressable> : <>
              <View style={styles.pickerHeader}><View style={{ flex: 1 }}><Text style={[styles.pickerTitle, { color: theme.onSurface }]}>Select a TikTok gift</Text><Text style={[styles.pickerSub, { color: theme.onSurfaceVariant }]}>Choose a gift instead of typing its name or emoji.</Text></View><Pressable onPress={() => { setGiftPickerOpen(false); setAlertQuery(''); }}><Ionicons name="close" size={20} color={theme.onSurfaceVariant} /></Pressable></View>
              <SearchBar value={alertQuery} onChangeText={setAlertQuery} placeholder="Search gifts…" />
              {filteredGifts.map((gift, index) => <React.Fragment key={gift.id}><Pressable onPress={() => setSelectedGiftId(gift.id)} style={styles.giftRow}><Text style={styles.giftEmoji}>{gift.emoji}</Text><View style={{ flex: 1 }}><Text style={[styles.giftName, { color: theme.onSurface }]}>{gift.name}</Text><Text style={[styles.giftMeta, { color: theme.onSurfaceVariant }]}>{gift.coins ? `${gift.coins} Coins` : gift.category}</Text></View>{selectedGiftId === gift.id && <Ionicons name="checkmark-circle" size={20} color={theme.primary} />}</Pressable>{index < filteredGifts.length - 1 && <View style={[styles.rowDivider, { backgroundColor: theme.outline }]} />}</React.Fragment>)}
              {selectedGift && <Pressable onPress={addGiftAlert} style={[styles.confirmGift, { backgroundColor: theme.primary }]}><Text style={[styles.confirmGiftText, { color: theme.buttonText }]}>Add {selectedGift.name}</Text></Pressable>}
            </>}
          </View>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

function SliderBlock({ label, value, display, min, max, setValue, left, right, theme }: any) { return <View style={styles.sliderBlock}><View style={styles.sliderLabelRow}><Text style={[styles.sliderLabel, { color: theme.onSurface }]}>{label}</Text><Text style={[styles.sliderValue, { color: theme.onSurfaceVariant }]}>{display}</Text></View><View style={styles.sliderRow}><Ionicons name={left} size={18} color={theme.onSurfaceVariant} /><Slider style={styles.slider} value={value} onValueChange={setValue} minimumValue={min} maximumValue={max} minimumTrackTintColor={theme.primary} maximumTrackTintColor={theme.outline} thumbTintColor={theme.primary} /><Ionicons name={right} size={18} color={theme.onSurfaceVariant} /></View></View>; }

const styles = StyleSheet.create({
  container:{flex:1}, topGlow:{position:'absolute',top:-60,alignSelf:'center',width:width*1.2,height:height*.45,borderRadius:width}, bottomGlow:{position:'absolute',bottom:-60,alignSelf:'center',width:width*1.2,height:height*.35,borderRadius:width}, header:{flexDirection:'row',alignItems:'center',justifyContent:'center',paddingVertical:16}, headerIcon:{position:'absolute',left:20}, headerTitle:{fontSize:18,fontWeight:'700'}, scrollContent:{paddingHorizontal:20,paddingBottom:140}, tabsWrapper:{marginBottom:22}, sectionLabel:{fontSize:12,fontWeight:'700',textTransform:'uppercase',letterSpacing:.4,marginBottom:10,marginTop:2}, card:{borderRadius:18,borderWidth:1,padding:16,marginBottom:22}, voiceRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, voiceInfo:{flex:1}, voiceNameRow:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:2}, voiceName:{fontSize:15,fontWeight:'700'}, voiceGender:{fontSize:12.5}, voiceLanguage:{fontSize:12}, divider:{height:StyleSheet.hairlineWidth,marginVertical:16}, sliderBlock:{marginBottom:14}, sliderLabelRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:4}, sliderLabel:{fontSize:13,fontWeight:'600'}, sliderValue:{fontSize:12,fontWeight:'600'}, sliderRow:{flexDirection:'row',alignItems:'center',gap:8}, slider:{flex:1,height:32}, previewButton:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:12,borderRadius:12,borderWidth:1}, previewText:{fontSize:13,fontWeight:'700'}, rowDivider:{height:StyleSheet.hairlineWidth}, commandInput:{borderWidth:1,borderRadius:10,paddingHorizontal:12,paddingVertical:10,fontSize:13,marginTop:4,marginBottom:12}, searchWrapper:{marginBottom:14}, alertEmoji:{fontSize:17}, addAlertButton:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,paddingVertical:14}, addAlertText:{fontSize:13,fontWeight:'700'}, pickerHeader:{flexDirection:'row',alignItems:'center',marginBottom:12,gap:12}, pickerTitle:{fontSize:14,fontWeight:'800'}, pickerSub:{fontSize:11,lineHeight:16,marginTop:3}, giftRow:{minHeight:58,flexDirection:'row',alignItems:'center',gap:12}, giftEmoji:{fontSize:25,width:34,textAlign:'center'}, giftName:{fontSize:13,fontWeight:'700'}, giftMeta:{fontSize:11,marginTop:2}, confirmGift:{borderRadius:12,alignItems:'center',paddingVertical:12,marginTop:14}, confirmGiftText:{fontSize:13,fontWeight:'800'}
});
