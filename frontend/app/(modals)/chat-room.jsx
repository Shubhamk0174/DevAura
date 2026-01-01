import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { sendMessage, subscribeToMessages, getConversation } from '@/lib/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const ChatRoom = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const { conversationId, otherUserId } = useLocalSearchParams();
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    loadConversation();
    
    // Subscribe to messages
    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  const loadConversation = async () => {
    const result = await getConversation(conversationId);
    if (result.success) {
      setConversation(result.conversation);
      // Get other user's details
      const otherId = result.conversation.participants.find(p => p !== user?.id);
      if (otherId && result.conversation.participantDetails) {
        setOtherUser(result.conversation.participantDetails[otherId]);
      }
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    const result = await sendMessage(conversationId, user.id, messageText);
    
    setIsSending(false);
    
    if (!result.success) {
      setNewMessage(messageText); // Restore message if failed
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.senderId === user?.id;
    const showAvatar = !isMe && (index === 0 || messages[index - 1]?.senderId !== item.senderId);

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && showAvatar && (
          otherUser?.profileImage ? (
            <Image source={{ uri: otherUser.profileImage }} style={styles.messageAvatar} />
          ) : (
            <View style={[styles.messageAvatar, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.avatarText}>
                {otherUser?.displayName?.charAt(0) || 'U'}
              </ThemedText>
            </View>
          )
        )}
        {!isMe && !showAvatar && <View style={styles.avatarSpacer} />}
        
        <View style={[
          styles.messageBubble,
          isMe ? [styles.messageBubbleMe, { backgroundColor: colors.primary }] : 
                 [styles.messageBubbleOther, { backgroundColor: colors.backgroundSecondary }]
        ]}>
          <ThemedText style={[
            styles.messageText,
            isMe && { color: '#fff' }
          ]}>
            {item.text}
          </ThemedText>
          <ThemedText style={[
            styles.messageTime,
            isMe ? { color: 'rgba(255,255,255,0.7)' } : { opacity: 0.5 }
          ]}>
            {formatTime(item.createdAt)}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            {otherUser?.profileImage ? (
              <Image source={{ uri: otherUser.profileImage }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.headerAvatarText}>
                  {otherUser?.displayName?.charAt(0) || 'U'}
                </ThemedText>
              </View>
            )}
            <View style={styles.headerInfo}>
              <ThemedText style={styles.headerName} numberOfLines={1}>
                {otherUser?.displayName || 'Chat'}
              </ThemedText>
              {otherUser?.username && (
                <ThemedText style={styles.headerUsername}>@{otherUser.username}</ThemedText>
              )}
            </View>
          </View>
          
          <View style={{ width: 40 }} />
        </View>

        {/* Messages */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
            onLayout={() => flatListRef.current?.scrollToEnd()}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
                <ThemedText style={styles.emptyText}>
                  No messages yet. Say hello!
                </ThemedText>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: colors.primary, opacity: newMessage.trim() ? 1 : 0.5 }]}
            onPress={handleSend}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

export default ChatRoom;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerUsername: {
    fontSize: 12,
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  avatarSpacer: {
    width: 36,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  messageBubbleMe: {
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 12,
    opacity: 0.6,
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
