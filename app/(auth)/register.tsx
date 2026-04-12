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

            // 1. Enroll Face in API (Teachers/Students)
            if (!isParent && faceBase64) {
                await enrollFaceViaAPI(id, faceBase64, name, Number(rollNumber), phone, className, role);
            }
            
            // 2. Save Locally
            if (isTeacher) {
                await addTeacher({ id, name, phone, pin, faceData: 'enrolled' });
            } else if (isParent) {
                await addParent({ id, name, phone, pin, studentId: studentIdForParent });
            } else {
                await addStudent({ id, name, className, rollNumber: Number(rollNumber), pin, faceData: 'enrolled' });
            }

            Alert.alert("यशस्वी", "नोंदणी पूर्ण झाली आहे! आता तुम्ही लॉगइन करू शकता.", [
                { text: "ठीक आहे", onPress: () => router.replace({ pathname: "/(auth)/[role]/login", params: { role } } as any) }
            ]);
        } catch (e: any) {
            Alert.alert("नोंदणी अयशस्वी", e.message || "नेटवर्क त्रुटी");
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

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.inputGroup}>
                    <MaterialCommunityIcons name="account" size={20} color="#0d9488" />
                    <TextInput 
                        placeholder="Full Name (पूर्ण नाव)" 
                        style={styles.input} 
                        value={name} 
                        onChangeText={setName} 
                    />
                </View>

                {role === 'teacher' && (
                    <View style={styles.inputGroup}>
                        <MaterialCommunityIcons name="phone" size={20} color="#0d9488" />
                        <TextInput 
                            placeholder="Phone Number (मोबाईल नंबर)" 
                            style={styles.input} 
                            value={phone} 
                            onChangeText={setPhone} 
                            keyboardType="phone-pad"
                        />
                    </View>
                )}

                {role === 'student' && (
                    <>
                        <View style={styles.inputGroup}>
                            <MaterialCommunityIcons name="google-classroom" size={20} color="#0d9488" />
                            <TextInput 
                                placeholder="Class (उदा. 10th A)" 
                                style={styles.input} 
                                value={className} 
                                onChangeText={setClassName} 
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <MaterialCommunityIcons name="numeric" size={20} color="#0d9488" />
                            <TextInput 
                                placeholder="Roll Number (हजेरी क्रमांक)" 
                                style={styles.input} 
                                value={rollNumber} 
                                onChangeText={setRollNumber} 
                                keyboardType="numeric"
                            />
                        </View>
                    </>
                )}
                
                {role === 'parent' && (
                    <>
                        <View style={styles.inputGroup}>
                            <MaterialCommunityIcons name="phone" size={20} color="#0d9488" />
                            <TextInput 
                                placeholder="Phone Number (मोबाईल नंबर)" 
                                style={styles.input} 
                                value={phone} 
                                onChangeText={setPhone} 
                                keyboardType="phone-pad"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <MaterialCommunityIcons name="face-recognition" size={20} color="#0d9488" />
                            <TextInput 
                                placeholder="Child's Full Name (विद्यार्थ्याचे नाव)" 
                                style={styles.input} 
                                value={childName} 
                                onChangeText={setChildName} 
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <MaterialCommunityIcons name="numeric" size={20} color="#0d9488" />
                            <TextInput 
                                placeholder="Child's Roll No (हजेरी क्रमांक)" 
                                style={styles.input} 
                                value={childRollNumber} 
                                onChangeText={setChildRollNumber} 
                                keyboardType="numeric"
                            />
                        </View>
                    </>
                )}

                <View style={styles.inputGroup}>
                    <MaterialCommunityIcons name="lock" size={20} color="#0d9488" />
                    <TextInput 
                        placeholder="4-Digit PIN (सुरक्षा पिन)" 
                        style={styles.input} 
                        value={pin} 
                        onChangeText={setPin} 
                        keyboardType="numeric"
                        maxLength={4}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity style={styles.faceBtn} onPress={handleCapture} disabled={role === 'parent'}>
                    <MaterialCommunityIcons name="face-recognition" size={32} color={faceBase64 || role === 'parent' ? "#10b981" : "#0d9488"} />
                    <MarathiText bold color={faceBase64 || role === 'parent' ? "#10b981" : "#0d9488"}>
                        {role === 'parent' ? "लॉगिनसाठी पिन वापरा" : (faceBase64 ? "Face Captured (चेहरा ओळखला)" : "Capture Face (चेहरा नोंदवा)")}
                    </MarathiText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={isSaving}>
                    {isSaving ? <ActivityIndicator color="#fff" /> : (
                        <MarathiText bold size={18} color="#fff">Register (नोंदणी करा)</MarathiText>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    backButton: { marginRight: 16 },
    content: { padding: 24 },
    inputGroup: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, height: 56 },
    input: { flex: 1, marginLeft: 12, fontSize: 16 },
    faceBtn: { height: 120, borderWidth: 2, borderStyle: 'dashed', borderColor: '#0d9488', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 24, gap: 10 },
    registerBtn: { height: 56, backgroundColor: '#0d9488', borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    captureBtn: { position: 'absolute', bottom: 40, alignSelf: 'center', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    innerCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' },
    cancelBtn: { position: 'absolute', top: 50, left: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 }
});
