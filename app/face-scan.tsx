import { MarathiText } from "@/components/MarathiText";
import { VoiceGuide } from "@/components/VoiceGuide";
import { t } from "@/localization";
import { getStudents, getStudentsByClass, Student } from "@/services/databaseService";
import {
  verifyBulkFaceViaAPI,
} from "@/services/faceRecognitionService";
import { useSettingsStore } from "@/store/settingsStore";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function FaceScanScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const className = params.className as string;
  const timeSlot = params.timeSlot as string;
  const language = useSettingsStore((state) => state.language) || "en";
  
  const [students, setStudents] = useState<Student[]>([]);
  const [permission, requestPermission] = useCameraPermissions();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (className) {
        getStudentsByClass(className).then(setStudents);
    } else {
        getStudents().then(setStudents);
    }
  }, [className]);

  const handleCapture = async () => {
    if (!cameraRef.current || !isCameraReady) {
        Alert.alert("Wait", "Camera is still starting...");
        return;
    }
    
    try {
      // 1. Capture FIRST (do NOT set isProcessing yet, or the camera unmounts!)
      const photo = await cameraRef.current.takePictureAsync({ 
          base64: true, 
          quality: 0.4,
      });
      
      // 2. NOW show the loading state
      setIsProcessing(true);
      
      if (photo.base64) {
        setCapturedImage(photo.uri);
        const detectedIds = await verifyBulkFaceViaAPI(photo.base64, className);
        
        router.push({
          pathname: "/scan-result",
          params: { 
              detected: JSON.stringify(detectedIds), 
              className: className, 
              timeSlot: timeSlot 
          },
        } as any);
      }
    } catch (e: any) {
      console.error('Capture/Verify error:', e);
      Alert.alert("Camera Error", `Capture failed: ${e.message || 'Hardware busy'}. Please try again.`);
      setIsProcessing(false);
    }
  };

  const onRequestPermission = async () => {
    const result = await requestPermission();
    if (result.status !== "granted") {
      Alert.alert("Permission Required", "Camera access is required for attendance.");
    }
  };

  if (isProcessing) {
      return (
          <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#0d9488" />
              <MarathiText bold size={20} color="#0d9488" style={{ marginTop: 20 }}>
                  Analyzing Classroom... (वर्गाचे विश्लेषण करत आहे...)
              </MarathiText>
              <MarathiText size={14} color="#64748b" style={{ marginTop: 8 }}>
                  Identifying all students in the photo
              </MarathiText>
          </View>
      );
  }

  return (
    <SafeAreaView style={styles.container}>
      <VoiceGuide text={language === "mr" ? "कृपया वर्गाचा फोटो घ्या" : "Please take a photo of the classroom"} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <View>
            <MarathiText bold size={20} color="#ffffff">
              Classroom Snapshot
            </MarathiText>
            <MarathiText size={14} color="#34d399">
              {className} • {timeSlot}
            </MarathiText>
        </View>
      </View>

      <View style={styles.cameraContainer}>
        {permission?.status === "granted" ? (
          <View style={{ flex: 1 }}>
            <CameraView
                style={styles.camera}
                ref={cameraRef}
                facing="back" 
                onCameraReady={() => setIsCameraReady(true)}
            />
            <View style={[styles.overlay, StyleSheet.absoluteFill]}>
                <View style={styles.guideline} />
            </View>
          </View>
        ) : (
          <View style={styles.permissionFallback}>
            <MaterialCommunityIcons name="camera-off" size={64} color="#cbd5e1" />
            <TouchableOpacity style={styles.button} onPress={onRequestPermission}>
              <MarathiText bold size={16} color="#fff">Grant Camera Permission</MarathiText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <MarathiText size={14} color="#64748b" style={{ textAlign: 'center', marginBottom: 16 }}>
            Tip: Ensure all students faces are visible and well-lit.
        </MarathiText>
        <TouchableOpacity style={styles.captureBtn} onPress={handleCapture}>
           <View style={styles.captureInner}>
                <MaterialCommunityIcons name="camera" size={32} color="#fff" />
           </View>
           <MarathiText bold size={18} color="#0d9488" style={{ marginTop: 8 }}>Capture Attendance</MarathiText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { marginRight: 16 },
  cameraContainer: { flex: 1, marginHorizontal: 16, borderRadius: 24, overflow: "hidden", backgroundColor: "#000" },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  guideline: { width: '90%', height: '70%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 20, borderStyle: 'dashed' },
  footer: { padding: 30, backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  captureBtn: { alignItems: 'center' },
  captureInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0d9488', justifyContent: 'center', alignItems: 'center', elevation: 8 },
  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  permissionFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: { marginTop: 20, backgroundColor: '#0d9488', padding: 15, borderRadius: 12 }
});