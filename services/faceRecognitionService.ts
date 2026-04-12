import { Platform, NativeModules } from "react-native";
import Constants from "expo-constants";
import { Student } from "./databaseService";

// Improved IP Detection for Expo Go and Physical Devices
const getAPIUrl = () => {
    // USER PROVIDED IP (Primary Fallback for reliability)
    const USER_IP = "192.168.1.3";
    let hostname = USER_IP;
    
    // 1. Try Expo Constants (Useful if running via Expo Go)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        // e.g., 192.168.1.3:8081
        const detected = hostUri.split(':')[0];
        if (detected && detected !== 'localhost' && detected !== '127.0.0.1') {
            hostname = detected;
        }
    }

    return `http://${hostname}:5000/api/faces`;
};

const API_URL = getAPIUrl();
console.log('[FaceAPI] Resolved API URL:', API_URL);

/**
 * Enrolls a face (Teacher or Student)
 */
export const enrollFaceViaAPI = async (
    id: string, 
    imageBase64: string, 
    name: string, 
    rollNumber: number, 
    phone: string, 
    className: string,
    role: 'student' | 'teacher' = 'student'
) => {
  const response = await fetch(`${API_URL}/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        studentId: id, 
        imageBase64, 
        name, 
        rollNumber, 
        parentPhone: phone, 
        className,
        role 
    })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Enrollment failed');
  }
  return response.json();
};

/** 
 * Single person verification - Returns ID and detected Role
 */
export const verifyFaceViaAPI = async (imageBase64: string, className?: string): Promise<{ studentId: string; role: string; } | null> => {
  try {
    const response = await fetch(`${API_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, threshold: 0.90, className })
    });
    const result = await response.json();
    if (result.success && result.match) {
      return { studentId: result.studentId, role: result.role };
    }
    return null;
  } catch (error) {
    console.error('API Verification error:', error);
    return null;
  }
};

/**
 * Bulk classroom verification (Snapshot Mode)
 */
export const verifyBulkFaceViaAPI = async (imageBase64: string, className: string): Promise<string[]> => {
    try {
        const response = await fetch(`${API_URL}/verify-bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64, className, threshold: 0.75 })
        });
        const result = await response.json();
        if (result.success && result.detectedIds) {
            return result.detectedIds;
        }
        return [];
    } catch (error) {
        console.error('API Bulk Verification error:', error);
        return [];
    }
};

export const buildOverlayBoxes = (studentIds: string[], students: Student[]) => {
  return studentIds.map((id, index) => {
    const student = students.find((item) => item.id === id);
    return {
      id,
      name: student?.name || "Student",
      left: 10 + (index % 5) * 18,
      top: 10 + Math.floor(index / 5) * 18,
      width: 15,
      height: 15,
    };
  });
};
