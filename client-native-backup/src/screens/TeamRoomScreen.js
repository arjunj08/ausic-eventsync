import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';

export default function TeamRoomScreen({ navigation }) {
  const { currentUser, updates, postUpdate, announcements } = useApp();
  const [newUpdate, setNewUpdate] = useState('');
  const userTeamId = currentUser.teamId;

  const handlePost = () => {
    if(!newUpdate) return;
    postUpdate(userTeamId, currentUser.name, newUpdate);
    setNewUpdate('');
  };

  return (
    <View style={styles.container}>
      {announcements[userTeamId] && (
        <View style={styles.pinnedBar}>
          <Text style={styles.pinnedTxt}>PINNED: {announcements[userTeamId]}</Text>
        </View>
      )}
      
      <ScrollView style={{flex: 1, padding: 15}}>
        <View style={styles.row}>
          <Text style={styles.heading}>Internal Feed</Text>
          <TouchableOpacity style={styles.chatLink} onPress={() => navigation.navigate("TeamChat")}>
            <Text style={{color: '#00AAFF', fontWeight:'bold'}}>Secure Chat Gateway →</Text>
          </TouchableOpacity>
        </View>

        {currentUser.role === 'team_lead' && (
          <View style={styles.postBox}>
            <TextInput style={styles.input} placeholder="Broadcast internal operational log..." placeholderTextColor="#666" value={newUpdate} onChangeText={setNewUpdate} />
            <TouchableOpacity style={styles.btn} onPress={handlePost}><Text style={{color:'#FFF', fontWeight:'bold'}}>POST</Text></TouchableOpacity>
          </View>
        )}

        {updates.filter(u => u.teamId === userTeamId).map(u => (
          <View key={u.id} style={styles.feedCard}>
            <Text style={styles.author}>{u.author} <Text style={styles.time}>{u.timestamp}</Text></Text>
            <Text style={styles.body}>{u.text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  pinnedBar: { backgroundColor: '#FF6B00', padding: 10, borderBottomWidth: 1, borderColor: '#333' },
  pinnedTxt: { color: '#000', fontWeight: 'bold', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 },
  heading: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  chatLink: { backgroundColor: '#12121A', padding: 8, borderRadius: 6 },
  postBox: { backgroundColor: '#12121A', padding: 10, borderRadius: 8, marginBottom: 15 },
  input: { color: '#FFF', padding: 10, backgroundColor: '#1A1A26', borderRadius: 6, marginBottom: 10 },
  btn: { backgroundColor: '#FF6B00', padding: 10, borderRadius: 6, alignItems: 'center' },
  feedCard: { backgroundColor: '#12121A', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  author: { color: '#00AAFF', fontWeight: 'bold', fontSize: 13 },
  time: { color: '#555', fontSize: 11 },
  body: { color: '#DDD', marginTop: 5 }
});
