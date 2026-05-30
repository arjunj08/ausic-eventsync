import React, { useState } from 'react';
import { View } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import { useApp } from '../context/AppContext';

export default function DirectMessageScreen() {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState([
    { _id: 1, text: 'Direct secure link established.', createdAt: new Date(), user: { _id: 'u1', name: 'Alex Rivers' } }
  ]);

  const onSend = (newMsgs = []) => setMessages(prev => GiftedChat.append(prev, newMsgs));

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: currentUser.id }}
        renderBubble={props => (
          <Bubble {...props}
            wrapperStyle={{ right: { backgroundColor: '#00AAFF' }, left: { backgroundColor: '#12121A' } }}
            textStyle={{ right: { color: '#FFF' }, left: { color: '#FFF' } }}
          />
        )}
      />
    </View>
  );
}
