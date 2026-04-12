import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MarathiText } from '@/components/MarathiText';
import { useTranslation } from 'react-i18next';

interface SyncIndicatorProps {
  status: 'synced' | 'pending' | 'failed';
  count: number;
  onPress?: () => void;
}

export const SyncIndicator: React.FC<SyncIndicatorProps> = ({ status, count, onPress }) => {
  const { t } = useTranslation();
  
  const config = {
    synced: { color: '#10b981', icon: 'cloud-check-outline', text: t('teacher.sync_done') },
    pending: { color: '#f59e0b', icon: 'cloud-sync-outline', text: `${count} ${t('teacher.sync_pending')}` },
    failed: { color: '#ef4444', icon: 'cloud-alert-outline', text: 'सर्वर Error' },
  };

  const current = config[status];

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.dot, { backgroundColor: current.color }]} />
      <MarathiText size={12} color="#6b7280" style={{ marginRight: 8 }}>{current.text}</MarathiText>
      <MaterialCommunityIcons name={current.icon as any} size={18} color={current.color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
});
