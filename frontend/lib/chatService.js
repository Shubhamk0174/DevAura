/**
 * Chat Service
 * Handles all chat-related Firestore operations
 */

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Create or get existing conversation between two users
 */
export const createOrGetConversation = async (
  currentUserId,
  otherUserId,
  currentUserDetails,
  otherUserDetails
) => {
  try {
    console.log(
      "Creating/getting conversation between:",
      currentUserId,
      "and",
      otherUserId
    );

    // Check if conversation already exists - simple query without orderBy
    const conversationsRef = collection(db, "conversations");
    const q = query(
      conversationsRef,
      where("participants", "array-contains", currentUserId)
    );

    const querySnapshot = await getDocs(q);
    console.log("Found conversations:", querySnapshot.size);

    // Find existing conversation with both users
    let existingConversation = null;
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.participants && data.participants.includes(otherUserId)) {
        existingConversation = { id: docSnap.id, ...data };
      }
    });

    if (existingConversation) {
      console.log("Found existing conversation:", existingConversation.id);
      return { success: true, conversation: existingConversation };
    }

    // Create new conversation
    console.log("Creating new conversation...");
    const newConversation = {
      participants: [currentUserId, otherUserId],
      participantDetails: {
        [currentUserId]: {
          displayName: currentUserDetails.displayName || "User",
          profileImage: currentUserDetails.profileImage || "",
          username: currentUserDetails.username || "",
        },
        [otherUserId]: {
          displayName: otherUserDetails.displayName || "User",
          profileImage: otherUserDetails.profileImage || "",
          username: otherUserDetails.username || "",
        },
      },
      lastMessage: "",
      lastMessageTime: serverTimestamp(),
      lastMessageBy: null,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(conversationsRef, newConversation);
    console.log("Created new conversation:", docRef.id);

    return {
      success: true,
      conversation: { id: docRef.id, ...newConversation },
    };
  } catch (error) {
    console.error("Error creating conversation:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to conversations for real-time updates (without orderBy to avoid index requirement)
 */
export const subscribeToConversations = (userId, callback) => {
  console.log("Subscribing to conversations for user:", userId);

  if (!userId) {
    console.log("No userId provided, returning empty");
    callback([]);
    return () => {};
  }

  const conversationsRef = collection(db, "conversations");

  // Simple query without orderBy to avoid composite index requirement
  const q = query(
    conversationsRef,
    where("participants", "array-contains", userId)
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      console.log("Conversations snapshot received:", querySnapshot.size);
      const conversations = [];
      querySnapshot.forEach((docSnap) => {
        conversations.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Sort client-side by lastMessageTime
      conversations.sort((a, b) => {
        const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
        const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
        return timeB - timeA;
      });

      callback(conversations);
    },
    (error) => {
      console.error("Error subscribing to conversations:", error);
      console.error("Error code:", error.code);
      // Return empty array on error but set loading to false
      callback([]);
    }
  );
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (conversationId, senderId, text) => {
  try {
    console.log("Sending message to conversation:", conversationId);
    const messagesRef = collection(
      db,
      "conversations",
      conversationId,
      "messages"
    );

    // Add message
    await addDoc(messagesRef, {
      senderId,
      text,
      createdAt: serverTimestamp(),
      read: false,
    });

    // Update conversation with last message
    const conversationRef = doc(db, "conversations", conversationId);
    await updateDoc(conversationRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      lastMessageBy: senderId,
    });

    console.log("Message sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error sending message:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe to messages in a conversation for real-time updates
 */
export const subscribeToMessages = (conversationId, callback) => {
  console.log("Subscribing to messages for conversation:", conversationId);

  if (!conversationId) {
    console.log("No conversationId provided");
    callback([]);
    return () => {};
  }

  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (querySnapshot) => {
      console.log("Messages snapshot received:", querySnapshot.size);
      const messages = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        messages.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        });
      });
      callback(messages);
    },
    (error) => {
      console.error("Error subscribing to messages:", error);
      console.error("Error code:", error.code);
      callback([]);
    }
  );
};

/**
 * Get conversation by ID
 */
export const getConversation = async (conversationId) => {
  try {
    console.log("Getting conversation:", conversationId);
    const conversationRef = doc(db, "conversations", conversationId);
    const docSnap = await getDoc(conversationRef);

    if (docSnap.exists()) {
      return {
        success: true,
        conversation: { id: docSnap.id, ...docSnap.data() },
      };
    } else {
      console.log("Conversation not found");
      return { success: false, error: "Conversation not found" };
    }
  } catch (error) {
    console.error("Error getting conversation:", error);
    return { success: false, error: error.message };
  }
};
