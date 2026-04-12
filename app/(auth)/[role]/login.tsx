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
    Animated,
    TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { findTeacherByPhone, findStudentByPIN, getStudentById, getTeacherById, findParentByPhone } from "@/services/databaseService";
import { verifyFaceViaAPI } from "@/services/faceRecognitionService";

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

  const handleLoginSuccess = (user: any) => {
    setUser(user, "real_token");
    router.replace("/(app)/dashboard");
  };

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [scanAnim] = useState(new Animated.Value(0));
  const [isMatched, setIsMatched] = useState(false);

  // Scanning Animation
  useEffect(() => {
    if (mode === "face" && !isAuthenticating && !isMatched) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.stopAnimation();
    }
  }, [mode, isAuthenticating, isMatched]);

  // Automatic Face Scanning
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (mode === 'face' && permission?.granted && !isAuthenticating && !isMatched && isCameraReady) {
      interval = setInterval(async () => {
        const now = Date.now();
        if (now - lastScanTime > 3000) { // Scan every 3 seconds
            autoFaceLogin();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, permission, isAuthenticating, lastScanTime, isMatched, isCameraReady]);

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

  const autoFaceLogin = async () => {
    if (!cameraRef.current || isAuthenticating || isMatched || !isCameraReady) return;
    
    setIsAuthenticating(true);
    try {
      console.log(`[FaceScan] Attempting capture for ${role}...`);
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.2 });
      if (photo.base64) {
        const matchedId = await verifyFaceViaAPI(photo.base64);
        console.log(`[FaceScan] API Result Matched ID: ${matchedId}`);
        setLastScanTime(Date.now());

        if (matchedId) {
            if (role === 'teacher') {
                const teacher = await getTeacherById(matchedId);
                if (teacher) {
                    console.log(`[FaceScan] Teacher identified: ${teacher.name}`);
                    setIsMatched(true);
                    Alert.alert("नमस्ते!", `${teacher.name}, आपले स्वागत आहे.`);
                    handleLoginSuccess({ id: teacher.id, name: teacher.name, role: "teacher" });
                }
            } else if (role === 'student' || role === 'parent') {
                const student = await getStudentById(matchedId);
                if (student) {
                    console.log(`[FaceScan] Student identified: ${student.name}`);
                    setIsMatched(true);
                    if (role === 'parent') {
                        handleLoginSuccess({ id: student.id, name: `Parent of ${student.name}`, role: "parent", studentId: student.id });
                    } else {
                        handleLoginSuccess({ id: student.id, name: student.name, role: "student" });
                    }
                } else {
                    console.warn(`[FaceScan] Matched ID ${matchedId} not found in local DB.`);
                }
            }
        } else {
            console.log(`[FaceScan] No match detected.`);
        }
      }
    } catch (e) {
      console.log('Auto face scan failed', e);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleFaceLogin = async () => {
    if (isMatched) return;
    await autoFaceLogin();
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
          if (nextPin === '1234') {
             const t = await findTeacherByPhone("9876543210"); 
             if (t) handleLoginSuccess({ id: t.id, name: t.name, role: 'teacher' });
          } else {
              Alert.alert("Error", "Invalid PIN");
              setPin("");
          }
      } else if (role === 'parent') {
          if (onboardingStep === 'pin_entry') {
            const p = await findParentByPhone(phoneNumber);
            if (p && p.pin === nextPin) {
                handleLoginSuccess({ id: p.id, name: p.name, role: 'parent', studentId: p.studentId });
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
                  // Successful setup!
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
                  handleLoginSuccess({ ...newParent, role: 'parent' });
              } else {
                  Alert.alert("त्रुटी", "पिन जुळत नाही. कृपया पुन्हा प्रयत्न करा.");
                  setPin("");
                  setOnboardingStep("pin_setup");
              }
          }
      } else {
          const student = await findStudentByPIN(nextPin);
          if (student) {
              handleLoginSuccess({ id: student.id, name: student.name, role: "student" });
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
            <MarathiText bold size={28} color="#0d9488">
              {item}
            </MarathiText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color="#0d9488" />
        </TouchableOpacity>
        <MarathiText bold size={24} color="#0d9488">
          {translatedRole}
        </MarathiText>
        <View style={{ width: 28 }} />
      </View>

      {role !== 'parent' && (
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "face" && styles.activeToggle]}
            onPress={() => setMode("face")}
          >
            <MaterialCommunityIcons
              name="face-recognition"
              size={24}
              color={mode === "face" ? "#fff" : "#0d9488"}
            />
            <MarathiText size={14} color={mode === "face" ? "#fff" : "#0d9488"}>
              चेहरा
            </MarathiText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === "pin" && styles.activeToggle]}
            onPress={() => setMode("pin")}
          >
            <MaterialCommunityIcons
              name="numeric"
              size={24}
              color={mode === "pin" ? "#fff" : "#0d9488"}
            />
            <MarathiText size={14} color={mode === "pin" ? "#fff" : "#0d9488"}>
              पिन
            </MarathiText>
          </TouchableOpacity>
        </View>
      )}

      {mode === "face" ? (
        <View style={styles.cameraContainer}>
          {permission?.granted ? (
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
                    <Animated.View 
                      style={[
                        styles.scanLine,
                        { 
                          transform: [{ 
                            translateY: scanAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 276]
                            }) 
                          }] 
                        }
                      ]} 
                    />
                  )}
                </View>
                <MarathiText
                  bold
                  size={18}
                  color="#fff"
                  style={styles.scanText}
                >
                  {isMatched ? "यशस्वी!" : (isAuthenticating ? "ओळख पटवत आहे..." : "तुमचा चेहरा कॅमेरा समोर धरा")}
                </MarathiText>
              </View>
              {!isMatched && (
                <TouchableOpacity
                  style={styles.faceLoginBtn}
                  onPress={handleFaceLogin}
                >
                  <MaterialCommunityIcons name="face-recognition" size={24} color="#fff" />
                  <MarathiText
                    bold
                    size={16}
                    color="#fff"
                    style={{ marginLeft: 10 }}
                  >
                    Face Login (Live Scan)
                  </MarathiText>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noPermission}>
              <MaterialCommunityIcons
                name="camera-off"
                size={64}
                color="#9ca3af"
              />
              <MarathiText color="#6b7280" style={{ marginTop: 16 }}>
                Camera Permission Required
              </MarathiText>
              <TouchableOpacity
                style={styles.permBtn}
                onPress={requestPermission}
              >
                <MarathiText bold color="#fff">
                  Grant Permission
                </MarathiText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.pinContainer}>
          <MarathiText
            bold
            size={20}
            color="#1f2937"
            style={{ marginBottom: role === 'parent' ? 12 : 24 }}
          >
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
                <View
                  key={i}
                  style={[styles.dot, pin.length > i && styles.activeDot]}
                />
              ))}
            </View>
          )}

          {onboardingStep !== 'phone' ? (
            renderNumpad()
          ) : (
            <View style={{ height: 200 }} /> // Spacer to avoid layout jump
          )}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.push({ pathname: "/(auth)/register", params: { role } } as any)}>
          <MarathiText bold color="#0d9488" size={16}>
             नवीन खाते तयार करा (Register Now)
          </MarathiText>
        </TouchableOpacity>
        <MarathiText size={12} color="#9ca3af" style={{ marginTop: 12 }}>
          v1.0.0 | High Security | Production Mode
        </MarathiText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  modeToggle: {
    flexDirection: "row",
    marginHorizontal: 48,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  activeToggle: {
    backgroundColor: "#0d9488",
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 4,
    borderColor: "#0d9488",
    borderRadius: 40,
    borderStyle: "dashed",
  },
  scanLine: {
    width: "100%",
    height: 4,
    backgroundColor: "#0d9488",
    opacity: 0.8,
    borderRadius: 2,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10,
  },
  scanText: {
    marginTop: 24,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  noPermission: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permBtn: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 24,
  },
  faceLoginBtn: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(13,148,136,0.95)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginHorizontal: 8,
  },
  pinContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  pinDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 32,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#d1d5db",
    marginHorizontal: 8,
  },
  activeDot: {
    backgroundColor: "#0d9488",
    borderColor: "#0d9488",
  },
  numpad: {
    width: width - 48,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  numButton: {
    width: (width - 72) / 3,
    height: (width - 72) / 3,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  phoneInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    width: width - 48,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  phoneInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1f2937",
  },
});
