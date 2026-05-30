import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function VideoCallScreen({ navigation }) {
  const [camOff, setCamOff] = useState(false);

  return (
    <View style={styles.container}>
      {/* Fullscreen Video Canvas Representation */}
      <View style={styles.fullVideo}>
        <Text style={styles.videoPlaceholder}>REMOTE FEED STREAM</Text>
      </View>

      {/* Picture-in-Picture Local Self Preview */}
      <View style={styles.selfPreview}>
        <Text style={styles.selfPlaceholder}>{camOff ? "CAM OFF" : "SELF"}</Text>
      </View>

      <View style={styles.overlayControls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setCamOff(!camOff)}>
          <Ionicons name={camOff ? "videocam-off" : "videocam"} size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, {backgroundColor: '#FF3B30'}]} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  fullVideo: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A26' },
  videoPlaceholder: { color: '#555', fontWeight: 'bold' },
  selfPreview: { position: 'absolute', top: 50, right: 20, width: 90, height: 130, backgroundColor: '#0A0A0F', borderRadius: 8, borderWidth: 1, borderColor: '#00AAFF', justifyContent: 'center', alignItems: 'center' },
  selfPlaceholder: { color: '#00AAFF', fontSize: 10, fontWeight: 'bold' },
  overlayControls: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  controlBtn: { backgroundColor: 'rgba(26,26,38,0.8)', padding: 15, borderRadius: 50, marginHorizontal: 15 }
});
