import React from 'react';
import { Text } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { colors } from '../theme/theme';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import CrossTeamRequestsScreen from '../screens/CrossTeamRequestsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Drawer = createDrawerNavigator();

export default function AdminNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        drawerStyle: { backgroundColor: colors.surface },
        drawerActiveTintColor: colors.neonBlue,
        drawerInactiveTintColor: colors.text,
        sceneContainerStyle: { backgroundColor: colors.background },
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{ drawerIcon: () => <Text style={{ color: colors.neonBlue }}>📊</Text> }}
      />
      <Drawer.Screen
        name="Create Event"
        component={CreateEventScreen}
        options={{ drawerIcon: () => <Text style={{ color: colors.neonBlue }}>➕</Text> }}
      />
      <Drawer.Screen
        name="Requests"
        component={CrossTeamRequestsScreen}
        options={{ drawerIcon: () => <Text style={{ color: colors.neonBlue }}>📨</Text> }}
      />
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ drawerIcon: () => <Text style={{ color: colors.neonBlue }}>🔔</Text> }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ drawerIcon: () => <Text style={{ color: colors.neonBlue }}>👤</Text> }}
      />
    </Drawer.Navigator>
  );
}
