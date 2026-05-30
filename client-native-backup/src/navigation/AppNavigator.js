import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';
import LoginScreen from '../screens/LoginScreen';
import AdminDashboard from '../screens/AdminDashboard';
import CreateEventScreen from '../screens/CreateEventScreen';
import TeamManagementScreen from '../screens/TeamManagementScreen';
import EventDetailMemberView from '../screens/EventDetailMemberView';
import TeamRoomScreen from '../screens/TeamRoomScreen';
import MyTasksScreen from '../screens/MyTasksScreen';
import CrossTeamRequestScreen from '../screens/CrossTeamRequestScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import MemberProfileScreen from '../screens/MemberProfileScreen';
import TeamChatScreen from '../screens/TeamChatScreen';
import DirectMessageScreen from '../screens/DirectMessageScreen';
import VoiceCallScreen from '../screens/VoiceCallScreen';
import VideoCallScreen from '../screens/VideoCallScreen';
import CallsChatsHubScreen from '../screens/CallsChatsHubScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const darkThemeOptions = {
  headerStyle: { backgroundColor: '#0A0A0F', borderBottomWidth: 1, borderBottomColor: '#1A1A26' },
  headerTintColor: '#00AAFF',
  headerTitleStyle: { fontWeight: 'bold' },
  tabBarStyle: { backgroundColor: '#0A0A0F', borderTopColor: '#1A1A26', paddingBottom: 5 },
  tabBarActiveTintColor: '#00AAFF',
  tabBarInactiveTintColor: '#666'
};

function MemberTabs() {
  return (
    <Tab.Navigator screenOptions={darkThemeOptions}>
      <Tab.Screen name="Event" component={EventDetailMemberView} options={{ tabBarIcon: ({color}) => <Ionicons name="compass" size={22} color={color}/> }}/>
      <Tab.Screen name="Team Room" component={TeamRoomScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="people" size={22} color={color}/> }}/>
      <Tab.Screen name="Tasks" component={MyTasksScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="checkmark-done-circle" size={22} color={color}/> }}/>
      <Tab.Screen name="Hub" component={CallsChatsHubScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="chatbubbles" size={22} color={color}/> }}/>
      <Tab.Screen name="Profile" component={MemberProfileScreen} options={{ tabBarIcon: ({color}) => <Ionicons name="person" size={22} color={color}/> }}/>
    </Tab.Navigator>
  );
}

function AdminDrawer() {
  return (
    <Drawer.Navigator screenOptions={{
      drawerStyle: { backgroundColor: '#0A0A0F', width: 240 },
      drawerActiveTintColor: '#FF6B00',
      drawerInactiveTintColor: '#FFF',
      ...darkThemeOptions
    }}>
      <Drawer.Screen name="Admin Dashboard" component={AdminDashboard} />
      <Drawer.Screen name="Create Event" component={CreateEventScreen} />
      <Drawer.Screen name="Team Configuration" component={TeamManagementScreen} />
      <Drawer.Screen name="Inter-Team Track" component={CrossTeamRequestScreen} />
      <Drawer.Screen name="Hub" component={CallsChatsHubScreen} />
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0A0A0F' } }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminRoot" component={AdminDrawer} />
        <Stack.Screen name="MemberRoot" component={MemberTabs} />
        <Stack.Screen name="TeamChat" component={TeamChatScreen} options={{ headerShown: true, ...darkThemeOptions }} />
        <Stack.Screen name="DirectMessage" component={DirectMessageScreen} options={{ headerShown: true, ...darkThemeOptions }} />
        <Stack.Screen name="CrossTeamRequest" component={CrossTeamRequestScreen} options={{ headerShown: true, ...darkThemeOptions }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: true, ...darkThemeOptions }} />
        <Stack.Screen name="VoiceCall" component={VoiceCallScreen} />
        <Stack.Screen name="VideoCall" component={VideoCallScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
