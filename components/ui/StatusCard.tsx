import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MarathiText } from '@/components/MarathiText';

interface StatusCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  onPress?: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({ label, value, icon, color, onPress }) => {
  return (
    <TouchableOpacity 
      style={[styles.card, { borderColor: color + '22' }]} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '11' }]}>
        <MaterialCommunityIcons name={icon as any} size={32} color={color} />
      </View>
      <View style={styles.textContainer}>
        <MarathiText bold size={24} color="#1f2937">{value}</MarathiText>
        <MarathiText size={13} color="#6b7280">{label}</MarathiText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minWidth: '45%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
});
