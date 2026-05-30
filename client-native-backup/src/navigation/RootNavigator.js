import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AppContext } from '../contexts/AppContext';
import LoginScreen from '../screens/LoginScreen';
import AdminNavigator from './AdminNavigator';
import MemberNavigator from './MemberNavigator';
import { colors } from '../theme/theme';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.background,
    text: colors.text,
    border: colors.border,
    primary: colors.neonBlue,
  },
};

export default function RootNavigator() {
  const { currentUser } = useContext(AppContext);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : currentUser.role === 'admin' ? (
          <Stack.Screen name="AdminRoot" component={AdminNavigator} />
        ) : (
          <Stack.Screen name="MemberRoot" component={MemberNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
