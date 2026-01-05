import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { checkUsernameAvailability } from "@/lib/firestoreService";
import { uploadDocument, uploadImageToCloudinary } from "@/services/cloudinary";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const EditPublicProfile = () => {
  const { colors } = useTheme();
  const { user, publicProfile, updatePublicProfileData } = useAuth();
  const router = useRouter();

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    displayName: publicProfile?.displayName || user?.name || "",
    username: publicProfile?.username || "",
    bio: publicProfile?.bio || "",
    location: publicProfile?.location || "",
    website: publicProfile?.website || "",
    isPublic: publicProfile?.isPublic ?? true,
    skills: publicProfile?.skills || [],
    achievements: publicProfile?.achievements || [],
    experience: publicProfile?.experience || [],
    certifications: publicProfile?.certifications || [],
    projects: publicProfile?.projects || [],
    profileImage: publicProfile?.profileImage || "",
  });

  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    skills: false,
    experience: false,
    certifications: false,
    projects: false,
    achievements: false,
  });

  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: true,
    message: "",
  });
  const [newSkill, setNewSkill] = useState("");

  // Section for adding new items
  const [editingExperience, setEditingExperience] = useState(null);
  const [editingCertification, setEditingCertification] = useState(null);
  const [editingProject, setEditingProject] = useState(null);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant camera roll permissions to upload a profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        setIsUploadingImage(true);
        const uploadResult = await uploadImageToCloudinary(
          imageUri,
          "profile-pictures"
        );
        setIsUploadingImage(false);

        if (uploadResult.success) {
          setFormData({ ...formData, profileImage: uploadResult.url });

          const saveResult = await updatePublicProfileData({
            profileImage: uploadResult.url,
          });

          if (saveResult.success) {
            Alert.alert("Success", "Profile picture updated!");
          } else {
            Alert.alert(
              "Error",
              "Image uploaded but failed to save to database"
            );
          }
        } else {
          Alert.alert(
            "Upload Failed",
            uploadResult.error || "Failed to upload image to Cloudinary"
          );
        }
      }
    } catch (_error) {
      setIsUploadingImage(false);
      Alert.alert("Error", "Failed to pick or upload image");
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const result = await updatePublicProfileData(formData);

      if (result.success) {
        Alert.alert("Success", "Profile updated successfully!", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", result.error || "Failed to update profile");
      }
    } catch (_error) {
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (index) => {
    const updatedSkills = formData.skills.filter((_, i) => i !== index);
    setFormData({ ...formData, skills: updatedSkills });
  };

  // Experience functions
  const addExperience = () => {
    setEditingExperience({
      id: Date.now().toString(),
      company: "",
      position: "",
      location: "",
      startDate: "",
      endDate: "",
      description: "",
      isCurrent: false,
    });
  };

  const saveExperience = () => {
    if (
      editingExperience &&
      editingExperience.company &&
      editingExperience.position
    ) {
      const existingIndex = formData.experience.findIndex(
        (exp) => exp.id === editingExperience.id
      );
      let updatedExperience;

      if (existingIndex >= 0) {
        updatedExperience = [...formData.experience];
        updatedExperience[existingIndex] = editingExperience;
      } else {
        updatedExperience = [...formData.experience, editingExperience];
      }

      setFormData({ ...formData, experience: updatedExperience });
      setEditingExperience(null);
    }
  };

  const removeExperience = (id) => {
    setFormData({
      ...formData,
      experience: formData.experience.filter((exp) => exp.id !== id),
    });
  };

  // Certification functions
  const addCertification = () => {
    setEditingCertification({
      id: Date.now().toString(),
      name: "",
      issuer: "",
      issueDate: "",
      credentialId: "",
      credentialUrl: "",
      fileUrl: "",
      fileType: "",
    });
  };

  const pickCertificationFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        Alert.alert("Uploading", "Please wait...");

        const uploadResult = await uploadDocument(
          result.assets[0].uri,
          "certifications"
        );

        if (uploadResult.success) {
          setEditingCertification({
            ...editingCertification,
            fileUrl: uploadResult.url,
            fileType: uploadResult.fileType,
          });
          Alert.alert("Success", "File uploaded successfully!");
        } else {
          Alert.alert("Error", uploadResult.error);
        }
      }
    } catch (_error) {
      Alert.alert("Error", "Failed to pick file");
    }
  };

  const saveCertification = () => {
    if (
      editingCertification &&
      editingCertification.name &&
      editingCertification.issuer
    ) {
      const existingIndex = formData.certifications.findIndex(
        (cert) => cert.id === editingCertification.id
      );
      let updatedCertifications;

      if (existingIndex >= 0) {
        updatedCertifications = [...formData.certifications];
        updatedCertifications[existingIndex] = editingCertification;
      } else {
        updatedCertifications = [
          ...formData.certifications,
          editingCertification,
        ];
      }

      setFormData({ ...formData, certifications: updatedCertifications });
      setEditingCertification(null);
    }
  };

  const removeCertification = (id) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((cert) => cert.id !== id),
    });
  };

  // Project functions
  const addProject = () => {
    setEditingProject({
      id: Date.now().toString(),
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      technologies: [],
      projectUrl: "",
      files: [],
    });
  };

  const pickProjectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets?.length > 0) {
        Alert.alert(
          "Uploading",
          `Uploading ${result.assets.length} file(s)...`
        );

        const uploadedFiles = [];
        for (const asset of result.assets) {
          const uploadResult = await uploadDocument(asset.uri, "projects");
          if (uploadResult.success) {
            uploadedFiles.push({
              url: uploadResult.url,
              type: uploadResult.fileType,
              name: asset.name,
            });
          }
        }

        setEditingProject({
          ...editingProject,
          files: [...editingProject.files, ...uploadedFiles],
        });
        Alert.alert("Success", `${uploadedFiles.length} file(s) uploaded!`);
      }
    } catch (_error) {
      Alert.alert("Error", "Failed to pick files");
    }
  };

  const removeProjectFile = (index) => {
    const updatedFiles = editingProject.files.filter((_, i) => i !== index);
    setEditingProject({ ...editingProject, files: updatedFiles });
  };

  const saveProject = () => {
    if (editingProject && editingProject.title) {
      const existingIndex = formData.projects.findIndex(
        (proj) => proj.id === editingProject.id
      );
      let updatedProjects;

      if (existingIndex >= 0) {
        updatedProjects = [...formData.projects];
        updatedProjects[existingIndex] = editingProject;
      } else {
        updatedProjects = [...formData.projects, editingProject];
      }

      setFormData({ ...formData, projects: updatedProjects });
      setEditingProject(null);
    }
  };

  const removeProject = (id) => {
    setFormData({
      ...formData,
      projects: formData.projects.filter((proj) => proj.id !== id),
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="checkmark" size={28} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture Section */}
          <View style={styles.profilePictureSection}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={pickImage}
            >
              {isUploadingImage ? (
                <View
                  style={[
                    styles.profileImage,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : formData.profileImage ? (
                <Image
                  source={{ uri: formData.profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View
                  style={[
                    styles.profileImage,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <ThemedText style={styles.profileImageText}>
                    {formData.displayName?.charAt(0).toUpperCase() || "U"}
                  </ThemedText>
                </View>
              )}
              <View
                style={[
                  styles.editImageBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Ionicons name="camera" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <ThemedText style={styles.imageHelperText}>
              Tap to change profile picture
            </ThemedText>
          </View>

          {/* Public/Private Toggle */}
          <View
            style={[
              styles.visibilityCard,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <View style={styles.visibilityRow}>
              <View style={styles.visibilityLeft}>
                <View
                  style={[
                    styles.visibilityIcon,
                    {
                      backgroundColor: formData.isPublic
                        ? colors.success + "20"
                        : colors.warning + "20",
                    },
                  ]}
                >
                  <Ionicons
                    name={formData.isPublic ? "earth" : "lock-closed"}
                    size={20}
                    color={formData.isPublic ? colors.success : colors.warning}
                  />
                </View>
                <View>
                  <ThemedText style={styles.visibilityTitle}>
                    {formData.isPublic ? "Public Profile" : "Private Profile"}
                  </ThemedText>
                  <ThemedText style={styles.visibilitySubtitle}>
                    {formData.isPublic
                      ? "Anyone can view your profile"
                      : "Only you can see your profile"}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={formData.isPublic}
                onValueChange={(value) =>
                  setFormData({ ...formData, isPublic: value })
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Basic Information Section - Collapsible */}
          <TouchableOpacity
            style={[
              styles.sectionHeader,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() => toggleSection("basic")}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.primary}
              />
              <ThemedText style={styles.sectionTitle}>
                Basic Information
              </ThemedText>
            </View>
            <Ionicons
              name={expandedSections.basic ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          {expandedSections.basic && (
            <View
              style={[styles.sectionContent, { borderColor: colors.border }]}
            >
              {/* Display Name */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Display Name</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                  value={formData.displayName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, displayName: text })
                  }
                  placeholder="Your name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Username */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Username</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: usernameStatus.available
                        ? colors.border
                        : colors.error,
                    },
                  ]}
                  value={formData.username}
                  onChangeText={async (text) => {
                    const cleanedUsername = text
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, "");
                    setFormData({ ...formData, username: cleanedUsername });

                    if (
                      cleanedUsername.length >= 3 &&
                      cleanedUsername !== publicProfile?.username
                    ) {
                      setUsernameStatus({
                        checking: true,
                        available: true,
                        message: "Checking...",
                      });
                      const result = await checkUsernameAvailability(
                        cleanedUsername
                      );
                      if (result.success) {
                        setUsernameStatus({
                          checking: false,
                          available: result.available,
                          message: result.available ? "Available!" : "Taken",
                        });
                      }
                    } else if (cleanedUsername === publicProfile?.username) {
                      setUsernameStatus({
                        checking: false,
                        available: true,
                        message: "Current username",
                      });
                    }
                  }}
                  placeholder="your-username"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                />
                {usernameStatus.message && (
                  <View style={styles.usernameStatus}>
                    {usernameStatus.checking ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons
                        name={
                          usernameStatus.available
                            ? "checkmark-circle"
                            : "close-circle"
                        }
                        size={16}
                        color={
                          usernameStatus.available
                            ? colors.success
                            : colors.error
                        }
                      />
                    )}
                    <ThemedText
                      style={[
                        styles.usernameStatusText,
                        {
                          color: usernameStatus.available
                            ? colors.success
                            : colors.error,
                        },
                      ]}
                    >
                      {usernameStatus.message}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Bio */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Bio</ThemedText>
                <TextInput
                  style={[
                    styles.textArea,
                    {
                      color: colors.text,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                  value={formData.bio}
                  onChangeText={(text) =>
                    setFormData({ ...formData, bio: text })
                  }
                  placeholder="Tell others about yourself"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Location</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                  value={formData.location}
                  onChangeText={(text) =>
                    setFormData({ ...formData, location: text })
                  }
                  placeholder="City, Country"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              {/* Website */}
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Website</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                  value={formData.website}
                  onChangeText={(text) =>
                    setFormData({ ...formData, website: text })
                  }
                  placeholder="https://yourwebsite.com"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          {/* Skills Section - Collapsible */}
          <TouchableOpacity
            style={[
              styles.sectionHeader,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() => toggleSection("skills")}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="bulb-outline" size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>
                Skills ({formData.skills.length})
              </ThemedText>
            </View>
            <Ionicons
              name={expandedSections.skills ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          {expandedSections.skills && (
            <View
              style={[styles.sectionContent, { borderColor: colors.border }]}
            >
              <View style={styles.addItemRow}>
                <TextInput
                  style={[
                    styles.addInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                  value={newSkill}
                  onChangeText={setNewSkill}
                  placeholder="Add a skill"
                  placeholderTextColor={colors.textSecondary}
                  onSubmitEditing={addSkill}
                />
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={addSkill}
                >
                  <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              {formData.skills.length > 0 ? (
                <View style={styles.skillsContainer}>
                  {formData.skills.map((skill, index) => (
                    <View
                      key={index}
                      style={[
                        styles.skillChip,
                        {
                          backgroundColor: colors.primary + "15",
                          borderColor: colors.primary,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[styles.skillText, { color: colors.primary }]}
                      >
                        {skill}
                      </ThemedText>
                      <TouchableOpacity onPress={() => removeSkill(index)}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <ThemedText style={styles.emptyText}>
                  No skills added yet
                </ThemedText>
              )}
            </View>
          )}

          {/* Experience Section */}
          <TouchableOpacity
            style={[
              styles.sectionHeader,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() => toggleSection("experience")}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="briefcase-outline"
                size={20}
                color={colors.primary}
              />
              <ThemedText style={styles.sectionTitle}>
                Experience ({formData.experience.length})
              </ThemedText>
            </View>
            <Ionicons
              name={expandedSections.experience ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          {expandedSections.experience && (
            <View
              style={[styles.sectionContent, { borderColor: colors.border }]}
            >
              {!editingExperience && (
                <TouchableOpacity
                  style={[
                    styles.addNewButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={addExperience}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <ThemedText style={styles.addNewButtonText}>
                    Add Experience
                  </ThemedText>
                </TouchableOpacity>
              )}

              {editingExperience && (
                <View
                  style={[
                    styles.editCard,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editingExperience.company}
                    onChangeText={(text) =>
                      setEditingExperience({
                        ...editingExperience,
                        company: text,
                      })
                    }
                    placeholder="Company name"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editingExperience.position}
                    onChangeText={(text) =>
                      setEditingExperience({
                        ...editingExperience,
                        position: text,
                      })
                    }
                    placeholder="Position"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editingExperience.location}
                    onChangeText={(text) =>
                      setEditingExperience({
                        ...editingExperience,
                        location: text,
                      })
                    }
                    placeholder="Location (optional)"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <View style={styles.dateRow}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          color: colors.text,
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      value={editingExperience.startDate}
                      onChangeText={(text) =>
                        setEditingExperience({
                          ...editingExperience,
                          startDate: text,
                        })
                      }
                      placeholder="Start (e.g., Jan 2020)"
                      placeholderTextColor={colors.textSecondary}
                    />
                    <TextInput
                      style={[
                        styles.input,
                        {
                          flex: 1,
                          color: colors.text,
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                      value={editingExperience.endDate}
                      onChangeText={(text) =>
                        setEditingExperience({
                          ...editingExperience,
                          endDate: text,
                        })
                      }
                      placeholder="End (or 'Present')"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editingExperience.description}
                    onChangeText={(text) =>
                      setEditingExperience({
                        ...editingExperience,
                        description: text,
                      })
                    }
                    placeholder="Description (optional)"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.cancelButton,
                        { borderColor: colors.border },
                      ]}
                      onPress={() => setEditingExperience(null)}
                    >
                      <ThemedText>Cancel</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={saveExperience}
                    >
                      <ThemedText style={{ color: "#fff" }}>Save</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {formData.experience.map((exp) => (
                <View
                  key={exp.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.itemCardHeader}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.itemTitle}>
                        {exp.position}
                      </ThemedText>
                      <ThemedText style={styles.itemSubtitle}>
                        {exp.company}
                      </ThemedText>
                      <ThemedText style={styles.itemDate}>
                        {exp.startDate} - {exp.endDate || "Present"}
                      </ThemedText>
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        onPress={() => setEditingExperience(exp)}
                        style={styles.actionIcon}
                      >
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeExperience(exp.id)}
                        style={styles.actionIcon}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {exp.description && (
                    <ThemedText style={styles.itemDescription}>
                      {exp.description}
                    </ThemedText>
                  )}
                </View>
              ))}

              {formData.experience.length === 0 && !editingExperience && (
                <ThemedText style={styles.emptyText}>
                  No experience added yet
                </ThemedText>
              )}
            </View>
          )}

          {/* Certifications Section */}
          <TouchableOpacity
            style={[
              styles.sectionHeader,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() => toggleSection("certifications")}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="medal-outline" size={20} color={colors.primary} />
              <ThemedText style={styles.sectionTitle}>
                Certifications ({formData.certifications.length})
              </ThemedText>
            </View>
            <Ionicons
              name={
                expandedSections.certifications ? "chevron-up" : "chevron-down"
              }
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          {expandedSections.certifications && (
            <View
              style={[styles.sectionContent, { borderColor: colors.border }]}
            >
              {!editingCertification && (
                <TouchableOpacity
                  style={[
                    styles.addNewButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={addCertification}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <ThemedText style={styles.addNewButtonText}>
                    Add Certification
                  </ThemedText>
                </TouchableOpacity>
              )}

              {editingCertification && (
                <View
                  style={[
                    styles.editCard,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editingCertification.name}
                    onChangeText={(text) =>
                      setEditingCertification({
                        ...editingCertification,
                        name: text,
                      })
                    }
                    placeholder="Certification name"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editingCertification.issuer}
                    onChangeText={(text) =>
                      setEditingCertification({
                        ...editingCertification,
                        issuer: text,
                      })
                    }
                    placeholder="Issuing organization"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editingCertification.issueDate}
                    onChangeText={(text) =>
                      setEditingCertification({
                        ...editingCertification,
                        issueDate: text,
                      })
                    }
                    placeholder="Issue date (e.g., Jan 2024)"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editingCertification.credentialId}
                    onChangeText={(text) =>
                      setEditingCertification({
                        ...editingCertification,
                        credentialId: text,
                      })
                    }
                    placeholder="Credential ID (optional)"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editingCertification.credentialUrl}
                    onChangeText={(text) =>
                      setEditingCertification({
                        ...editingCertification,
                        credentialUrl: text,
                      })
                    }
                    placeholder="Credential URL (optional)"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="url"
                    autoCapitalize="none"
                  />

                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={pickCertificationFile}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <ThemedText style={{ marginLeft: 8 }}>
                      {editingCertification.fileUrl
                        ? "Change File"
                        : "Upload Certificate (Image/PDF)"}
                    </ThemedText>
                  </TouchableOpacity>

                  {editingCertification.fileUrl && (
                    <View
                      style={[
                        styles.filePreview,
                        { backgroundColor: colors.background },
                      ]}
                    >
                      <Ionicons
                        name={
                          editingCertification.fileType === "pdf"
                            ? "document-text"
                            : "image"
                        }
                        size={20}
                        color={colors.primary}
                      />
                      <ThemedText style={{ flex: 1, marginLeft: 8 }}>
                        {editingCertification.fileType === "pdf"
                          ? "PDF File"
                          : "Image File"}{" "}
                        Uploaded
                      </ThemedText>
                      <TouchableOpacity
                        onPress={() =>
                          setEditingCertification({
                            ...editingCertification,
                            fileUrl: "",
                            fileType: "",
                          })
                        }
                      >
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.cancelButton,
                        { borderColor: colors.border },
                      ]}
                      onPress={() => setEditingCertification(null)}
                    >
                      <ThemedText>Cancel</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={saveCertification}
                    >
                      <ThemedText style={{ color: "#fff" }}>Save</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {formData.certifications.map((cert) => (
                <View
                  key={cert.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.itemCardHeader}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.itemTitle}>
                        {cert.name}
                      </ThemedText>
                      <ThemedText style={styles.itemSubtitle}>
                        {cert.issuer}
                      </ThemedText>
                      <ThemedText style={styles.itemDate}>
                        {cert.issueDate}
                      </ThemedText>
                      {cert.fileUrl && (
                        <TouchableOpacity
                          style={styles.fileLink}
                          onPress={() => Linking.openURL(cert.fileUrl)}
                        >
                          <Ionicons
                            name={
                              cert.fileType === "pdf"
                                ? "document-text"
                                : "image"
                            }
                            size={16}
                            color={colors.primary}
                          />
                          <ThemedText
                            style={[
                              styles.fileLinkText,
                              { color: colors.primary },
                            ]}
                          >
                            View{" "}
                            {cert.fileType === "pdf" ? "Certificate" : "Image"}
                          </ThemedText>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        onPress={() => setEditingCertification(cert)}
                        style={styles.actionIcon}
                      >
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeCertification(cert.id)}
                        style={styles.actionIcon}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              {formData.certifications.length === 0 &&
                !editingCertification && (
                  <ThemedText style={styles.emptyText}>
                    No certifications added yet
                  </ThemedText>
                )}
            </View>
          )}

          {/* Projects Section */}
          <TouchableOpacity
            style={[
              styles.sectionHeader,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() => toggleSection("projects")}
          >
            <View style={styles.sectionHeaderLeft}>
              <Ionicons
                name="code-slash-outline"
                size={20}
                color={colors.primary}
              />
              <ThemedText style={styles.sectionTitle}>
                Projects ({formData.projects.length})
              </ThemedText>
            </View>
            <Ionicons
              name={expandedSections.projects ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          {expandedSections.projects && (
            <View
              style={[styles.sectionContent, { borderColor: colors.border }]}
            >
              {!editingProject && (
                <TouchableOpacity
                  style={[
                    styles.addNewButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={addProject}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <ThemedText style={styles.addNewButtonText}>
                    Add Project
                  </ThemedText>
                </TouchableOpacity>
              )}

              {editingProject && (
                <View
                  style={[
                    styles.editCard,
                    { backgroundColor: colors.backgroundSecondary },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editingProject.title}
                    onChangeText={(text) =>
                      setEditingProject({ ...editingProject, title: text })
                    }
                    placeholder="Project title"
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editingProject.description}
                    onChangeText={(text) =>
                      setEditingProject({
                        ...editingProject,
                        description: text,
                      })
                    }
                    placeholder="Project description"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    value={editingProject.projectUrl}
                    onChangeText={(text) =>
                      setEditingProject({ ...editingProject, projectUrl: text })
                    }
                    placeholder="Project URL (optional)"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="url"
                    autoCapitalize="none"
                  />

                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={pickProjectFile}
                  >
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color={colors.primary}
                    />
                    <ThemedText style={{ marginLeft: 8 }}>
                      Upload Files (Images/PDFs)
                    </ThemedText>
                  </TouchableOpacity>

                  {editingProject.files.length > 0 && (
                    <View style={styles.filesGrid}>
                      {editingProject.files.map((file, index) => (
                        <View
                          key={index}
                          style={[
                            styles.filePreview,
                            { backgroundColor: colors.background },
                          ]}
                        >
                          <Ionicons
                            name={
                              file.type === "pdf" ? "document-text" : "image"
                            }
                            size={16}
                            color={colors.primary}
                          />
                          <ThemedText
                            style={{ flex: 1, marginLeft: 4, fontSize: 12 }}
                            numberOfLines={1}
                          >
                            {file.name || `File ${index + 1}`}
                          </ThemedText>
                          <TouchableOpacity
                            onPress={() => removeProjectFile(index)}
                          >
                            <Ionicons
                              name="close-circle"
                              size={16}
                              color={colors.error}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[
                        styles.cancelButton,
                        { borderColor: colors.border },
                      ]}
                      onPress={() => setEditingProject(null)}
                    >
                      <ThemedText>Cancel</ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.saveButton,
                        { backgroundColor: colors.primary },
                      ]}
                      onPress={saveProject}
                    >
                      <ThemedText style={{ color: "#fff" }}>Save</ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {formData.projects.map((project) => (
                <View
                  key={project.id}
                  style={[
                    styles.itemCard,
                    {
                      backgroundColor: colors.backgroundSecondary,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.itemCardHeader}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.itemTitle}>
                        {project.title}
                      </ThemedText>
                      {project.description && (
                        <ThemedText
                          style={styles.itemDescription}
                          numberOfLines={2}
                        >
                          {project.description}
                        </ThemedText>
                      )}
                      {project.files.length > 0 && (
                        <ThemedText style={styles.filesCount}>
                          {project.files.length} file(s) attached
                        </ThemedText>
                      )}
                    </View>
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        onPress={() => setEditingProject(project)}
                        style={styles.actionIcon}
                      >
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeProject(project.id)}
                        style={styles.actionIcon}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color={colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              {formData.projects.length === 0 && !editingProject && (
                <ThemedText style={styles.emptyText}>
                  No projects added yet
                </ThemedText>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

export default EditPublicProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  profilePictureSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#fff",
  },
  editImageBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  imageHelperText: {
    fontSize: 12,
    opacity: 0.6,
  },
  visibilityCard: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  visibilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  visibilityLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  visibilityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  visibilityTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  visibilitySubtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  sectionContent: {
    marginHorizontal: 16,
    padding: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    marginBottom: 12,
    marginTop: -2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    minHeight: 90,
    borderWidth: 1,
  },
  usernameStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  usernameStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  addItemRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  addInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 15,
    borderWidth: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  skillText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addNewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  addNewButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  editCard: {
    padding: 14,
    borderRadius: 10,
    gap: 12,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  itemCard: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  itemCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  itemDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 6,
  },
  itemDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  filePreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  filesGrid: {
    gap: 8,
    marginTop: 4,
  },
  fileLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  fileLinkText: {
    fontSize: 13,
    fontWeight: "500",
  },
  filesCount: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 6,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.5,
    fontSize: 14,
    paddingVertical: 12,
  },
});
