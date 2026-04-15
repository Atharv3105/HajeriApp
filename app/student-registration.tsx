import { MarathiText } from "@/components/MarathiText";
import { t } from "@/localization";
import { addStudent, getStudentById, Student, updateStudent } from "@/services/databaseService";
import { enrollFaceViaAPI } from "@/services/faceRecognitionService";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function StudentRegistrationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [permission, requestPermission] = useCameraPermissions();
  const [name, setName] = useState((params.editName as string) || "");
  const [className, setClassName] = useState((params.editClass as string) || "");
  const [rollNumber, setRollNumber] = useState((params.editRoll as string) || "");
  const [parentPhone, setParentPhone] = useState((params.editParentPhone as string) || "");
  
  const isEditing = !!params.editId;
  
  const [showCamera, setShowCamera] = useState(false);
  const [faceBase64, setFaceBase64] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCaptureIntent = async () => {
    if (permission?.status !== "granted") {
      const result = await requestPermission();
      if (result.status !== "granted") {
        return Alert.alert(
          "Permission required",
          "Camera access is required to capture face."
        );
      }
    }
    setShowCamera(true);
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.3 });
        if (photo.base64) {
          setFaceBase64(photo.base64);
          setShowCamera(false);
          Alert.alert("Captured", "Face captured successfully!");
        }
      } catch (err) {
        Alert.alert("Error", "Failed to take photo.");
      }
    }
  };

  const saveStudent = async () => {
    if (!name.trim() || !className.trim() || !rollNumber.trim()) {
      return Alert.alert("Missing fields", "Please complete all required fields.");
    }
    
    // In add mode, face is strictly required. In edit mode, it's optional if they don't want to change it.
    if (!isEditing && !faceBase64) {
      return Alert.alert("Missing Photo", "Please capture a face photo first.");
    }

    setIsSaving(true);
    try {
      let faceDataToSave = faceBase64 ? "enrolled" : "preserved";
      
      if (isEditing && !faceBase64) {
        // Fetch original to preserve old faceData if we didn't recapture
        const existing = await getStudentById(params.editId as string);
        if (existing) {
          faceDataToSave = existing.faceData;
        }
      }

      const newStudentId = isEditing ? (params.editId as string) : `ST-${Date.now()}`;
      
      const student: Student = {
        id: newStudentId,
        name: name.trim(),
        className: className.trim(),
        rollNumber: Number(rollNumber),
        parentPhone: parentPhone.trim(),
        faceData: faceDataToSave,
        schoolId: 'S001',
      };

      // 1. Send data to Local DB (First!)
      if (isEditing) {
        await updateStudent(student);
      } else {
        await addStudent(student);
      }
      
      console.log("[StudentRegistration] Local save successful for ID:", newStudentId);

      // 2. Transmit to Backend for ML extraction - Only if local save worked
      if (faceBase64) {
        try {
            await enrollFaceViaAPI(newStudentId, faceBase64, student.name, student.rollNumber, student.parentPhone || "", student.className);
        } catch (apiErr) {
            console.error("ML Enrollment failed, but local record saved:", apiErr);
        }
      }

      Alert.alert("Saved", isEditing ? "Student details updated successfully!" : "Student registered dynamically with facial embeddings!");
      router.replace((isEditing ? "/(teacher)/students" : "/(app)/dashboard") as any);
    } catch (e: any) {
      Alert.alert("Enrollment Failed", e.message || "Could not register face to API.");
    } finally {
      setIsSaving(false);
    }
  };

  if (showCamera) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />
        <TouchableOpacity style={styles.captureCircle} onPress={takePhoto}>
          <View style={styles.innerCircle} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCamera(false)}>
           <MarathiText color="#fff" bold>Cancel</MarathiText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <MarathiText bold size={24} color="#1e293b">
            विद्यार्थी नोंदणी
          </MarathiText>
          <MarathiText size={14} color="#64748b" style={{ marginTop: -2 }}>
            Register New Student
          </MarathiText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Name Field */}
        <View style={styles.fieldWrapper}>
          <View style={styles.fieldHeader}>
            <MaterialCommunityIcons name="account-details" size={22} color="#0d9488" style={{ marginRight: 6 }} />
            <MarathiText bold size={16} color="#334155">
              विद्यार्थ्याचे नाव <MarathiText size={12} color="#94a3b8">(Student Name)</MarathiText>
            </MarathiText>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="उदा. श्रेयस पाटील"
            placeholderTextColor="#cbd5e1"
          />
        </View>

        {/* Class Field */}
        <View style={styles.fieldWrapper}>
          <View style={styles.fieldHeader}>
            <MaterialCommunityIcons name="google-classroom" size={22} color="#f59e0b" style={{ marginRight: 6 }} />
            <MarathiText bold size={16} color="#334155">
              वर्ग <MarathiText size={12} color="#94a3b8">(Class)</MarathiText>
            </MarathiText>
          </View>
          <TextInput
            value={className}
            onChangeText={setClassName}
            style={styles.input}
            placeholder="उदा. १० वी अ"
            placeholderTextColor="#cbd5e1"
          />
        </View>

        {/* Roll Number Field */}
        <View style={styles.fieldWrapper}>
          <View style={styles.fieldHeader}>
            <MaterialCommunityIcons name="format-list-numbered" size={22} color="#8b5cf6" style={{ marginRight: 6 }} />
            <MarathiText bold size={16} color="#334155">
              रोल नंबर <MarathiText size={12} color="#94a3b8">(Roll No)</MarathiText>
            </MarathiText>
          </View>
          <TextInput
            value={rollNumber}
            onChangeText={setRollNumber}
            style={styles.input}
            placeholder="उदा. 45"
            keyboardType="numeric"
            placeholderTextColor="#cbd5e1"
          />
        </View>

        {/* Parent Contact Number Field */}
        <View style={styles.fieldWrapper}>
          <View style={styles.fieldHeader}>
            <MaterialCommunityIcons name="phone-outline" size={22} color="#ec4899" style={{ marginRight: 6 }} />
            <MarathiText bold size={16} color="#334155">
              पालकांचा संपर्क क्र. <MarathiText size={12} color="#94a3b8">(Parent Mobile)</MarathiText>
            </MarathiText>
          </View>
          <TextInput
            value={parentPhone}
            onChangeText={setParentPhone}
            style={styles.input}
            placeholder="उदा. 9876543210"
            keyboardType="phone-pad"
            placeholderTextColor="#cbd5e1"
          />
        </View>

        {/* Photo Capture Section */}
        <View style={[styles.fieldWrapper, { backgroundColor: 'transparent', borderWidth: 0, padding: 0 }]}>
          <TouchableOpacity style={styles.captureButton} onPress={handleCaptureIntent}>
            <MaterialCommunityIcons 
              name={faceBase64 ? "camera-retake" : "camera-plus"} 
              size={28} 
              color="#fff" 
              style={{ marginBottom: 6 }} 
            />
            <MarathiText bold size={18} color="#fff">
              {faceBase64 ? "पुन्हा फोटो घ्या" : isEditing ? "नवीन फोटो अपलोड करा" : "फोटो काढा"}
            </MarathiText>
            <MarathiText size={12} color="rgba(255,255,255,0.8)">
              {faceBase64 ? "(Retake Photo)" : isEditing ? "(Update Photo)" : "(Capture Face)"}
            </MarathiText>
          </TouchableOpacity>
          
          <View style={styles.statusIndicator}>
            <MaterialCommunityIcons 
              name={faceBase64 || isEditing ? "check-circle" : "alert-circle-outline"} 
              size={18} 
              color={faceBase64 || isEditing ? "#10b981" : "#f59e0b"} 
            />
            <MarathiText size={14} color="#475569" style={{ marginLeft: 6 }}>
              {faceBase64 ? "फोटो यशस्वीरित्या सेव्ह झाला ✅" : isEditing ? "सध्याचा फोटो वापरला जात आहे ✅" : "फोटो अद्याप काढलेला नाही ⚠️"}
            </MarathiText>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && { backgroundColor: "#94a3b8" }]} 
          onPress={saveStudent} 
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
          ) : (
            <MaterialCommunityIcons name="content-save-all-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
          )}
          <View style={{ alignItems: "center" }}>
            <MarathiText bold size={20} color="#fff">
              {isSaving ? "सेव्ह करत आहे..." : "संरक्षित करा"}
            </MarathiText>
            {!isSaving && (
              <MarathiText size={12} color="rgba(255,255,255,0.8)" style={{ marginTop: -2 }}>
                (Save Database)
              </MarathiText>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backBtn: {
    padding: 8,
    marginRight: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  fieldWrapper: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#1e293b",
    fontFamily: "NotoSansDevanagari_400Regular",
  },
  captureButton: {
    backgroundColor: "#0ea5e9",
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0ea5e9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: "#16a34a",
    borderRadius: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#16a34a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  captureCircle: {
      position: 'absolute',
      bottom: 40,
      alignSelf: 'center',
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  innerCircle: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#fff',
  },
  cancelBtn: {
      position: 'absolute',
      top: 50,
      left: 20,
      padding: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 12,
  }
});
