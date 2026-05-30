import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';

export default function CallsChatsHubScreen({ navigation }) {
  const { callsHistory } = useApp();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>Active Secure Gateways</Text>
      <TouchableOpacity style={styles.hubRow} onPress={() => navigation.navigate("TeamChat")}>
        <Text style={styles.hubTitle}># Team Alpha Unified Channel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.hubRow} onPress={() => navigation.navigate("DirectMessage")}>
        <Text style={styles.hubTitle}>@ Alex Rivers (Admin Secure DM)</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionHeader, {marginTop: 30}]}>Telemetry Calling History</Text>
      {callsHistory.map(item => (
        <View key={item.id} style={styles.callCard}>
          <View>
            <Text style={[styles.callUser, item.missed && {color: '#FF3B30'}]}>{item.userName}</Text>
            <Text style={styles.callMeta}>{item.type} • {item.direction} • {item.time}</Text>
          </View>
          {!item.missed && <Text style={styles.dur}>{item.duration}</Text>}
        </View>
      ))}

      <Text style={[styles.sectionHeader, {marginTop: 30}]}>Initialize Engine Node</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actBtn} onPress={() => navigation.navigate("VoiceCall")}><Text style={styles.txt}>VOICE LINK</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.actBtn, {borderColor:'#FF6B00'}]} onPress={() => navigation.navigate("VideoCall")}><Text style={[styles.txt, {color:'#FF6B00'}]}>VIDEO LINK</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 15 },
  sectionHeader: { color: '#00AAFF', fontWeight: 'bold', fontSize: 13, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  hubRow: { backgroundColor: '#12121A', padding: 16, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  hubTitle: { color: '#FFF', fontWeight: '600' },
  callCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#12121A', padding: 12, borderRadius: 8, marginBottom: 8 },
  callUser: { color: '#FFF', fontWeight: 'bold' },
  callMeta: { color: '#555', fontSize: 12, marginTop: 2 },
  dur: { color: '#666', fontSize: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actBtn: { flex: 1, backgroundColor: '#12121A', padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 5, borderWidth: 1, borderColor: '#00AAFF' },
  txt: { color: '#00AAFF', fontWeight: '900' }
});
