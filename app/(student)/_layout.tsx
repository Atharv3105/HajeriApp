import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb', // Blue for student
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
        name="attendance"
        options={{
          title: 'माझी हजेरी',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-outline" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scholarship"
        options={{
          title: 'शिष्यवृत्ती',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="school-outline" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leave-request"
        options={{
          title: 'रजा',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="leaf" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dispute"
        options={{
          title: 'तक्रार',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="alert-circle-outline" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timetable"
        options={{
          title: 'वेळापत्रक',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock" size={32} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="results" options={{ href: null }} />
    </Tabs>
  );
}
