import { Platform, NativeModules } from "react-native";
import Constants from "expo-constants";
import { Student } from "./databaseService";

// Improved IP Detection for Expo Go and Physical Devices
const getAPIUrl = () => {
    let hostname = "localhost";
    
    // 1. Try Expo Constants (Reliable for Expo Go)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        // e.g., 192.168.1.3:8081
        hostname = hostUri.split(':')[0];
    } else {
        // 2. Fallback to scriptURL splitting
        try {
            const scriptURL = NativeModules.SourceCode?.scriptURL;
            if (scriptURL) {
                const match = scriptURL.match(/:\/\/([^:/]+)/);
                if (match && match[1]) {
                    hostname = match[1];
                }
            }
        } catch (e) {}
    }

    // FINAL FALLBACK: If you are seeing 'localhost' in logs but using a real phone,
    // please change 'localhost' below to your laptop's Wi-Fi IP (e.g., '192.168.x.x')
    const FINAL_HOSTNAME = hostname === "localhost" || hostname === "127.0.0.1" ? "localhost" : hostname;

    return `http://${FINAL_HOSTNAME}:5000/api/faces`;
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
 * Single person verification
 */
export const verifyFaceViaAPI = async (imageBase64: string, className?: string): Promise<string | null> => {
  try {
    const response = await fetch(`${API_URL}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, threshold: 0.82, className })
    });
    const result = await response.json();
    if (result.success && result.match) {
      return result.studentId;
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
