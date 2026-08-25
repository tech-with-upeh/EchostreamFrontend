import ToggleRow from '@/components/common/ToggleRow';
import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SYSTEM_SOUNDS, TIKTOK_GIFTS, GiftOption, SystemSound } from '@/data/sound-alerts';

const { width, height } = Dimensions.get('window');
const ALERTS: Record<string, { giftId: string; name: string; emoji: string; coins?: number }> = {
  '1': { giftId: 'any-gift', name: 'Any Gift', emoji: '🎁' },
  '2': { giftId: 'rosa', name: 'Rosa', emoji: '🌹', coins: 10 },
  '3': { giftId: 'any-gift', name: 'Any Gift', emoji: '🎁' },
  '4': { giftId: 'follow', name: 'Follow', emoji: '🚫' },
};

type AudioMode = 'tts' | 'system' | 'custom';

export default function SoundAlertScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const initial = ALERTS[id ?? ''] ?? { giftId: 'any-gift', name: 'Any Gift', emoji: '🎁' };
  const initialGift = TIKTOK_GIFTS.find(g => g.id === initial.giftId) ?? ({ id: initial.giftId, name: initial.name, emoji: initial.emoji, coins: initial.coins, category: 'Gift' } as GiftOption);
  const [gift, setGift] = useState<GiftOption>(initialGift);
  const [mode, setMode] = useState<AudioMode>('system');
  const [enabled, setEnabled] = useState(true);
  const [giftSearch, setGiftSearch] = useState('');
  const [soundSearch, setSoundSearch] = useState('');
  const [giftListOpen, setGiftListOpen] = useState(false);
  const [soundListOpen, setSoundListOpen] = useState(false);
  const [selectedSound, setSelectedSound] = useState<SystemSound | null>(null);
  const [customSound, setCustomSound] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [previewingSound, setPreviewingSound] = useState<string | null>(null);

  const filteredGifts = useMemo(() => TIKTOK_GIFTS.filter(g => `${g.name} ${g.category}`.toLowerCase().includes(giftSearch.trim().toLowerCase())), [giftSearch]);
  const filteredSounds = useMemo(() => SYSTEM_SOUNDS.filter(s => `${s.name} ${s.description}`.toLowerCase().includes(soundSearch.trim().toLowerCase())), [soundSearch]);
  const pickSound = async () => { const result = await DocumentPicker.getDocumentAsync({ type: ['audio/*'], copyToCacheDirectory: true, multiple: false }); if (!result.canceled) setCustomSound(result.assets[0]); };
  const selectGift = (g: GiftOption) => { setGift(g); setGiftListOpen(false); setGiftSearch(''); };
  const selectSystemSound = (s: SystemSound) => { setSelectedSound(s); setSoundListOpen(false); setSoundSearch(''); setPreviewingSound(null); };
  const save = () => { if (mode === 'system' && !selectedSound) return Alert.alert('Select a sound', 'Choose one of EchoStream’s built-in sounds.'); if (mode === 'custom' && !customSound) return Alert.alert('Missing sound', 'Upload an audio file for this custom sound alert.'); Alert.alert('Saved', 'Your sound alert configuration is ready to connect to the backend.', [{ text: 'Done', onPress: () => router.back() }]); };
  const modes: { id: AudioMode; title: string; subtitle: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { id: 'tts', title: 'Text to Speech', subtitle: 'Generate speech for this gift.', icon: 'chatbubble-ellipses-outline' },
    { id: 'system', title: 'System Sound', subtitle: 'Use an EchoStream built-in sound.', icon: 'musical-notes-outline' },
    { id: 'custom', title: 'Custom Audio', subtitle: 'Play your uploaded audio file.', icon: 'cloud-upload-outline' },
  ];

  return <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top','left','right']}>
    <View style={StyleSheet.absoluteFillObject}><LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFillObject} /><LinearGradient colors={[theme.topGlow,'transparent']} style={styles.topGlow} /></View>
    <View style={styles.header}><Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="arrow-back" size={22} color={theme.onSurface} /></Pressable><Text style={[styles.title,{color:theme.onSurface}]}>Sound Alert</Text><Pressable onPress={() => Alert.alert('Delete alert?','This will remove the alert configuration.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>router.back()}])}><Ionicons name="trash-outline" size={20} color={theme.onSurfaceVariant}/></Pressable></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.label,{color:theme.onSurfaceVariant}]}>TikTok gift</Text>
      <View style={[styles.card,{backgroundColor:theme.surfaceVariant,borderColor:theme.outline}]}>
        <Pressable onPress={()=>setGiftListOpen(v=>!v)} style={styles.selected}><Text style={styles.bigEmoji}>{gift.emoji}</Text><View style={{flex:1}}><Text style={[styles.selectedName,{color:theme.onSurface}]}>{gift.name}</Text><Text style={[styles.meta,{color:theme.onSurfaceVariant}]}>{gift.coins ? `${gift.coins} coins` : gift.category}</Text></View><Ionicons name={giftListOpen?'chevron-up':'chevron-down'} size={18} color={theme.onSurfaceVariant}/></Pressable>
        {giftListOpen && <><TextInput value={giftSearch} onChangeText={setGiftSearch} placeholder="Search gifts…" placeholderTextColor={theme.onSurfaceVariant} style={[styles.input,{color:theme.onSurface,borderColor:theme.outline,backgroundColor:theme.surface}]} />{filteredGifts.map(g=><Pressable key={g.id} onPress={()=>selectGift(g)} style={styles.listRow}><Text style={styles.giftEmoji}>{g.emoji}</Text><View style={{flex:1}}><Text style={[styles.itemName,{color:theme.onSurface}]}>{g.name}</Text><Text style={[styles.meta,{color:theme.onSurfaceVariant}]}>{g.coins ? `${g.coins} coins` : g.category}</Text></View>{gift.id===g.id&&<Ionicons name="checkmark" size={19} color={theme.primary}/>}</Pressable>)}</>}
      </View>
      <Text style={[styles.label,{color:theme.onSurfaceVariant}]}>Alert sound</Text>
      <View style={[styles.card,{backgroundColor:theme.surfaceVariant,borderColor:theme.outline}]}>{modes.map(m=><Pressable key={m.id} onPress={()=>setMode(m.id)} style={[styles.option,mode===m.id&&{borderColor:theme.primary}]}><Ionicons name={m.icon} size={21} color={mode===m.id?theme.primary:theme.onSurfaceVariant}/><View style={styles.optionText}><Text style={[styles.optionTitle,{color:theme.onSurface}]}>{m.title}</Text><Text style={[styles.optionSub,{color:theme.onSurfaceVariant}]}>{m.subtitle}</Text></View><Ionicons name={mode===m.id?'radio-button-on':'radio-button-off'} size={20} color={mode===m.id?theme.primary:theme.onSurfaceVariant}/></Pressable>)}</View>
      {mode==='system'&&<><Text style={[styles.label,{color:theme.onSurfaceVariant}]}>EchoStream sounds</Text><View style={[styles.card,{backgroundColor:theme.surfaceVariant,borderColor:theme.outline}]}>{selectedSound?<><View style={styles.selected}><View style={[styles.soundIcon,{backgroundColor:theme.surface}]}><Ionicons name={selectedSound.icon as any} size={19} color={theme.primary}/></View><View style={{flex:1}}><Text style={[styles.selectedName,{color:theme.onSurface}]}>{selectedSound.name}</Text><Text style={[styles.meta,{color:theme.onSurfaceVariant}]}>{selectedSound.description}</Text></View><Pressable onPress={()=>setPreviewingSound(v=>v===selectedSound.id?null:selectedSound.id)}><Ionicons name={previewingSound===selectedSound.id?'pause-circle':'play-circle'} size={28} color={theme.primary}/></Pressable><Pressable onPress={()=>setSoundListOpen(v=>!v)}><Ionicons name={soundListOpen?'chevron-up':'chevron-down'} size={18} color={theme.onSurfaceVariant}/></Pressable></View>{soundListOpen&&<><TextInput value={soundSearch} onChangeText={setSoundSearch} placeholder="Search system sounds…" placeholderTextColor={theme.onSurfaceVariant} style={[styles.input,{color:theme.onSurface,borderColor:theme.outline,backgroundColor:theme.surface}]} />{filteredSounds.map(s=><Pressable key={s.id} onPress={()=>selectSystemSound(s)} style={styles.listRow}><View style={[styles.soundIcon,{backgroundColor:theme.surface}]}><Ionicons name={s.icon as any} size={19} color={theme.primary}/></View><View style={{flex:1}}><Text style={[styles.itemName,{color:theme.onSurface}]}>{s.name}</Text><Text style={[styles.helper,{color:theme.onSurfaceVariant}]}>{s.description}</Text></View><Pressable onPress={()=>setPreviewingSound(v=>v===s.id?null:s.id)}><Ionicons name={previewingSound===s.id?'pause-circle':'play-circle-outline'} size={25} color={theme.primary}/></Pressable></Pressable>)}</>}</>:<><TextInput value={soundSearch} onChangeText={setSoundSearch} placeholder="Search system sounds…" placeholderTextColor={theme.onSurfaceVariant} style={[styles.input,{color:theme.onSurface,borderColor:theme.outline,backgroundColor:theme.surface}]} />{filteredSounds.map(s=><Pressable key={s.id} onPress={()=>selectSystemSound(s)} style={styles.listRow}><View style={[styles.soundIcon,{backgroundColor:theme.surface}]}><Ionicons name={s.icon as any} size={19} color={theme.primary}/></View><View style={{flex:1}}><Text style={[styles.itemName,{color:theme.onSurface}]}>{s.name}</Text><Text style={[styles.helper,{color:theme.onSurfaceVariant}]}>{s.description}</Text></View><Pressable onPress={()=>setPreviewingSound(v=>v===s.id?null:s.id)}><Ionicons name={previewingSound===s.id?'pause-circle':'play-circle-outline'} size={25} color={theme.primary}/></Pressable></Pressable>)}</>}</View></>}
      {mode==='custom'&&<><Text style={[styles.label,{color:theme.onSurfaceVariant}]}>Custom audio</Text><View style={[styles.card,{backgroundColor:theme.surfaceVariant,borderColor:theme.outline}]}>{customSound?<View style={styles.fileRow}><View style={[styles.fileIcon,{backgroundColor:theme.surface}]}><Ionicons name="musical-note" size={20} color={theme.primary}/></View><View style={{flex:1}}><Text numberOfLines={1} style={[styles.fileName,{color:theme.onSurface}]}>{customSound.name}</Text><Text style={[styles.fileSize,{color:theme.onSurfaceVariant}]}>{Math.round((customSound.size??0)/1024)} KB</Text></View><Pressable onPress={pickSound}><Text style={[styles.replace,{color:theme.primary}]}>Replace</Text></Pressable></View>:<Pressable onPress={pickSound} style={[styles.upload,{borderColor:theme.outline}]}><Ionicons name="cloud-upload-outline" size={28} color={theme.primary}/><Text style={[styles.uploadTitle,{color:theme.onSurface}]}>Upload a sound</Text><Text style={[styles.uploadSub,{color:theme.onSurfaceVariant}]}>MP3, WAV, M4A and other audio files</Text></Pressable>}</View></>}
      {mode==='tts'&&<View style={[styles.info,{backgroundColor:theme.surfaceVariant}]}><Ionicons name="information-circle-outline" size={18} color={theme.primary}/><Text style={[styles.infoText,{color:theme.onSurfaceVariant}]}>The selected gift will use your configured TTS voice.</Text></View>}
      <View style={[styles.card,{backgroundColor:theme.surfaceVariant,borderColor:theme.outline,marginTop:16}]}><ToggleRow label="Enabled" value={enabled} onValueChange={setEnabled} bold/></View>
      <Pressable onPress={save} style={[styles.save,{backgroundColor:theme.primary}]}><Text style={[styles.saveText,{color:theme.buttonText}]}>Save Changes</Text></Pressable>
    </ScrollView>
  </SafeAreaView>;
}

const styles=StyleSheet.create({container:{flex:1},topGlow:{position:'absolute',top:-60,alignSelf:'center',width:width*1.2,height:height*.45,borderRadius:width},header:{height:58,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{fontSize:18,fontWeight:'700'},content:{padding:20,paddingBottom:60},label:{fontSize:12,fontWeight:'700',textTransform:'uppercase',letterSpacing:.4,marginBottom:10,marginTop:8},card:{borderWidth:1,borderRadius:18,padding:16,marginBottom:16},selected:{flexDirection:'row',alignItems:'center',gap:10,minHeight:56},bigEmoji:{fontSize:38},selectedName:{fontSize:14,fontWeight:'700'},meta:{fontSize:11,marginTop:2},input:{borderWidth:1,borderRadius:10,paddingHorizontal:12,paddingVertical:10,fontSize:14,marginTop:10},listRow:{minHeight:58,flexDirection:'row',alignItems:'center',gap:12,paddingVertical:10,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'rgba(255,255,255,.08)'},giftEmoji:{fontSize:25,width:34,textAlign:'center'},itemName:{fontSize:13,fontWeight:'700'},helper:{fontSize:12,lineHeight:17},option:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:'transparent',borderRadius:12,padding:12,marginBottom:8},optionText:{flex:1},optionTitle:{fontSize:14,fontWeight:'700'},optionSub:{fontSize:12,lineHeight:17,marginTop:2},soundIcon:{width:38,height:38,borderRadius:11,alignItems:'center',justifyContent:'center'},fileRow:{flexDirection:'row',alignItems:'center',gap:12},fileIcon:{width:42,height:42,borderRadius:12,alignItems:'center',justifyContent:'center'},fileName:{fontSize:13,fontWeight:'700'},fileSize:{fontSize:11,marginTop:3},replace:{fontSize:12,fontWeight:'700'},upload:{alignItems:'center',justifyContent:'center',borderStyle:'dashed',borderWidth:1,borderRadius:14,paddingVertical:28},uploadTitle:{fontSize:14,fontWeight:'700',marginTop:8},uploadSub:{fontSize:12,marginTop:4},info:{borderRadius:14,padding:14,flexDirection:'row',gap:10},infoText:{flex:1,fontSize:12,lineHeight:18},save:{borderRadius:14,paddingVertical:14,alignItems:'center',marginTop:8},saveText:{fontSize:14,fontWeight:'800'}});
