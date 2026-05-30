import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'react-native';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AppProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0F" />
      <AppNavigator />
    </AppProvider>
  );
}
