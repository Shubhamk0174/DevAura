import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { subscribeToConversations } from "@/lib/chatService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const Chat = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to conversations
    const unsubscribe = subscribeToConversations(user.id, (convos) => {
      setConversations(convos);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const getOtherUser = (conversation) => {
    const otherUserId = conversation.participants.find((p) => p !== user?.id);
    return conversation.participantDetails?.[otherUserId] || {};
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 24 hours
    if (diff < 86400000) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    // Less than 7 days
    if (diff < 604800000) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    // Older
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const openChat = (conversation) => {
    const otherUserId = conversation.participants.find((p) => p !== user?.id);
    router.push({
      pathname: "/(modals)/chat-room",
      params: {
        conversationId: conversation.id,
        otherUserId,
      },
    });
  };

  const renderConversation = ({ item }) => {
    const otherUser = getOtherUser(item);
    const isLastMessageMine = item.lastMessageBy === user?.id;

    return (
      <TouchableOpacity
        style={[
          styles.conversationCard,
          { backgroundColor: colors.backgroundSecondary },
        ]}
        onPress={() => openChat(item)}
      >
        {otherUser.profileImage ? (
          <Image
            source={{ uri: otherUser.profileImage }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.avatarText}>
              {otherUser.displayName?.charAt(0).toUpperCase() || "U"}
            </ThemedText>
          </View>
        )}

        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <ThemedText style={styles.userName} numberOfLines={1}>
              {otherUser.displayName || "User"}
            </ThemedText>
            <ThemedText style={styles.time}>
              {formatTime(item.lastMessageTime)}
            </ThemedText>
          </View>
          <ThemedText style={styles.lastMessage} numberOfLines={1}>
            {isLastMessageMine && "You: "}
            {item.lastMessage || "Start a conversation"}
          </ThemedText>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText type="title" style={styles.headerText}>
          Messages
        </ThemedText>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={colors.primary}
            />
          </View>
          <ThemedText style={styles.emptyTitle}>No messages yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Start a conversation by visiting someone&apos;s profile and tapping
            &quot;Message&quot;
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    fontSize: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
  conversationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    opacity: 0.5,
  },
  lastMessage: {
    fontSize: 14,
    opacity: 0.7,
  },
});
