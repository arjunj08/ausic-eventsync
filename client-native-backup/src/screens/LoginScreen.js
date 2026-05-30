import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useApp, mockUsers } from '../context/AppContext';

export default function LoginScreen({ navigation }) {
  const [isAdminFlow, setIsAdminFlow] = useState(false);
  const [selectedUser, setSelectedUser] = useState("u3");
  const { login } = useApp();

  const handleLogin = () => {
    login(selectedUser);
    if (isAdminFlow) {
      navigation.replace("AdminRoot");
    } else {
      navigation.replace("MemberRoot");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AUISC <Text style={{color: '#FF6B00'}}>EventSync</Text></Text>
      
      <View style={styles.toggleContainer}>
        <TouchableOpacity style={[styles.toggleBtn, !isAdminFlow && styles.activeToggle]} onPress={() => { setIsAdminFlow(false); setSelectedUser("u3"); }}>
          <Text style={styles.toggleText}>Member Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleBtn, isAdminFlow && styles.activeToggle]} onPress={() => { setIsAdminFlow(true); setSelectedUser("u1"); }}>
          <Text style={styles.toggleText}>Admin Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Simulated Profile Identity</Text>
        {isAdminFlow ? (
          <TouchableOpacity style={styles.selector} onPress={() => setSelectedUser("u1")}>
            <Text style={styles.selectorText}>Log in as Alex Rivers (Admin)</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <TouchableOpacity style={[styles.selector, selectedUser === "u3" && styles.selectedAsset]} onPress={() => setSelectedUser("u3")}>
              <Text style={styles.selectorText}>Marcus Vance (Member - Dev Alpha)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.selector, selectedUser === "u2" && styles.selectedAsset]} onPress={() => setSelectedUser("u2")}>
              <Text style={styles.selectorText}>Sarah Chen (Lead - Dev Alpha)</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>PROCEED SECURELY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', justifyContent: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: '900', color: '#00AAFF', textAlign: 'center', marginBottom: 40, letterSpacing: 1.5 },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#14141F', borderRadius: 8, padding: 4, marginBottom: 25 },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 6 },
  activeToggle: { backgroundColor: '#00AAFF', shadowColor: '#00AAFF', shadowRadius: 10, shadowOpacity: 0.5 },
  toggleText: { color: '#FFF', fontWeight: 'bold' },
  card: { backgroundColor: '#12121A', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#222' },
  label: { color: '#888', marginBottom: 10, textTransform: 'uppercase', fontSize: 11, fontWeight: '700' },
  selector: { backgroundColor: '#1A1A26', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#333' },
  selectedAsset: { borderColor: '#FF6B00' },
  selectorText: { color: '#FFF' },
  loginButton: { backgroundColor: '#FF6B00', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  loginBtnText: { color: '#FFF', fontWeight: '900', letterSpacing: 1 }
});
