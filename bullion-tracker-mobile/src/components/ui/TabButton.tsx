import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../lib/colors';

interface TabButtonProps {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
  badge?: number;
}

export function TabButton({ icon, label, active, onPress, badge }: TabButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.tabButton}>
      <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      {badge !== undefined && badge > 0 && (
        <View style={styles.tabBadge}>
          <Text style={styles.tabBadgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    position: 'relative',
  },
  tabIcon: {
    fontSize: 22,
    color: '#bbb',
  },
  tabIconActive: {
    color: Colors.textPrimary,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  tabLabelActive: {
    color: Colors.textPrimary,
  },
  tabBadge: {
    position: 'absolute',
    top: 0,
    right: 8,
    backgroundColor: Colors.gold,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});
