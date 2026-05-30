import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useApp } from '../context/AppContext';

export default function CreateEventScreen({ navigation }) {
  const { createEvent } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [banner, setBanner] = useState('https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800');

  const handleSave = () => {
    if(!title || !description) return Alert.alert("Validation Matrix Failure", "Complete all required operational fields.");
    createEvent({ title, description, banner });
    Alert.alert("Success", "Draft configuration initiated.");
    navigation.navigate("Admin Dashboard");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Initialize Campaign</Text>
      <TextInput placeholder="Event Project Name" placeholderTextColor="#555" style={styles.input} value={title} onChangeText={setTitle} />
      <TextInput placeholder="Functional Scope Blueprint" placeholderTextColor="#555" style={[styles.input, styles.textArea]} multiline value={description} onChangeText={setDescription} />
      <TextInput placeholder="Banner Source URI" placeholderTextColor="#555" style={styles.input} value={banner} onChangeText={setBanner} />
      <TouchableOpacity style={styles.btn} onPress={handleSave}><Text style={styles.btnTxt}>GENERATE CAMPAIGN DRAFT</Text></TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FF6B00', marginBottom: 20 },
  input: { backgroundColor: '#12121A', color: '#FFF', padding: 15, borderRadius: 8, marginBottom: 15, borderColor: '#222', borderWidth: 1 },
  textArea: { height: 100, textAlignVertical: 'top' },
  btn: { backgroundColor: '#00AAFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnTxt: { color: '#FFF', fontWeight: 'bold' }
});
