import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useApp } from '../context/AppContext';

export default function CrossTeamRequestScreen() {
  const { currentUser, crossTeamRequests, submitCrossTeamRequest, handleRequestApproval } = useApp();
  const [msg, setMsg] = useState('');

  const triggerRequest = () => {
    if(!msg) return;
    submitCrossTeamRequest(currentUser.teamId, "t2", currentUser.id, msg);
    setMsg('');
  };

  return (
    <ScrollView style={styles.container}>
      {currentUser.role === 'member' && (
        <View style={styles.box}>
          <Text style={styles.sub}>Initiate Cross-Team Pipeline</Text>
          <TextInput style={styles.input} placeholder="Specify target dependencies..." placeholderTextColor="#666" value={msg} onChangeText={setMsg} />
          <TouchableOpacity style={styles.btn} onPress={triggerRequest}><Text style={{color:'#FFF', fontWeight:'bold'}}>TRANSMIT LINK REQUEST</Text></TouchableOpacity>
        </View>
      )}

      <Text style={styles.section}>Active Inter-Team Matrix</Text>
      {crossTeamRequests.map(r => (
        <View key={r.id} style={styles.reqCard}>
          <Text style={styles.reqText}>"{r.message}"</Text>
          <Text style={styles.statusLine}>From Lead: {r.fromLeadApproved} | To Lead: {r.toLeadApproved} | Admin: {r.adminApproved}</Text>
          
          {currentUser.role === 'team_lead' && currentUser.teamId === r.toTeamId && r.toLeadApproved === 'Pending' && (
            <View style={styles.row}>
              <TouchableOpacity style={styles.acc} onPress={() => handleRequestApproval(r.id, 'to_lead', 'Approved')}><Text style={{color:'#000', fontWeight:'bold'}}>Approve</Text></TouchableOpacity>
            </View>
          )}

          {currentUser.role === 'admin' && r.fromLeadApproved === 'Approved' && r.toLeadApproved === 'Approved' && r.adminApproved === 'Pending' && (
            <View style={styles.row}>
              <TouchableOpacity style={[styles.acc, {backgroundColor:'#FF6B00'}]} onPress={() => handleRequestApproval(r.id, 'admin', 'Approved')}><Text style={{color:'#FFF', fontWeight:'bold'}}>Grant Final Authorization</Text></TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 15 },
  box: { backgroundColor: '#12121A', padding: 15, borderRadius: 10, marginBottom: 20 },
  sub: { color: '#00AAFF', fontWeight: 'bold', marginBottom: 10 },
  input: { backgroundColor: '#1A1A26', color: '#FFF', padding: 10, borderRadius: 6, marginBottom: 10 },
  btn: { backgroundColor: '#FF6B00', padding: 12, borderRadius: 6, alignItems: 'center' },
  section: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 15 },
  reqCard: { backgroundColor: '#12121A', padding: 15, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#222' },
  reqText: { color: '#FFF', fontStyle: 'italic' },
  statusLine: { color: '#666', fontSize: 11, marginTop: 8 },
  row: { flexDirection: 'row', marginTop: 10 },
  acc: { backgroundColor: '#00AAFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }
});
