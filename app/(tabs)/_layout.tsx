import CustomTabBar from '@/components/CustomTabBar';
import Theme from '@/constants/Theme';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.colors.background }}>
        <ActivityIndicator size="large" color={Theme.colors.accent} />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
