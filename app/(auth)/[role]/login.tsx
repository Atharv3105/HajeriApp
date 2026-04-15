import { MarathiText } from "@/components/MarathiText";
import { Role, useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    Dimensions,
    StyleSheet,
    TouchableOpacity,
    View,
    TextInput,
    ActivityIndicator,
} from "react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from "react-native-safe-area-context";
import { findTeacherByPhone, findTeacherByPIN, findStudentByPIN, getStudentById, getTeacherById, findParentByPhone, findStudentsByParentPhone, addParent } from "@/services/databaseService";
import { verifyFaceViaAPI } from "@/services/faceRecognitionService";
import { useIsFocused } from "@react-navigation/native";

const { width } = Dimensions.get("window");
 
const getRoleLabel = (role: Role, t: any) => {
  switch (role) {
    case "teacher": return t("auth.teacher");
    case "student": return t("auth.student");
    case "parent": return t("auth.parent");
    default: return "";
  }
};

type Params = {
  role?: string;
};

export default function RoleLoginScreen() {
  const params = useLocalSearchParams<Params>();
  const router = useRouter();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const role = (params.role as Role) || "teacher";
  const translatedRole = getRoleLabel(role, t);

  const [mode, setMode] = useState<"face" | "pin">(role === "parent" ? "pin" : "face");
  const [pin, setPin] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [onboardingStep, setOnboardingStep] = useState<"phone" | "pin_entry" | "pin_setup" | "pin_confirm">(role === 'parent' ? "phone" : "pin_entry");
  const [setupPIN, setSetupPIN] = useState("");
  
  const { setUser } = useAuthStore();
  const cameraRef = React.useRef<any>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const isFocused = useIsFocused();

  const handleLoginSuccess = (user: any) => {
    setUser(user, "real_token");
    router.replace("/(app)/dashboard");
  };

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [scanStatus, setScanStatus] = useState<"idle" | "detecting" | "verifying" | "success" | "fail">("idle");
  const [lastScanTime, setLastScanTime] = useState(0);
  const [isMatched, setIsMatched] = useState(false);

  // Reanimated Animation for Scanning Bar
  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(276, { duration: 1500, easing: Easing.linear }),
      -1,
      true
    );
  }, []);

  const animatedScanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Parent Phone Check logic
  useEffect(() => {
    const checkParent = async () => {
        if (role === 'parent' && phoneNumber.length === 10 && onboardingStep === 'phone') {
            const parent = await findParentByPhone(phoneNumber);
            if (parent) {
                setOnboardingStep("pin_entry");
            } else {
                const linkedStudents = await findStudentsByParentPhone(phoneNumber);
                if (linkedStudents.length > 0) {
                    Alert.alert("स्वागत आहे!", "आपला मोबाईल नंबर आढळला आहे. कृपया लॉगिन करण्यासाठी एक ४-अंकी पिन सेट करा.");
                    setOnboardingStep("pin_setup");
                } else {
                    Alert.alert("त्रुटी", "हा मोबाईल नंबर कोणत्याही विद्यार्थ्याशी जोडलेला नाही. कृपया शिक्षकांशी संपर्क साधा.");
                    setPhoneNumber("");
                }
            }
        }
    };
    checkParent();
  }, [phoneNumber, role, onboardingStep]);

  // Automatic Face Scanning (Reverted to stable interval polling)
  useEffect(() => {
    let interval: any;
    if (isFocused && mode === 'face' && permission?.granted && !isAuthenticating && !isMatched && isCameraReady) {
      interval = setInterval(async () => {
        const now = Date.now();
        if (now - lastScanTime > 3000) { // Scan every 3 seconds
            autoFaceLogin();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFocused, mode, permission, isAuthenticating, lastScanTime, isMatched, isCameraReady]);

  const autoFaceLogin = async () => {
    if (!cameraRef.current || isAuthenticating || isMatched || !isCameraReady) return;
    
    setIsAuthenticating(true);
    setScanStatus("verifying");

    try {
      const photo = await cameraRef.current.takePictureAsync({ 
          base64: true, 
          quality: 0.2 // Balanced quality
      });
      
      if (photo.base64) {
        const result = await verifyFaceViaAPI(photo.base64);
        setLastScanTime(Date.now());

        if (result && result.studentId) {
            const { studentId, role: matchedRole } = result;
            console.log(`[FaceLogin] Match found! ID: ${studentId} Role: ${matchedRole}`);
            setScanStatus("success");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            // Cross-Role Recognition & Local DB Verification
            // We prioritize the local DB presence over the server's role label
            const localTeacher = await getTeacherById(studentId);
            const localStudent = await getStudentById(studentId);

            if (role === 'teacher' && localTeacher) {
                setIsMatched(true);
                handleLoginSuccess({ id: localTeacher.id, name: localTeacher.name, role: "teacher" });
                return;
            } 
            
            if (role === 'student' && localStudent) {
                setIsMatched(true);
                handleLoginSuccess({ 
                    id: localStudent.id, 
                    name: localStudent.name, 
                    role: "student",
                    className: localStudent.className 
                });
                return;
            }

            if (role === 'parent' && localStudent) {
                setIsMatched(true);
                handleLoginSuccess({ 
                    id: localStudent.id, 
                    name: `Parent of ${localStudent.name}`, 
                    role: "parent", 
                    studentId: localStudent.id,
                    className: localStudent.className
                });
                return;
            }

            // If we are here, the server found a match, but the local DB doesn't have it FOR THIS ROLE
            if (matchedRole !== role) {
                if (matchedRole === 'teacher') {
                    Alert.alert("भूमिका तपासा", "तुमची नोंदणी 'शिक्षक' म्हणून झालेली आहे. कृपया शिक्षक म्हणून लॉगिन करा.");
                } else if (matchedRole === 'student') {
                    Alert.alert("भूमिका तपासा", "आपली नोंदणी 'विद्यार्थी' म्हणून आहे.");
                }
                setScanStatus("fail");
            } else {
                console.log(`[FaceLogin] ID ${studentId} matched but local DB is missing it.`);
                Alert.alert("ओळख पटली नाही", "तुमचा चेहरा ओळखला गेला आहे, पण या डिव्हाइसवर तुमची माहिती उपलब्ध नाही. कृपया पिन वापरून किंवा पुन्हा नोंदणी करून लॉगिन करा.");
                setScanStatus("fail");
            }
        } else {
            setLastScanTime(Date.now());
        }
      }
    } catch (e) {
      console.log('Face scan failed', e);
    } finally {
      setIsAuthenticating(false);
      if (!isMatched) {
          setTimeout(() => setScanStatus("detecting"), 1000);
      }
    }
  };

  const handleFaceLogin = async () => {
    if (isMatched || isAuthenticating) return;
    autoFaceLogin();
  };

  const handlePinPress = async (value: string) => {
    if (value === "⌫") {
      setPin((prev) => prev.slice(0, -1));
      return;
    }

    if (pin.length >= 4) return;
    const nextPin = pin + value;
    setPin(nextPin);

    if (nextPin.length === 4) {
      if (role === 'teacher') {
          const t = await findTeacherByPIN(nextPin);
          if (t) {
             handleLoginSuccess({ id: t.id, name: t.name, role: 'teacher' });
          } else {
              Alert.alert("Error", "Invalid PIN");
              setPin("");
          }
      } else if (role === 'parent') {
          if (onboardingStep === 'pin_entry') {
            const p = await findParentByPhone(phoneNumber);
            if (p && p.pin === nextPin) {
                handleLoginSuccess({ id: p.id, name: p.name, role: 'parent', studentId: p.studentId, phone: phoneNumber });
            } else {
                Alert.alert("त्रुटी", "पिन चुकीचा आहे.");
                setPin("");
            }
          } else if (onboardingStep === 'pin_setup') {
              setSetupPIN(nextPin);
              setPin("");
              setOnboardingStep("pin_confirm");
          } else if (onboardingStep === 'pin_confirm') {
              if (nextPin === setupPIN) {
                  const linkedStudents = await findStudentsByParentPhone(phoneNumber);
                  const firstStudent = linkedStudents[0];
                  const newParent = {
                      id: `PR-${Date.now()}`,
                      name: `Parent of ${firstStudent.name}`,
                      phone: phoneNumber,
                      pin: nextPin,
                      studentId: firstStudent.id
                  };
                  await addParent(newParent);
                  Alert.alert("यशस्वी", "आपला पिन यशस्वीरित्या सेट झाला आहे!");
                  handleLoginSuccess({ ...newParent, role: 'parent', className: firstStudent.className });
              } else {
                  Alert.alert("त्रुटी", "पिन जुळत नाही. कृपया पुन्हा प्रयत्न करा.");
                  setPin("");
                  setOnboardingStep("pin_setup");
              }
          }
      } else {
          const student = await findStudentByPIN(nextPin);
          if (student) {
              handleLoginSuccess({ 
                id: student.id, 
                name: student.name, 
                role: "student",
                className: student.className
              });
          } else {
              Alert.alert("त्रुटी", "पिन चुकीचा आहे.");
              setPin("");
          }
      }
    }
  };

  const renderNumpad = () => {
    const nums = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];
    return (
      <View style={styles.numpad}>
        {nums.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.numButton, item === "" && { opacity: 0 }]}
            onPress={() => item && handlePinPress(item)}
            disabled={item === ""}
          >
            <MarathiText bold size={28} color="#0d9488">{item}</MarathiText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#0d9488" />
        </TouchableOpacity>
        <MarathiText bold size={24} color="#0d9488">{translatedRole}</MarathiText>
        <View style={{ width: 28 }} />
      </View>

      {role !== 'parent' && (
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "face" && styles.activeToggle]}
            onPress={() => setMode("face")}
          >
            <MaterialCommunityIcons name="face-recognition" size={24} color={mode === "face" ? "#fff" : "#0d9488"} />
            <MarathiText size={14} color={mode === "face" ? "#fff" : "#0d9488"}>चेहरा</MarathiText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "pin" && styles.activeToggle]}
            onPress={() => setMode("pin")}
          >
            <MaterialCommunityIcons name="numeric" size={24} color={mode === "pin" ? "#fff" : "#0d9488"} />
            <MarathiText size={14} color={mode === "pin" ? "#fff" : "#0d9488"}>पिन</MarathiText>
          </TouchableOpacity>
        </View>
      )}

      {mode === "face" ? (
        <View style={styles.cameraContainer}>
          {(permission?.granted && isFocused) ? (
            <View style={{ flex: 1 }}>
              <CameraView 
                ref={cameraRef} 
                style={styles.camera} 
                facing="front" 
                onCameraReady={() => setIsCameraReady(true)}
              />
              <View style={[styles.cameraOverlay, StyleSheet.absoluteFill]}>
                <View style={[styles.scanFrame, (isAuthenticating || isMatched) && { borderColor: isMatched ? '#10b981' : '#f59e0b' }]}>
                  {!isMatched && (
                    <Animated.View style={[styles.scanLine, animatedScanLineStyle]} />
                  )}
                </View>

                <View style={styles.statusBadge}>
                    {(isAuthenticating && !isMatched) && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                    <MarathiText bold size={16} color="#fff">
                        {isMatched ? "यशस्वी (Matched!)" : 
                         scanStatus === "verifying" ? "ओळख पटवत आहे (Verifying...)" : 
                         scanStatus === "fail" ? "पुन्हा प्रयत्न करा (Try Again)" :
                         "चेहरा स्कॅन करत आहे (Scanning...)"}
                    </MarathiText>
                </View>

                <MarathiText size={14} color="rgba(255,255,255,0.7)" style={styles.scanSubText}>
                  {isMatched ? "प्रवेश मंजूर" : "कॅमेरा समोर स्थिर राहा"}
                </MarathiText>
              </View>
            </View>
          ) : (
            <View style={styles.noPermission}>
              <MaterialCommunityIcons name="camera-off" size={64} color="#9ca3af" />
              <MarathiText color="#6b7280" style={{ marginTop: 16 }}>Camera Permission Required</MarathiText>
              <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                <MarathiText bold color="#fff">Grant Permission</MarathiText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.pinContainer}>
          <MarathiText bold size={20} color="#1f2937" style={{ marginBottom: role === 'parent' ? 12 : 24 }}>
            {role === 'parent' ? (
                onboardingStep === 'pin_setup' ? "नवीन पिन सेट करा (Set PIN)" :
                onboardingStep === 'pin_confirm' ? "पिनची खात्री करा (Confirm PIN)" :
                onboardingStep === 'pin_entry' ? "आपला ४-अंकी पिन टाका (Enter PIN)" :
                "मोबाईल नंबर (Mobile Number)"
            ) : t("auth.pin_prompt")}
          </MarathiText>

          {role === 'parent' && onboardingStep === 'phone' && (
            <View style={styles.phoneInputRow}>
              <MaterialCommunityIcons name="phone" size={20} color="#0d9488" />
              <TextInput
                placeholder="मोबाईल नंबर टाका"
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          )}

          {onboardingStep !== 'phone' && (
            <View style={styles.pinDots}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.dot, pin.length > i && styles.activeDot]} />
              ))}
            </View>
          )}

          {onboardingStep !== 'phone' ? renderNumpad() : <View style={{ height: 200 }} />}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push({ pathname: "/(auth)/register", params: { role } } as any)}>
          <MarathiText bold color="#0d9488" size={16}>नवीन खाते तयार करा (Register Now)</MarathiText>
        </TouchableOpacity>
        <MarathiText size={12} color="#9ca3af" style={{ marginTop: 12 }}>v1.0.0 | High Security | Production Mode</MarathiText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  backButton: { padding: 8 },
  modeToggle: { flexDirection: "row", marginHorizontal: 48, backgroundColor: "#f3f4f6", borderRadius: 12, padding: 4, marginBottom: 32 },
  toggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: 10, gap: 8 },
  activeToggle: { backgroundColor: "#0d9488" },
  cameraContainer: { flex: 1, marginHorizontal: 24, borderRadius: 24, overflow: "hidden", backgroundColor: "#000" },
  camera: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" },
  scanFrame: { width: 280, height: 280, borderWidth: 4, borderColor: "#0d9488", borderRadius: 40, borderStyle: "dashed" },
  scanLine: { width: "100%", height: 4, backgroundColor: "#0d9488", opacity: 0.8, borderRadius: 2, shadowColor: "#0d9488", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 10, elevation: 10 },
  scanSubText: { marginTop: 8, textAlign: "center" },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 20 },
  pinContainer: { flex: 1, alignItems: "center", paddingHorizontal: 24 },
  pinDots: { flexDirection: "row", justifyContent: "center", gap: 16, marginBottom: 32 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#d1d5db", marginHorizontal: 8 },
  activeDot: { backgroundColor: "#0d9488", borderColor: "#0d9488" },
  numpad: { width: width - 48, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  numButton: { width: (width - 72) / 3, height: (width - 72) / 3, borderRadius: 20, backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  phoneInputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 12, paddingHorizontal: 16, height: 56, width: width - 48, marginBottom: 24, borderWidth: 1, borderColor: "#e5e7eb" },
  phoneInput: { flex: 1, marginLeft: 12, fontSize: 16, color: "#1f2937" },
  footer: { alignItems: "center", paddingBottom: 24 },
  noPermission: { flex: 1, justifyContent: "center", alignItems: "center" },
  permBtn: { backgroundColor: "#0d9488", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 24 },
});
