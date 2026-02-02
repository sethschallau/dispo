/**
 * Custom Tab Bar
 *
 * Organic blob-shaped tab bar with chrome/ethereal styling
 */

import Theme from '@/constants/Theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const TAB_BAR_HEIGHT = 70;

// Organic blob path for the tab bar background
const BlobBackground = () => (
  <Svg
    width="100%"
    height={TAB_BAR_HEIGHT + 30}
    viewBox="0 0 400 100"
    preserveAspectRatio="none"
    style={styles.svgBackground}
  >
    <Defs>
      <LinearGradient id="blobGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor={Theme.colors.backgroundCard} stopOpacity="0.98" />
        <Stop offset="100%" stopColor={Theme.colors.background} stopOpacity="1" />
      </LinearGradient>
      <LinearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="0%" stopColor={Theme.colors.border} stopOpacity="0" />
        <Stop offset="20%" stopColor={Theme.colors.borderLight} stopOpacity="1" />
        <Stop offset="50%" stopColor={Theme.colors.accent} stopOpacity="0.3" />
        <Stop offset="80%" stopColor={Theme.colors.borderLight} stopOpacity="1" />
        <Stop offset="100%" stopColor={Theme.colors.border} stopOpacity="0" />
      </LinearGradient>
    </Defs>
    {/* Main blob shape - organic curves */}
    <Path
      d="M0,30
         C40,10 80,5 120,8
         C160,11 200,5 240,8
         C280,11 320,5 360,10
         C380,15 400,20 400,30
         L400,100 L0,100 Z"
      fill="url(#blobGradient)"
    />
    {/* Top border with gradient */}
    <Path
      d="M0,30
         C40,10 80,5 120,8
         C160,11 200,5 240,8
         C280,11 320,5 360,10
         C380,15 400,20 400,30"
      fill="none"
      stroke="url(#borderGradient)"
      strokeWidth="1"
    />
  </Svg>
);

interface TabIconProps {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  focused: boolean;
}

const TabIcon = ({ name, focused }: TabIconProps) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
    <FontAwesome
      name={name}
      size={22}
      color={focused ? Theme.colors.accent : Theme.colors.chromeDim}
    />
    {focused && <View style={styles.activeIndicator} />}
  </View>
);

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const icons: Record<string, React.ComponentProps<typeof FontAwesome>['name']> = {
    index: 'calendar',
    groups: 'users',
    profile: 'user',
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BlobBackground />
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tab}
            >
              <TabIcon name={icons[route.name] || 'circle'} focused={isFocused} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  svgBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  iconContainerActive: {
    backgroundColor: Theme.colors.chromeTint,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.accent,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
