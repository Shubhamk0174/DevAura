import { auth } from "@/lib/firebase";
import {
  createUserProfile,
  ensureUserProfile,
  getPublicProfile,
  getUserProfile,
  updatePublicProfile as updatePublicProfileService,
  updateUserProfile as updateUserProfileService,
} from "@/lib/firestoreService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const AUTH_TOKEN_KEY = "auth_token";
const USER_DATA_KEY = "user_data";

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publicProfile, setPublicProfile] = useState(null);
  const [unverifiedUser, setUnverifiedUser] = useState(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser && firebaseUser.emailVerified) {
          // User is signed in and email is verified
          const token = await firebaseUser.getIdToken();

          // Ensure user has a Firestore profile (for existing users)
          await ensureUserProfile(firebaseUser.uid, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || "User",
          });

          // Fetch user profile from Firestore
          const profileResult = await getUserProfile(firebaseUser.uid);
          const publicProfileResult = await getPublicProfile(firebaseUser.uid);

          const userData = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || "User",
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            // Merge Firestore data if available
            ...(profileResult.success ? profileResult.data : {}),
          };

          // Store auth data
          await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
          await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));

          setIsAuthenticated(true);
          setUser(userData);
          setUnverifiedUser(null);

          // Set public profile data
          if (publicProfileResult.success) {
            setPublicProfile(publicProfileResult.data);
          }
        } else {
          // User is signed out or email not verified
          await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          await AsyncStorage.removeItem(USER_DATA_KEY);
          setIsAuthenticated(false);
          setUser(null);
          setPublicProfile(null);
          // Don't clear unverifiedUser here - it might be needed for resend email
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      } finally {
        setIsLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      if (!firebaseUser.emailVerified) {
        setError("Please verify your email before logging in.");
        setUnverifiedUser(firebaseUser);
        await signOut(auth);
        return {
          success: false,
          error: "Email not verified",
          needsVerification: true,
          user: firebaseUser,
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please try again.";

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-email"
      ) {
        errorMessage = "Invalid email or password.";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (name, email, password) => {
    try {
      setError(null);

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const errorMessage = "Please enter a valid email address.";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Update user profile with display name
      await updateProfile(firebaseUser, {
        displayName: name,
      });

      // Create Firestore profile
      const profileResult = await createUserProfile(firebaseUser.uid, {
        email,
        displayName: name,
      });

      if (!profileResult.success) {
        console.error("Failed to create profile:", profileResult.error);
        // Continue anyway - profile can be created later
      }

      // Send verification email
      await sendEmailVerification(firebaseUser);

      // Sign out user - they need to verify email first
      await signOut(auth);

      return {
        success: true,
        message:
          "Account created! Please check your email to verify your account before logging in.",
      };
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed. Please try again.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Network error. Please check your connection.";
      }

      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const resendVerificationEmail = async () => {
    try {
      const currentUser = auth.currentUser || unverifiedUser;
      if (currentUser && !currentUser.emailVerified) {
        await sendEmailVerification(currentUser);
        return { success: true, message: "Verification email sent!" };
      }
      return {
        success: false,
        error: "No user to send verification email to.",
      };
    } catch (error) {
      console.error("Resend verification error:", error);
      return { success: false, error: "Failed to send verification email." };
    }
  };

  const clearUnverifiedUser = () => {
    setUnverifiedUser(null);
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      setError("Logout failed. Please try again.");
      throw error;
    }
  };

  const updateUser = async (userData) => {
    try {
      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error("Update user error error:", error);
      setError("Failed to update user data");
    }
  };

  const updateUserProfileData = async (data) => {
    try {
      if (!user?.id) {
        throw new Error("No user logged in");
      }

      const result = await updateUserProfileService(user.id, data);

      if (result.success) {
        // Update local state
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
        return { success: true };
      }

      return result;
    } catch (error) {
      console.error("Update user profile error:", error);
      return { success: false, error: error.message };
    }
  };

  const updatePublicProfileData = async (data) => {
    try {
      if (!user?.id) {
        throw new Error("No user logged in");
      }

      const result = await updatePublicProfileService(user.id, data);

      if (result.success) {
        // Update local state
        setPublicProfile({ ...publicProfile, ...data });
        return { success: true };
      }

      return result;
    } catch (error) {
      console.error("Update public profile error:", error);
      return { success: false, error: error.message };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: "No user logged in" };
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      try {
        await reauthenticateWithCredential(currentUser, credential);
      } catch (reAuthError) {
        console.error("Re-authentication error:", reAuthError);
        let errorMessage = "Re-authentication failed";

        if (
          reAuthError.code === "auth/wrong-password" ||
          reAuthError.code === "auth/invalid-credential"
        ) {
          errorMessage = "Current password is incorrect";
        } else if (reAuthError.code === "auth/too-many-requests") {
          errorMessage = "Too many attempts. Please try again later";
        } else if (reAuthError.code === "auth/network-request-failed") {
          errorMessage = "Network error. Please check your connection";
        }

        return { success: false, error: errorMessage };
      }

      // Update password
      try {
        await updatePassword(currentUser, newPassword);
        return { success: true, message: "Password changed successfully" };
      } catch (updateError) {
        console.error("Password update error:", updateError);
        let errorMessage = "Failed to update password";

        if (updateError.code === "auth/weak-password") {
          errorMessage = "Password is too weak. Use at least 6 characters";
        } else if (updateError.code === "auth/requires-recent-login") {
          errorMessage =
            "Please log out and log in again before changing password";
        }

        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error("Change password error:", error);
      return { success: false, error: "An unexpected error occurred" };
    }
  };

  const value = {
    // State
    isAuthenticated,
    user,
    isLoading,
    error,
    publicProfile,

    // Actions
    login,
    register,
    logout,
    updateUser,
    updateUserProfileData,
    updatePublicProfileData,
    clearError,
    resendVerificationEmail,
    clearUnverifiedUser,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
