import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp, mockUsers } from '../context/AppContext';

export default function TeamManagementScreen() {
  const { teams, assignMemberToTeam, assignTeamLead } = useApp();
  const [activeTeam, setActiveTeam] = useState("t1");

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Personnel Core Mapping</Text>
      <View style={styles.tabRow}>
        {Object.values(teams).map(t => (
          <TouchableOpacity key={t.id} style={[styles.tab, activeTeam === t.id && { borderColor: t.color }]} onPress={() => setActiveTeam(t.id)}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionHeader}>Assigned Team Director</Text>
      {Object.values(mockUsers).map(u => (
        <TouchableOpacity key={u.id} style={[styles.userRow, teams[activeTeam]?.leadId === u.id && styles.activeLead]} onPress={() => assignTeamLead(activeTeam, u.id)}>
          <Text style={{color:'#FFF'}}>{u.name} ({u.role})</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionHeader}>Affiliated Operators</Text>
      {Object.values(mockUsers).map(u => (
        <TouchableOpacity key={u.id} style={[styles.userRow, teams[activeTeam]?.members.includes(u.id) && styles.activeMember]} onPress={() => assignMemberToTeam(u.id, activeTeam)}>
          <Text style={{color:'#FFF'}}>{u.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  tabRow: { flexDirection: 'row', marginBottom: 20 },
  tab: { padding: 10, borderBottomWidth: 2, borderColor: '#222', marginRight: 15 },
  sectionHeader: { color: '#FF6B00', fontWeight: 'bold', marginTop: 20, marginBottom: 10, textTransform: 'uppercase' },
  userRow: { backgroundColor: '#12121A', padding: 12, borderRadius: 6, marginBottom: 8, borderWidth: 1, borderColor: '#222' },
  activeLead: { borderColor: '#FF6B00' },
  activeMember: { borderColor: '#00AAFF' }
});
