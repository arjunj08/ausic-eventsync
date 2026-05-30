import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';

export default function MemberProfileScreen({ navigation }) {
  const { currentUser } = useApp();

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrap}>
        <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
      </View>
      <Text style={styles.name}>{currentUser.name}</Text>
      <Text style={styles.roleTag}>{currentUser.role.toUpperCase()}</Text>
      {currentUser.teamName && <Text style={styles.team}>Division: {currentUser.teamName}</Text>}
      
      <TouchableOpacity style={styles.logout} onPress={() => navigation.replace("Login")}>
        <Text style={{color: '#FF3B30', fontWeight: 'bold'}}>DISCONNECT SESSION</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { borderRadius: 60, padding: 4, borderWidth: 2, borderColor: '#00AAFF', marginBottom: 15 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  roleTag: { color: '#FF6B00', fontWeight: 'bold', fontSize: 12, marginTop: 4, letterSpacing: 1 },
  team: { color: '#888', marginTop: 8 },
  logout: { marginTop: 40, backgroundColor: '#1A1A26', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 }
});
