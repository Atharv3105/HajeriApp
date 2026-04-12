import * as SMS from "expo-sms";
import { Platform } from "react-native";

export const sendSms = async (
  recipient: string,
  message: string,
): Promise<boolean> => {
  try {
    if (Platform.OS === "web") return false;
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable || !recipient) return false;

    const result = await SMS.sendSMSAsync([recipient], message);
    return result.result === "sent" || result.result === "unknown";
  } catch (error) {
    console.warn("SMS send failed:", error);
    return false;
  }
};
