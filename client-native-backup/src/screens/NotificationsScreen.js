import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

export default function NotificationsScreen() {
  const alerts = [
    { id: '1', title: 'System Node Sync', message: 'You have been mapped to team Dev Alpha.', type: 'sys' },
    { id: '2', title: 'Pipeline Event', message: 'Cross-team network request updated to APPROVED.', type: 'flow' }
  ];

  return (
    <View style={styles.container}>
      <FlatList data={alerts} keyExtractor={item => item.id} renderItem={({item}) => (
        <View style={styles.card}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.msg}>{item.message}</Text>
        </View>
      )}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 10 },
  card: { backgroundColor: '#12121A', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#FF6B00' },
  title: { color: '#FFF', fontWeight: 'bold' },
  msg: { color: '#AAA', marginTop: 4, fontSize: 13 }
});
