import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useApp } from '../context/AppContext';

export default function MyTasksScreen() {
  const { tasks, currentUser, updateTaskStatus } = useApp();
  const personalTasks = tasks.filter(t => t.assignedTo === currentUser.id);

  const cycleStatus = (task) => {
    const sequence = ["To Do", "In Progress", "Done"];
    const nextIndex = (sequence.indexOf(task.status) + 1) % sequence.length;
    updateTaskStatus(task.id, sequence[nextIndex]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Personal Execution Board</Text>
      {personalTasks.map(t => (
        <View key={t.id} style={styles.taskCard}>
          <Text style={styles.taskTitle}>{t.title}</Text>
          <TouchableOpacity style={[styles.statusBadge, t.status === "Done" && {backgroundColor: '#00FF66'}]} onPress={() => cycleStatus(t)}>
            <Text style={{color:'#000', fontWeight:'900', fontSize:11}}>{t.status.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginBottom: 20 },
  taskCard: { backgroundColor: '#12121A', padding: 15, borderRadius: 8, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  taskTitle: { color: '#FFF', fontWeight: '600', flex: 1 },
  statusBadge: { backgroundColor: '#00AAFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 }
});
