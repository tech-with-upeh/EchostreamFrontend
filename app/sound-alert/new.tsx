import ToggleRow from '@/components/common/ToggleRow';
import { useAppTheme } from '@/hooks/use-theme-color';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function NewSoundAlertScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎁');
  const [mode, setMode] = useState<'tts' | 'sound'>('sound');
  const [enabled, setEnabled] = useState(true);
  const [sound, setSound] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const pickSound = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['audio/*'], copyToCacheDirectory: true, multiple: false });
    if (!result.canceled) setSound(result.assets[0]);
  };

  const save = () => {
    if (!name.trim()) return Alert.alert('Missing name', 'Give this sound alert a name first.');
    if (mode === 'sound' && !sound) return Alert.alert('Missing sound', 'Upload an audio file for this custom sound alert.');
    Alert.alert('Saved', 'The sound alert is ready to connect to the backend.', [{ text: 'Done', onPress: () => router.back() }]);
  };

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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="arrow-back" size={22} color={theme.onSurface} /></Pressable>
        <Text style={[styles.title, { color: theme.onSurface }]}>New Sound Alert</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>Alert details</Text>
        <View style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
          <View style={styles.emojiRow}>
            <Text style={styles.bigEmoji}>{emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: theme.onSurface }]}>Gift / event name</Text>
              <TextInput value={name} onChangeText={setName} placeholder="e.g. Rose" placeholderTextColor={theme.onSurfaceVariant} style={[styles.input, { color: theme.onSurface, borderColor: theme.outline, backgroundColor: theme.surface }]} />
            </View>
          </View>
          <Text style={[styles.fieldLabel, { color: theme.onSurface, marginTop: 16 }]}>Emoji</Text>
          <TextInput value={emoji} onChangeText={setEmoji} maxLength={4} style={[styles.input, { color: theme.onSurface, borderColor: theme.outline, backgroundColor: theme.surface }]} />
        </View>

        <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>Action</Text>
        <View style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
          <Pressable onPress={() => setMode('tts')} style={[styles.option, mode === 'tts' && { borderColor: theme.primary }]}>
            <MaterialCommunityIcons name="text-to-speech" size={21} color={mode === 'tts' ? theme.primary : theme.onSurfaceVariant} />
            <View style={styles.optionText}><Text style={[styles.optionTitle, { color: theme.onSurface }]}>Text to Speech</Text><Text style={[styles.optionSub, { color: theme.onSurfaceVariant }]}>Read a generated message with your selected voice.</Text></View>
            <Ionicons name={mode === 'tts' ? 'radio-button-on' : 'radio-button-off'} size={20} color={mode === 'tts' ? theme.primary : theme.onSurfaceVariant} />
          </Pressable>
          <Pressable onPress={() => setMode('sound')} style={[styles.option, mode === 'sound' && { borderColor: theme.primary }]}>
            <Ionicons name="musical-notes-outline" size={21} color={mode === 'sound' ? theme.primary : theme.onSurfaceVariant} />
            <View style={styles.optionText}><Text style={[styles.optionTitle, { color: theme.onSurface }]}>Custom Sound</Text><Text style={[styles.optionSub, { color: theme.onSurfaceVariant }]}>Play an uploaded audio clip when the event happens.</Text></View>
            <Ionicons name={mode === 'sound' ? 'radio-button-on' : 'radio-button-off'} size={20} color={mode === 'sound' ? theme.primary : theme.onSurfaceVariant} />
          </Pressable>
        </View>

        {mode === 'sound' && (
          <>
            <Text style={[styles.label, { color: theme.onSurfaceVariant }]}>Custom sound</Text>
            <View style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline }]}>
              {sound ? (
                <View style={styles.fileRow}>
                  <View style={[styles.fileIcon, { backgroundColor: theme.surface }]}><Ionicons name="musical-note" size={20} color={theme.primary} /></View>
                  <View style={{ flex: 1 }}><Text numberOfLines={1} style={[styles.fileName, { color: theme.onSurface }]}>{sound.name}</Text><Text style={[styles.fileSize, { color: theme.onSurfaceVariant }]}>{Math.round((sound.size ?? 0) / 1024)} KB</Text></View>
                  <Pressable onPress={pickSound}><Text style={[styles.replace, { color: theme.primary }]}>Replace</Text></Pressable>
                </View>
              ) : (
                <Pressable onPress={pickSound} style={[styles.upload, { borderColor: theme.outline }]}>
                  <Ionicons name="cloud-upload-outline" size={28} color={theme.primary} />
                  <Text style={[styles.uploadTitle, { color: theme.onSurface }]}>Upload a sound</Text>
                  <Text style={[styles.uploadSub, { color: theme.onSurfaceVariant }]}>MP3, WAV, M4A and other audio files</Text>
                </Pressable>
              )}
            </View>
          </>
        )}

        {mode === 'tts' && <View style={[styles.info, { backgroundColor: theme.surfaceVariant }]}><Ionicons name="information-circle-outline" size={18} color={theme.primary} /><Text style={[styles.infoText, { color: theme.onSurfaceVariant }]}>TTS message and voice settings can be connected to the gift backend when it is available.</Text></View>}
        <View style={[styles.card, { backgroundColor: theme.surfaceVariant, borderColor: theme.outline, marginTop: 16 }]}><ToggleRow label="Enabled" value={enabled} onValueChange={setEnabled} bold /></View>
        <Pressable onPress={save} style={[styles.save, { backgroundColor: theme.primary }]}><Text style={[styles.saveText, { color: theme.buttonText }]}>Save Sound Alert</Text></Pressable>
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
  header: { height: 58, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 60 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10, marginTop: 8 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16 },
  emojiRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  bigEmoji: { fontSize: 38 },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 7 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'transparent', borderRadius: 12, padding: 12, marginBottom: 8 },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 14, fontWeight: '700' },
  optionSub: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  upload: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderRadius: 14, paddingVertical: 28 },
  uploadTitle: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  uploadSub: { fontSize: 12, marginTop: 4 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: 13, fontWeight: '700' },
  fileSize: { fontSize: 11, marginTop: 3 },
  replace: { fontSize: 12, fontWeight: '700' },
  info: { borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  save: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveText: { fontSize: 14, fontWeight: '800' },
});
