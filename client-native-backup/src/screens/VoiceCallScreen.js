import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VoiceCallScreen({ navigation }) {
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.avatarGlow}>
        <Image source={{ uri: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" }} style={styles.avatar} />
      </View>
      <Text style={styles.name}>Sarah Chen</Text>
      <Text style={styles.status}>Voice Channel Active</Text>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.btn, muted && styles.activeActive]} onPress={() => setMuted(!muted)}>
          <Ionicons name={muted ? "mic-off" : "mic"} size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.endCall]} onPress={() => navigation.goBack()}>
          <Ionicons name="call" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, speaker && styles.activeActive]} onPress={() => setSpeaker(!speaker)}>
          <Ionicons name="volume-high" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' },
  avatarGlow: { borderRadius: 100, padding: 15, backgroundColor: 'rgba(0, 170, 255, 0.1)', shadowColor: '#00AAFF', shadowRadius: 20, shadowOpacity: 0.6 },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  name: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginTop: 25 },
  status: { color: '#666', marginTop: 5, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 },
  controls: { flexDirection: 'row', marginTop: 60, width: '80%', justifyContent: 'space-around', alignItems: 'center' },
  btn: { backgroundColor: '#1A1A26', padding: 15, borderRadius: 50, width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  activeActive: { backgroundColor: '#00AAFF' },
  endCall: { backgroundColor: '#FF3B30', transform: [{ rotate: '135deg' }] }
});
