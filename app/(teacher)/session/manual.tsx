import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MarathiText } from '@/components/MarathiText';
import { useAttendanceStore } from '@/store/attendanceStore';

export default function ManualOverrideScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { students, records, markStudent } = useAttendanceStore();

  const renderItem = ({ item }: { item: any }) => {
    const record = records.get(item.id);
    const isPresent = record?.status === 'present';
    const isAbsent = record?.status === 'absent';

    return (
      <View style={styles.recordItem}>
        <View style={styles.studentInfo}>
          <MarathiText bold size={18} color="#1f2937">{item.name}</MarathiText>
          <MarathiText size={14} color="#6b7280">रोल नंबर: {item.roll_number}</MarathiText>
          {record?.method && (
            <View style={styles.methodTag}>
               <MaterialCommunityIcons 
                 name={record.method === 'face' ? 'face-recognition' : record.method === 'voice' ? 'microphone' : 'hand-pointing-right'} 
                 size={12} 
                 color="#6b7280" 
               />
               <MarathiText size={10} color="#6b7280" style={{ marginLeft: 4 }}>
                 {record.method === 'face' ? 'चेहरा' : record.method === 'voice' ? 'आवाज' : 'मॅन्युअल'}
               </MarathiText>
            </View>
          )}
        </View>

        <View style={styles.actionBlock}>
          <TouchableOpacity 
            style={[styles.smallBtn, styles.absentBtn, isAbsent && styles.activeAbsent]} 
            onPress={() => markStudent(item.id, 'absent', 'manual')}
          >
            <MaterialCommunityIcons name="close" size={24} color={isAbsent ? "#fff" : "#dc2626"} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.smallBtn, styles.presentBtn, isPresent && styles.activePresent]} 
            onPress={() => markStudent(item.id, 'present', 'manual')}
          >
            <MaterialCommunityIcons name="check" size={24} color={isPresent ? "#fff" : "#10b981"} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#0d9488" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#0d9488">{t('teacher.manual_override')}</MarathiText>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
           <View style={styles.listHeader}>
             <MarathiText size={14} color="#6b7280">सर्व विद्यार्थ्यांची हजेरी तपासा</MarathiText>
           </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveBtn} 
          onPress={() => router.push('/(teacher)/session/summary')}
        >
          <MarathiText bold size={20} color="#fff">{t('teacher.save_attendance')}</MarathiText>
          <MaterialCommunityIcons name="check-all" size={24} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backBtn: {
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  listHeader: {
    marginBottom: 16,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  studentInfo: {
    flex: 1,
  },
  methodTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  actionBlock: {
    flexDirection: 'row',
    gap: 12,
  },
  smallBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  absentBtn: {
    borderColor: '#fee2e2',
    backgroundColor: '#fff',
  },
  presentBtn: {
    borderColor: '#ecfdf5',
    backgroundColor: '#fff',
  },
  activeAbsent: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  activePresent: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  saveBtn: {
    backgroundColor: '#0d9488',
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
