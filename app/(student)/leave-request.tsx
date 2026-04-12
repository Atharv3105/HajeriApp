import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MarathiText } from '@/components/MarathiText';
import { leaveRepo } from '@/services/db/leaveRepo';
import { useAuthStore } from '@/store/authStore';

export default function LeaveRequestScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('माहिती भरा', 'कृपया रजेचे कारण लिहा.');
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { role } = useAuthStore.getState();

      // If parent is applying, we use their linked child studentId
      const targetStudentId = (role === 'parent' && (user as any).studentId) ? (user as any).studentId : user.id;
      
      let className = (user as any).className || 'Unknown';
      if (role === 'parent' && targetStudentId) {
          const { getStudentById } = require("@/services/databaseService");
          const s = await getStudentById(targetStudentId);
          if (s) className = s.class_name || 'Unknown';
      }

      await leaveRepo.submitRequest(targetStudentId, className, today, today, 'personal', reason);

      const successMsg = role === 'parent' 
        ? 'रजा अर्ज यशस्वीरित्या शिक्षकांकडे पाठवण्यात आला आहे.'
        : 'तुमची विनंती पालकांकडे पाठवण्यात आली आहे.';

      Alert.alert('यशस्वी', successMsg, [
        { text: 'ठीक आहे', onPress: () => router.back() }
      ]);
    } catch (err) {
      console.error(err);
      Alert.alert('त्रुटी', 'विनंती पाठवता आली नाही.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#2563eb" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#2563eb">रजा अर्ज</MarathiText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={24} color="#2563eb" />
          <MarathiText size={14} color="#1e40af" style={{ marginLeft: 12, flex: 1 }}>
            रजा मंजूर होण्यासाठी तुमच्या पालकांनी आणि नंतर तुमच्या शिक्षकांनी मान्यता देणे आवश्यक आहे.
          </MarathiText>
        </View>

        <MarathiText bold size={18} color="#374151" style={{ marginBottom: 12 }}>रजेचे कारण</MarathiText>
        <TextInput
          style={styles.input}
          placeholder="येथे लिहा..."
          multiline
          numberOfLines={6}
          value={reason}
          onChangeText={setReason}
          textAlignVertical="top"
        />

        <TouchableOpacity 
          style={[styles.submitBtn, loading && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <MaterialCommunityIcons name="send" size={24} color="#fff" />
          <MarathiText bold size={20} color="#fff" style={{ marginLeft: 12 }}>
            अर्ज पाठवा
          </MarathiText>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    padding: 24,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#ebf5ff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    height: 150,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 40,
    textAlign: 'left'
  },
  submitBtn: {
    backgroundColor: '#2563eb',
    height: 64,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});
