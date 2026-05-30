import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { colors } from '../theme/theme';
import EventsScreen from '../screens/EventsScreen';
import TeamRoomScreen from '../screens/TeamRoomScreen';
import MyTasksScreen from '../screens/MyTasksScreen';
import CrossTeamRequestsScreen from '../screens/CrossTeamRequestsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EventDetailScreen from '../screens/EventDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ routeName, focused }) {
  const icons = {
    Events: '🗓️',
    'Team Room': '🧩',
    'My Tasks': '✅',
    Requests: '📨',
    Notifications: '🔔',
    Profile: '👤',
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, color: focused ? colors.neonBlue : colors.muted }}>
        {icons[routeName] || '⭐'}
      </Text>
    </View>
  );
}

function MemberTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: '#171B25',
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.neonBlue,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Events" component={EventsScreen} />
      <Tab.Screen name="Team Room" component={TeamRoomScreen} />
      <Tab.Screen name="My Tasks" component={MyTasksScreen} />
      <Tab.Screen name="Requests" component={CrossTeamRequestsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function MemberNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberTabs" component={MemberTabs} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}
