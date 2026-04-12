import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#db2777', // Pink/Raspberry for parent
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 12,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
        },
        tabBarLabelStyle: {
          fontFamily: 'NotoSansDevanagari',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'माझे मूल', // My Child in Marathi
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-child-outline" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leave-approval"
        options={{
          title: 'रजा मंजुरी', // Leave Approval in Marathi
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="leaf" size={32} color={color} />
          ),
          tabBarBadge: 1,
          tabBarBadgeStyle: { backgroundColor: '#db2777' }
        }}
      />
      <Tabs.Screen
        name="attendance-history"
        options={{
          title: 'हजेरी', // Attendance in Marathi
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month-outline" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'सूचना', // Notifications in Marathi
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bell-outline" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="bus" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
      <Tabs.Screen name="meal" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
