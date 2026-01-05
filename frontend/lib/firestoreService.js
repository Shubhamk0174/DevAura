import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

/**
 * Generates a unique username from display name
 */
const generateUsername = (displayName) => {
  const baseName = displayName
    .toLowerCase()
    .split(" ")[0]
    .replace(/[^a-z0-9]/g, "");
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${baseName}-${randomString}`;
};

/**
 * Checks if username is available
 */
export const checkUsernameAvailability = async (username) => {
  try {
    const q = query(
      collection(db, "publicProfiles"),
      where("username", "==", username.toLowerCase()),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    return { success: true, available: querySnapshot.empty };
  } catch (error) {
    console.error("Error checking username:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Creates a new user profile in Firestore
 * Creates both private user document and public profile document
 */
export const createUserProfile = async (userId, userData) => {
  try {
    const { email, displayName } = userData;

    // Generate unique username
    let username = generateUsername(displayName);
    let isAvailable = false;
    let attempts = 0;

    // Keep trying until we get a unique username (max 10 attempts)
    while (!isAvailable && attempts < 10) {
      const checkResult = await checkUsernameAvailability(username);
      if (checkResult.success && checkResult.available) {
        isAvailable = true;
      } else {
        username = generateUsername(displayName);
        attempts++;
      }
    }

    // Create private user profile
    const userRef = doc(db, "users", userId);
    await setDoc(userRef, {
      email,
      displayName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create public profile with default values
    const publicProfileRef = doc(db, "publicProfiles", userId);
    await setDoc(publicProfileRef, {
      displayName,
      username,
      bio: "",
      skills: [],
      achievements: [],
      experience: [],
      certifications: [],
      projects: [],
      location: "",
      website: "",
      socialLinks: {
        twitter: "",
        linkedin: "",
        github: "",
      },
      profileImage: "",
      isPublic: true, // Public by default
      updatedAt: serverTimestamp(),
    });

    return { success: true, username };
  } catch (error) {
    console.error("Error creating user profile:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Gets the private user profile
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    } else {
      return { success: false, error: "User profile not found" };
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Gets the public profile for any user
 */
export const getPublicProfile = async (userId) => {
  try {
    const publicProfileRef = doc(db, "publicProfiles", userId);
    const profileSnap = await getDoc(publicProfileRef);

    if (profileSnap.exists()) {
      const data = profileSnap.data();

      // Check if profile is set to public
      if (!data.isPublic) {
        return {
          success: false,
          error: "This profile is private",
          isPrivate: true,
        };
      }

      return { success: true, data };
    } else {
      return { success: false, error: "Public profile not found" };
    }
  } catch (error) {
    console.error("Error getting public profile:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Updates the private user profile
 */
export const updateUserProfile = async (userId, data) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Updates the public profile
 */
export const updatePublicProfile = async (userId, data) => {
  try {
    const publicProfileRef = doc(db, "publicProfiles", userId);
    await updateDoc(publicProfileRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating public profile:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Checks if a user profile exists, creates one if it doesn't
 * Useful for existing users who registered before Firestore integration
 */
export const ensureUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Profile doesn't exist, create it
      return await createUserProfile(userId, userData);
    }

    return { success: true, exists: true };
  } catch (error) {
    console.error("Error ensuring user profile:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Search for users by name or username
 */
export const searchUsers = async (searchTerm) => {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { success: true, users: [] };
    }

    const searchLower = searchTerm.toLowerCase();
    const usersRef = collection(db, "publicProfiles");

    // Get all public profiles (in production, you'd want pagination)
    const q = query(usersRef, where("isPublic", "==", true));
    const querySnapshot = await getDocs(q);

    const users = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const displayNameMatch = data.displayName
        ?.toLowerCase()
        .includes(searchLower);
      const usernameMatch = data.username?.toLowerCase().includes(searchLower);

      if (displayNameMatch || usernameMatch) {
        users.push({
          id: doc.id,
          ...data,
        });
      }
    });

    return { success: true, users };
  } catch (error) {
    console.error("Error searching users:", error);
    return { success: false, error: error.message, users: [] };
  }
};

/**
 * Get featured users (currently just a limit query)
 */
export const getFeaturedUsers = async (limitCount = 20) => {
  try {
    const usersRef = collection(db, "publicProfiles");
    const q = query(usersRef, where("isPublic", "==", true), limit(limitCount));

    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Shuffle array to make it look dynamic
    for (let i = users.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [users[i], users[j]] = [users[j], users[i]];
    }

    return { success: true, users };
  } catch (error) {
    console.error("Error getting featured users:", error);
    return { success: false, error: error.message };
  }
};
