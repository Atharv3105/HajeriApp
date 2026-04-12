import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MarathiText } from '@/components/MarathiText';
import { useAttendanceStore } from '@/store/attendanceStore';

export default function VoiceRollCallScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { students, records, markStudent } = useAttendanceStore();
  
  // Only show students who were not detected by face scan
  const pendingStudents = students.filter(s => !records.has(s.id));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const currentStudent = pendingStudents[currentIndex];
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isListening) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();

      // Mock "Hajir" detection after 1.5 seconds
      const timeout = setTimeout(() => {
        // handleMark('present');
      }, 1500);
      return () => {
        clearTimeout(timeout);
        if (loop) loop.stop();
      };
    }

    pulseAnim.setValue(1);
    return;
  }, [isListening, currentIndex, pulseAnim]);

  const handleMark = (status: 'present' | 'absent') => {
    if (!currentStudent) return;
    
    markStudent(currentStudent.id, status, 'voice');
    
    if (currentIndex < pendingStudents.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsListening(false);
    } else {
      router.push('/(teacher)/session/manual');
    }
  };

  if (!currentStudent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="check-decagram" size={64} color="#10b981" />
          <MarathiText bold size={24} color="#1f2937">सर्व विद्यार्थी ओळखले!</MarathiText>
          <TouchableOpacity style={styles.nextBtn} onPress={() => router.push('/(teacher)/session/manual')}>
            <MarathiText bold color="#fff">पुढे जा </MarathiText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#0d9488" />
        </TouchableOpacity>
        <MarathiText bold size={22} color="#0d9488">{t('teacher.voice_callout')}</MarathiText>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.progressHeader}>
         <MarathiText size={16} color="#6b7280">विद्यार्थी: {currentIndex + 1} / {pendingStudents.length}</MarathiText>
      </View>

      <View style={styles.content}>
        <View style={styles.studentCard}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={48} color="#0d9488" />
          </View>
          <MarathiText bold size={32} color="#1f2937">{currentStudent.name}</MarathiText>
          <MarathiText size={18} color="#6b7280">रोल नंबर: {currentStudent.roll_number}</MarathiText>
        </View>

        <TouchableOpacity 
          style={styles.micCircle} 
          onPressIn={() => setIsListening(true)}
          onPressOut={() => setIsListening(false)}
        >
          <Animated.View style={[styles.pulse, { transform: [{ scale: pulseAnim }], opacity: isListening ? 1 : 0.2 }]} />
          <MaterialCommunityIcons name={isListening ? "microphone" : "microphone-outline"} size={48} color="#fff" />
        </TouchableOpacity>

        <MarathiText size={16} color="#6b7280" style={{ marginTop: 16 }}>
          {isListening ? "ऐकत आहे... 'हजर' म्हणा" : "मायक्रोफोन दाबा आणि बोला"}
        </MarathiText>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.absentBtn]} onPress={() => handleMark('absent')}>
            <MaterialCommunityIcons name="close" size={32} color="#fff" />
            <MarathiText bold color="#fff">अनुपस्थित</MarathiText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.presentBtn]} onPress={() => handleMark('present')}>
            <MaterialCommunityIcons name="check" size={32} color="#fff" />
            <MarathiText bold color="#fff">उपस्थित</MarathiText>
          </TouchableOpacity>
        </View>
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
  },
  backBtn: {
    padding: 8,
  },
  progressHeader: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: 24,
  },
  studentCard: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0fdfa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  micCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  pulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0d948833',
    borderRadius: 60,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  absentBtn: {
    backgroundColor: '#ef4444',
  },
  presentBtn: {
    backgroundColor: '#10b981',
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtn: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
});
