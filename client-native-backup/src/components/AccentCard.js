import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

export default function AccentCard({ children, accent }) {
  return <View style={[styles.card, accent ? { borderColor: accent } : null]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#00AAFF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
});
