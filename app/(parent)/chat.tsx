import { MarathiText } from "@/components/MarathiText";
import { featureRepo } from "@/services/db/featureRepo";
import { useAuthStore } from "@/store/authStore";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ParentChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<
    {
      id: number;
      sender_id: string;
      sender_role: "teacher" | "parent";
      content: string;
      timestamp: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = async () => {
    const rows = await featureRepo.getMessages();
    setMessages(rows);
  };

  useEffect(() => {
    fetchMessages().finally(() => setLoading(false));
  }, []);

  const sendMessage = async () => {
    if (!text.trim()) return;
    await featureRepo.addMessage(user?.id || "P001", "parent", text.trim());
    setText("");
    await fetchMessages();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>
        <View>
          <MarathiText bold size={20} color="#1f2937">
            Class Teacher
          </MarathiText>
          <MarathiText size={14} color="#10b981">
            Offline chat synced locally
          </MarathiText>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#15803d" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.messageList}
            renderItem={({ item }) => {
              const isMe = item.sender_role === "parent";
              return (
                <View
                  style={[
                    styles.messageRow,
                    isMe ? styles.myMessageRow : styles.otherMessageRow,
                  ]}
                >
                  {!isMe && (
                    <View style={styles.avatar}>
                      <MaterialCommunityIcons name="account-tie" size={20} color="#059669" />
                    </View>
                  )}
                  <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.otherBubble]}>
                    <MarathiText size={16} color={isMe ? "#fff" : "#1f2937"}>
                      {item.content}
                    </MarathiText>
                  </View>
                </View>
              );
            }}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={() => (
              <View style={styles.center}>
                <MarathiText size={16} color="#9ca3af">
                  Start conversation...
                </MarathiText>
              </View>
            )}
          />
        )}

        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Type message..."
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !text.trim() && { opacity: 0.5 }]}
            onPress={sendMessage}
            disabled={!text.trim()}
          >
            <MaterialCommunityIcons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    zIndex: 10,
  },
  backBtn: { padding: 8, marginRight: 12, backgroundColor: "#f3f4f6", borderRadius: 12 },
  chatContainer: { flex: 1 },
  messageList: { padding: 16, flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  messageRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  myMessageRow: { justifyContent: "flex-end" },
  otherMessageRow: { justifyContent: "flex-start" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#d1fae5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  messageBubble: { maxWidth: "75%", padding: 12, borderRadius: 16 },
  myBubble: { backgroundColor: "#15803d", borderBottomRightRadius: 4 },
  otherBubble: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderBottomLeftRadius: 4,
  },
  inputArea: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#15803d",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    marginBottom: 2,
  },
});