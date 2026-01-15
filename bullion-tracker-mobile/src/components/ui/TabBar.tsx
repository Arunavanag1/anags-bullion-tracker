import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { TabButton } from './TabButton';
import { Colors } from '../../lib/colors';

/**
 * TabBar - Shared bottom navigation bar
 *
 * Displays Dashboard, Collection, and Photos tabs with active state highlighting.
 * Collection tab supports optional badge for item count.
 *
 * @example
 * <TabBar activeTab="dashboard" onTabPress={(tab) => navigate(tab)} collectionBadge={5} />
 */
type TabName = 'dashboard' | 'collection' | 'collage';

interface TabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  collectionBadge?: number;
}

export function TabBar({ activeTab, onTabPress, collectionBadge }: TabBarProps) {
  return (
    <View style={styles.tabBar}>
      <TabButton
        icon="◎"
        label="Dashboard"
        active={activeTab === 'dashboard'}
        onPress={() => onTabPress('dashboard')}
      />
      <TabButton
        icon="◉"
        label="Collection"
        active={activeTab === 'collection'}
        onPress={() => onTabPress('collection')}
        badge={collectionBadge}
      />
      <TabButton
        icon="❖"
        label="Photos"
        active={activeTab === 'collage'}
        onPress={() => onTabPress('collage')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
});
