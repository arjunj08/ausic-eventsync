import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import { useApp } from '../context/AppContext';

export default function TeamChatScreen() {
  const { currentUser, chats, setChats } = useApp();
  const [messages, setMessages] = useState([]);
  const channelId = "t1_group";

  useEffect(() => { setMessages(chats[channelId] || []); }, [chats]);

  const onSend = (newMsgs = []) => {
    setMessages(prev => GiftedChat.append(prev, newMsgs));
    setChats(prev => ({ ...prev, [channelId]: GiftedChat.append(prev[channelId], newMsgs) }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <View style={styles.banner}><Text style={styles.bannerTxt}>ANNOUNCEMENT: System updates deploying tonight.</Text></View>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{ _id: currentUser.id, name: currentUser.name }}
        renderBubble={props => (
          <Bubble {...props}
            wrapperStyle={{
              right: { backgroundColor: '#00AAFF' },
              left: { backgroundColor: '#12121A', borderWidth: 1, borderColor: '#222' }
            }}
            textStyle={{ right: { color: '#FFF' }, left: { color: '#FFF' } }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#FF6B00', padding: 8, alignItems: 'center' },
  bannerTxt: { color: '#000', fontWeight: 'bold', fontSize: 11 }
});
