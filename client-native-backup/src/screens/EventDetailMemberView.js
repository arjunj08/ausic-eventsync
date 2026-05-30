import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';

export default function EventDetailMemberView() {
  const { events } = useApp();
  const visibleEvent = events.find(e => e.published);

  if (!visibleEvent) return <View style={styles.container}><Text style={styles.msg}>No Active Campaigns Found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: visibleEvent.banner }} style={styles.banner} />
      <View style={styles.metaContainer}>
        <Text style={styles.title}>{visibleEvent.title}</Text>
        <Text style={styles.desc}>{visibleEvent.description}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  banner: { width: '100%', height: 200, resizeMode: 'cover' },
  metaContainer: { padding: 20 },
  title: { fontSize: 24, fontWeight: '900', color: '#00AAFF', marginBottom: 12 },
  desc: { color: '#CCC', fontSize: 15, lineHeight: 22 },
  msg: { color: '#666', textAlign: 'center', marginTop: 100 }
});
