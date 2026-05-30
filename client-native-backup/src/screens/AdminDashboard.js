import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';

export default function AdminDashboard({ navigation }) {
  const { events, teams, crossTeamRequests } = useApp();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.headerTitle}>Central Command</Text>
      
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}><Text style={styles.metricNum}>{events.length}</Text><Text style={styles.metricLabel}>Events</Text></View>
        <View style={styles.metricBox}><Text style={styles.metricNum}>{Object.keys(teams).length}</Text><Text style={styles.metricLabel}>Teams</Text></View>
        <View style={styles.metricBox}><Text style={[styles.metricNum, {color: '#FF6B00'}]}>{crossTeamRequests.filter(r => r.adminApproved === 'Pending').length}</Text><Text style={styles.metricLabel}>Pings Pending</Text></View>
      </View>

      <Text style={styles.sectionTitle}>Managed Subsystems</Text>
      {events.map(e => (
        <View key={e.id} style={styles.eventCard}>
          <Text style={styles.eventTitle}>{e.title}</Text>
          <Text style={[styles.statusTag, {color: e.published ? '#00FF66' : '#FF3B30'}]}>
            {e.published ? "● Active Production" : "○ Local Draft"}
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate("Team Configuration", { eventId: e.id })}>
              <Text style={styles.btnText}>Configure Teams</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 15 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#FFF', marginBottom: 20 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  metricBox: { flex: 1, backgroundColor: '#12121A', padding: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 4, borderWidth: 1, borderColor: '#222' },
  metricNum: { fontSize: 24, fontWeight: 'bold', color: '#00AAFF' },
  metricLabel: { color: '#666', fontSize: 11, marginTop: 4, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#FF6B00', marginBottom: 15 },
  eventCard: { backgroundColor: '#12121A', padding: 15, borderRadius: 12, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#00AAFF' },
  eventTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  statusTag: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  actionRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'flex-end' },
  actionBtn: { backgroundColor: '#1A1A26', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#333' },
  btnText: { color: '#00AAFF', fontSize: 12, fontWeight: 'bold' }
});
