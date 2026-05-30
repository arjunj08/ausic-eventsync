import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, glowStyles } from '../theme/theme';

export default function GlowingButton({ title, onPress, variant = 'blue', style, ...props }) {
  const accent = variant === 'orange' ? colors.neonOrange : colors.neonBlue;
  const glow = variant === 'orange' ? glowStyles.orange : glowStyles.blue;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.button, { backgroundColor: accent, borderColor: accent }, glow, style]}
      {...props}
    >
      <Text style={styles.label}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
