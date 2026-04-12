import { MarathiText } from "@/components/MarathiText";
import { Role } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { addStudent, addTeacher, addParent, findStudentByNameAndRoll } from "@/services/databaseService";
import { enrollFaceViaAPI } from "@/services/faceRecognitionService";

export default function RegisterScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const role = (params.role as Role) || "teacher";

    const [permission, requestPermission] = useCameraPermissions();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [className, setClassName] = useState("");
    const [rollNumber, setRollNumber] = useState("");
    const [pin, setPin] = useState("");
    
    const [parentPhone, setParentPhone] = useState("");
    
    // Parent specific links
    const [childName, setChildName] = useState("");
    const [childRollNumber, setChildRollNumber] = useState("");

    const [showCamera, setShowCamera] = useState(false);
    const [faceBase64, setFaceBase64] = useState<string | null>(null);
    const cameraRef = useRef<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleCapture = async () => {
        if (!permission?.granted) {
            const res = await requestPermission();
            if (!res.granted) return Alert.alert("Error", "Camera permission required");
        }
        setShowCamera(true);
    };

    const takePhoto = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.3 });
            if (photo.base64) {
                setFaceBase64(photo.base64);
                setShowCamera(false);
                Alert.alert("Success", "Face captured!");
            }
        }
    };

    const handleRegister = async () => {
        const isParent = role === 'parent';
        const isStudent = role === 'student';
        const isTeacher = role === 'teacher';

        // Validation
        if (!name || !pin) return Alert.alert("त्रुटी", "कृपया नाव आणि पिन भरा.");
        if ((isTeacher || isParent) && !phone) return Alert.alert("त्रुटी", "कृपया मोबाईल नंबर भरा.");
        if (isStudent && (!className || !rollNumber)) return Alert.alert("त्रुटी", "कृपया इयत्ता आणि हजेरी क्रमांक भरा.");
        if (isStudent && !parentPhone) return Alert.alert("त्रुटी", "कृपया पालकांचा मोबाईल नंबर भरा.");
        if (isParent && (!childName || !childRollNumber)) return Alert.alert("त्रुटी", "कृपया विद्यार्थ्याचे नाव आणि हजेरी क्रमांक भरा.");
        
        if (!isParent && !faceBase64) return Alert.alert("त्रुटी", "कृपया चेहरा नोंदवा.");
        if (pin.length !== 4) return Alert.alert("त्रुटी", "पिन ४ अंकी असावा.");

        setIsSaving(true);
        try {
            const id = isTeacher ? `T-${Date.now()}` : isParent ? `P-${Date.now()}` : `ST-${Date.now()}`;
            
            let studentIdForParent: string | undefined;

            if (isParent) {
                // VERIFY CHILD
                const foundStudent = await findStudentByNameAndRoll(childName, Number(childRollNumber));
                if (!foundStudent) {
                    throw new Error("दिलेल्या नावाचा आणि हजेरी क्रमांकाचा विद्यार्थी सापडला नाही. कृपया पुन्हा तपासा किंवा शाळा प्रशासनाशी संपर्क साधा.");
                }
                studentIdForParent = foundStudent.id;
            }

            // 1. Save Locally (CRITICAL: Do this first so the user exists in the app)
            if (isTeacher) {
                await addTeacher({ id, name, phone, pin, faceData: 'enrolled', schoolId: 'S001' });
            } else if (isParent) {
                await addParent({ id, name, phone, pin, studentId: studentIdForParent });
            } else {
                await addStudent({ 
                    id, 
                    name, 
                    className, 
                    rollNumber: Number(rollNumber), 
                    pin, 
                    faceData: 'enrolled',
                    parentPhone: parentPhone,
                    schoolId: 'S001'
                });
            }

            // 2. Enroll Face in API (Teachers/Students) - Only if local save worked
            if (!isParent && faceBase64) {
                try {
                    await enrollFaceViaAPI(id, faceBase64, name, Number(rollNumber), isTeacher ? phone : parentPhone, className, role);
                } catch (apiErr) {
                    console.error("API Enrollment failed, but local record saved:", apiErr);
                    // We don't throw here, the user is still locally registered and can use PIN
                }
            }

            Alert.alert("यशस्वी", "नोंदणी पूर्ण झाली आहे! आता तुम्ही लॉगइन करू शकता.", [
                { text: "ठीक आहे", onPress: () => router.replace({ pathname: "/(auth)/[role]/login", params: { role } } as any) }
            ]);
        } catch (e: any) {
            let errorMsg = e.message || "नेटवर्क त्रुटी";
            if (errorMsg.includes("Network request failed")) {
                errorMsg = "सर्व्हरशी संपर्क होऊ शकला नाही. कृपया तुमचा वाय-फाय आणि सर्व्हर चालू असल्याची खात्री करा.\n(IP: 192.168.1.3)";
            }
            Alert.alert("नोंदणी अयशस्वी", errorMsg);
        } finally {
            setIsSaving(false);
        }
    };

    if (showCamera) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
                <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />
                <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
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
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={28} color="#0d9488" />
                </TouchableOpacity>
                <MarathiText bold size={24} color="#0d9488">
                    {role === 'teacher' ? 'शिक्षक नोंदणी' : role === 'student' ? 'विद्यार्थी नोंदणी' : 'पालक नोंदणी'}
                </MarathiText>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.formContainer}>
                    <View style={styles.inputSection}>
                        <MarathiText bold size={14} color="#64748b" style={styles.sectionTitle}>
                            वैयक्तिक माहिती (PERSONAL INFO)
                        </MarathiText>
                        
                        <View style={styles.inputGroup}>
                            <MaterialCommunityIcons name="account-outline" size={22} color="#0d9488" />
                            <TextInput 
                                placeholder="पूर्ण नाव (Full Name)" 
                                style={styles.input} 
                                value={name} 
                                onChangeText={setName} 
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        {(role === 'teacher' || role === 'parent') && (
                            <View style={styles.inputGroup}>
                                <MaterialCommunityIcons name="phone-outline" size={22} color="#0d9488" />
                                <TextInput 
                                    placeholder="मोबाईल नंबर (Mobile No)" 
                                    style={styles.input} 
                                    value={phone} 
                                    onChangeText={setPhone} 
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    placeholderTextColor="#94a3b8"
                                />
                            </View>
                        )}

                        {role === 'student' && (
                            <>
                                <View style={styles.inputGroup}>
                                    <MaterialCommunityIcons name="school-outline" size={22} color="#0d9488" />
                                    <TextInput 
                                        placeholder="वर्ग (Class - e.g. 10th A)" 
                                        style={styles.input} 
                                        value={className} 
                                        onChangeText={setClassName} 
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <MaterialCommunityIcons name="numeric" size={22} color="#0d9488" />
                                    <TextInput 
                                        placeholder="हजेरी क्रमांक (Roll Number)" 
                                        style={styles.input} 
                                        value={rollNumber} 
                                        onChangeText={setRollNumber} 
                                        keyboardType="numeric"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <MaterialCommunityIcons name="account-child-outline" size={22} color="#0d9488" />
                                    <TextInput 
                                        placeholder="पालकांचा मोबाईल (Parent Mobile)" 
                                        style={styles.input} 
                                        value={parentPhone} 
                                        onChangeText={setParentPhone} 
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </>
                        )}
                        
                        {role === 'parent' && (
                            <>
                                <View style={styles.inputGroup}>
                                    <MaterialCommunityIcons name="baby-face-outline" size={22} color="#0d9488" />
                                    <TextInput 
                                        placeholder="विद्यार्थ्याचे नाव (Child's Name)" 
                                        style={styles.input} 
                                        value={childName} 
                                        onChangeText={setChildName} 
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <MaterialCommunityIcons name="numeric" size={22} color="#0d9488" />
                                    <TextInput 
                                        placeholder="विद्यार्थ्याचा हजेरी क्र. (Roll No)" 
                                        style={styles.input} 
                                        value={childRollNumber} 
                                        onChangeText={setChildRollNumber} 
                                        keyboardType="numeric"
                                        placeholderTextColor="#94a3b8"
                                    />
                                </View>
                            </>
                        )}

                        <View style={styles.inputGroup}>
                            <MaterialCommunityIcons name="lock-outline" size={22} color="#0d9488" />
                            <TextInput 
                                placeholder="४-अंकी पिन (4-Digit PIN)" 
                                style={styles.input} 
                                value={pin} 
                                onChangeText={setPin} 
                                keyboardType="numeric"
                                maxLength={4}
                                secureTextEntry
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    </View>

                    {role !== 'parent' && (
                        <View style={styles.faceSection}>
                            <MarathiText bold size={14} color="#64748b" style={styles.sectionTitle}>
                                बायोमेट्रिक नोंदणी (BIOMETRIC)
                            </MarathiText>
                            <TouchableOpacity 
                                style={[styles.faceBtn, faceBase64 && styles.faceBtnSuccess]} 
                                onPress={handleCapture}
                            >
                                <View style={[styles.iconContainer, faceBase64 && styles.iconContainerSuccess]}>
                                    <MaterialCommunityIcons 
                                        name={faceBase64 ? "check-bold" : "face-recognition"} 
                                        size={32} 
                                        color={faceBase64 ? "#fff" : "#0d9488"} 
                                    />
                                </View>
                                <View style={styles.faceBtnText}>
                                    <MarathiText bold size={16} color={faceBase64 ? "#059669" : "#0d9488"}>
                                        {faceBase64 ? "चेहरा नोंदवला गेला" : "चेहरा नोंदवा"}
                                    </MarathiText>
                                    <MarathiText size={12} color={faceBase64 ? "#10b981" : "#64748b"}>
                                        {faceBase64 ? "फोटो यशस्वीरित्या काढला" : "ओळखण्यासाठी फोटो काढा"}
                                    </MarathiText>
                                </View>
                                <MaterialCommunityIcons 
                                    name="chevron-right" 
                                    size={24} 
                                    color={faceBase64 ? "#059669" : "#cbd5e1"} 
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity 
                        style={[styles.registerBtn, isSaving && styles.registerBtnDisabled]} 
                        onPress={handleRegister} 
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <MaterialCommunityIcons name="account-plus" size={24} color="#fff" style={{ marginRight: 10 }} />
                                <MarathiText bold size={18} color="#fff">Register (नोंदणी करा)</MarathiText>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: 20, 
        backgroundColor: '#fff',
        borderBottomWidth: 1, 
        borderBottomColor: '#e2e8f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15
    },
    backButton: { 
        padding: 8,
        marginRight: 8,
        backgroundColor: '#f1f5f9',
        borderRadius: 12
    },
    content: { padding: 20 },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        elevation: 4,
        shadowColor: '#0d9488',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    sectionTitle: { marginBottom: 16, letterSpacing: 1 },
    inputSection: { marginBottom: 24 },
    inputGroup: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#f8fafc',
        borderWidth: 1, 
        borderColor: '#e2e8f0', 
        borderRadius: 16, 
        paddingHorizontal: 16, 
        marginBottom: 16, 
        height: 60 
    },
    input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1e293b' },
    faceSection: { marginBottom: 32 },
    faceBtn: { 
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#f0fdfa',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#0d9488',
        borderRadius: 20,
        gap: 12
    },
    faceBtnSuccess: {
        backgroundColor: '#ecfdf5',
        borderColor: '#10b981',
        borderStyle: 'solid'
    },
    iconContainer: {
        width: 56,
        height: 56,
        backgroundColor: '#fff',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2
    },
    iconContainerSuccess: {
        backgroundColor: '#10b981',
    },
    faceBtnText: { flex: 1 },
    registerBtn: { 
        height: 64, 
        backgroundColor: '#0d9488', 
        borderRadius: 32, 
        flexDirection: 'row',
        justifyContent: 'center', 
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#0d9488',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    registerBtnDisabled: { backgroundColor: '#94a3b8' },
    captureBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    innerCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
    cancelBtn: { position: 'absolute', top: 50, left: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 }
});
