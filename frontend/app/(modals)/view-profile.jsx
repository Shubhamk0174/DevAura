import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getPublicProfile } from '@/lib/firestoreService';
import { createOrGetConversation } from '@/lib/chatService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

const ViewProfile = () => {
  const { colors } = useTheme();
  const { user, publicProfile } = useAuth();
  const router = useRouter();
  const { userId } = useLocalSearchParams();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await getPublicProfile(userId);
      
      if (result.success) {
        setProfile(result.data);
      } else {
        setError(result.error || 'Failed to load profile');
        if (result.isPrivate) {
          Alert.alert('Private Profile', 'This profile is set to private.');
        }
      }
    } catch (err) {
      setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const openUrl = (url) => {
    if (url) {
      Linking.openURL(url);
    }
  };

  const startChat = async () => {
    console.log('startChat called');
    console.log('user?.id:', user?.id);
    console.log('profile:', profile?.displayName);
    
    if (!user?.id || !profile) {
      console.log('Early return - missing user or profile');
      return;
    }
    
    setIsStartingChat(true);
    
    const currentUserDetails = {
      displayName: publicProfile?.displayName || user.name || 'User',
      profileImage: publicProfile?.profileImage || '',
      username: publicProfile?.username || ''
    };
    
    const otherUserDetails = {
      displayName: profile.displayName,
      profileImage: profile.profileImage || '',
      username: profile.username || ''
    };
    
    console.log('Creating conversation...');
    const result = await createOrGetConversation(
      user.id,
      userId,
      currentUserDetails,
      otherUserDetails
    );
    
    console.log('Result:', result);
    setIsStartingChat(false);
    
    if (result.success) {
      console.log('Navigating to chat room...');
      router.push({
        pathname: '/(modals)/chat-room',
        params: { 
          conversationId: result.conversation.id,
          otherUserId: userId
        }
      });
    } else {
      Alert.alert('Error', 'Could not start conversation');
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error || !profile) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Profile</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <ThemedText style={styles.errorTitle}>Unable to Load Profile</ThemedText>
          <ThemedText style={styles.errorSubtitle}>{error}</ThemedText>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadProfile}
          >
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  // Check if profile has any content
  const hasContent = (
    (profile.skills && profile.skills.length > 0) ||
    (profile.achievements && profile.achievements.length > 0) ||
    (profile.experience && profile.experience.length > 0) ||
    (profile.certifications && profile.certifications.length > 0) ||
    (profile.projects && profile.projects.length > 0)
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Profile</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {/* Profile Picture */}
          <View style={styles.profileImageContainer}>
            {profile.profileImage ? (
              <Image 
                source={{ uri: profile.profileImage }} 
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, { backgroundColor: colors.primary }]}>
                <ThemedText style={styles.profileImageText}>
                  {profile.displayName?.charAt(0).toUpperCase() || 'U'}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Profile Info */}
          <ThemedText style={styles.displayName}>{profile.displayName}</ThemedText>
          {profile.username && (
            <ThemedText style={styles.username}>@{profile.username}</ThemedText>
          )}
          {profile.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <ThemedText style={styles.location}>{profile.location}</ThemedText>
            </View>
          )}
          {profile.bio && (
            <ThemedText style={styles.bio}>{profile.bio}</ThemedText>
          )}
          {profile.website && (
            <TouchableOpacity style={styles.websiteRow} onPress={() => openUrl(profile.website)}>
              <Ionicons name="link-outline" size={16} color={colors.primary} />
              <ThemedText style={[styles.website, { color: colors.primary }]}>
                {profile.website}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Message Button - Only show if not viewing own profile */}
        {userId !== user?.id && (
          <TouchableOpacity
            style={[styles.messageButton, { backgroundColor: colors.primary }]}
            onPress={startChat}
            disabled={isStartingChat}
          >
            {isStartingChat ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                <ThemedText style={styles.messageButtonText}>Message</ThemedText>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Stats Row - Only show if user has content */}
        {hasContent && (
          <View style={[styles.statsContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{profile.skills?.length || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Skills</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{profile.experience?.length || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Experience</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{profile.projects?.length || 0}</ThemedText>
              <ThemedText style={styles.statLabel}>Projects</ThemedText>
            </View>
          </View>
        )}

        {/* Skills Section - Only show if has skills */}
        {profile.skills && profile.skills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bulb-outline" size={20} color={colors.text} />
              <ThemedText style={styles.sectionTitle}>Skills</ThemedText>
            </View>
            <View style={styles.skillsGrid}>
              {profile.skills.map((skill, index) => (
                <View 
                  key={index} 
                  style={[styles.skillChip, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                >
                  <ThemedText style={[styles.skillText, { color: colors.primary }]}>
                    {skill}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Experience Section - Only show if has experience */}
        {profile.experience && profile.experience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="briefcase-outline" size={20} color={colors.text} />
              <ThemedText style={styles.sectionTitle}>Experience</ThemedText>
            </View>
            {profile.experience.map((exp, index) => (
              <View key={exp.id || index} style={[styles.experienceCard, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={[styles.expIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="briefcase" size={20} color={colors.primary} />
                </View>
                <View style={styles.expContent}>
                  <ThemedText style={styles.expPosition}>{exp.position}</ThemedText>
                  <ThemedText style={styles.expCompany}>{exp.company}</ThemedText>
                  {exp.location && <ThemedText style={styles.expLocation}>{exp.location}</ThemedText>}
                  <ThemedText style={styles.expDate}>{exp.startDate} - {exp.endDate || 'Present'}</ThemedText>
                  {exp.description && <ThemedText style={styles.expDescription}>{exp.description}</ThemedText>}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Certifications Section - Only show if has certifications */}
        {profile.certifications && profile.certifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="medal-outline" size={20} color={colors.text} />
              <ThemedText style={styles.sectionTitle}>Certifications</ThemedText>
            </View>
            {profile.certifications.map((cert, index) => (
              <View key={cert.id || index} style={[styles.certCard, { backgroundColor: colors.backgroundSecondary }]}>
                <View style={[styles.certIcon, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="ribbon" size={24} color={colors.warning} />
                </View>
                <View style={styles.certContent}>
                  <ThemedText style={styles.certName}>{cert.name}</ThemedText>
                  <ThemedText style={styles.certIssuer}>{cert.issuer}</ThemedText>
                  {cert.issueDate && <ThemedText style={styles.certDate}>Issued: {cert.issueDate}</ThemedText>}
                  {cert.credentialId && (
                    <ThemedText style={styles.credentialId}>Credential ID: {cert.credentialId}</ThemedText>
                  )}
                  {cert.fileUrl && (
                    <TouchableOpacity 
                      style={[styles.certFileLink, { backgroundColor: colors.primary + '15' }]} 
                      onPress={() => openUrl(cert.fileUrl)}
                    >
                      <Ionicons name={cert.fileType === 'pdf' ? 'document-text' : 'image'} size={18} color={colors.primary} />
                      <ThemedText style={[styles.certFileLinkText, { color: colors.primary }]}>
                        View {cert.fileType === 'pdf' ? 'Certificate' : 'Image'}
                      </ThemedText>
                      <Ionicons name="open-outline" size={14} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Projects Section - Only show if has projects */}
        {profile.projects && profile.projects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="code-slash-outline" size={20} color={colors.text} />
              <ThemedText style={styles.sectionTitle}>Projects</ThemedText>
            </View>
            {profile.projects.map((project, index) => (
              <View key={project.id || index} style={[styles.projectCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <ThemedText style={styles.projectTitle}>{project.title}</ThemedText>
                {project.description && (
                  <ThemedText style={styles.projectDesc}>{project.description}</ThemedText>
                )}
                {project.projectUrl && (
                  <TouchableOpacity 
                    style={styles.projectUrlLink} 
                    onPress={() => openUrl(project.projectUrl)}
                  >
                    <Ionicons name="link-outline" size={16} color={colors.primary} />
                    <ThemedText style={[styles.projectUrlText, { color: colors.primary }]}>
                      View Project
                    </ThemedText>
                  </TouchableOpacity>
                )}
                {project.files && project.files.length > 0 && (
                  <View style={styles.projectFilesContainer}>
                    <ThemedText style={styles.projectFilesLabel}>Attachments ({project.files.length})</ThemedText>
                    <View style={styles.projectFilesGrid}>
                      {project.files.map((file, fileIndex) => (
                        <TouchableOpacity
                          key={fileIndex}
                          style={[styles.projectFileItem, { backgroundColor: colors.background }]}
                          onPress={() => openUrl(file.url)}
                        >
                          <Ionicons name={file.type === 'pdf' ? 'document-text' : 'image'} size={18} color={colors.primary} />
                          <ThemedText style={styles.projectFileName} numberOfLines={1}>
                            {file.name || `File ${fileIndex + 1}`}
                          </ThemedText>
                          <Ionicons name="download-outline" size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Achievements Section - Only show if has achievements */}
        {profile.achievements && profile.achievements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="trophy-outline" size={20} color={colors.text} />
              <ThemedText style={styles.sectionTitle}>Achievements</ThemedText>
            </View>
            {profile.achievements.map((achievement, index) => (
              <View 
                key={index} 
                style={[styles.achievementCard, { backgroundColor: colors.backgroundSecondary }]}
              >
                <View style={[styles.achievementIcon, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="trophy" size={24} color={colors.success} />
                </View>
                <View style={styles.achievementContent}>
                  <ThemedText style={styles.achievementTitle}>
                    {achievement.title}
                  </ThemedText>
                  {achievement.date && (
                    <ThemedText style={styles.achievementDate}>
                      {achievement.date}
                    </ThemedText>
                  )}
                  {achievement.description && (
                    <ThemedText style={styles.achievementDesc}>
                      {achievement.description}
                    </ThemedText>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty State - Only show if no content */}
        {!hasContent && (
          <View style={styles.emptyState}>
            <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
            <ThemedText style={styles.emptyText}>
              This profile doesn't have any content yet
            </ThemedText>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ThemedView>
  );
};

export default ViewProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#fff',
  },
  displayName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  username: {
    fontSize: 15,
    opacity: 0.6,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    opacity: 0.7,
  },
  bio: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
    opacity: 0.8,
  },
  websiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  website: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  skillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  experienceCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  expIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expContent: {
    flex: 1,
  },
  expPosition: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  expCompany: {
    fontSize: 15,
    opacity: 0.8,
    marginBottom: 2,
  },
  expLocation: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 4,
  },
  expDate: {
    fontSize: 12,
    opacity: 0.5,
    marginBottom: 8,
  },
  expDescription: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  certCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  certIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  certContent: {
    flex: 1,
  },
  certName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  certIssuer: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  certDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  credentialId: {
    fontSize: 11,
    opacity: 0.5,
    marginBottom: 8,
  },
  certFileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  certFileLinkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  projectCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  projectTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  projectDesc: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
    marginBottom: 10,
  },
  projectUrlLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  projectUrlText: {
    fontSize: 14,
    fontWeight: '500',
  },
  projectFilesContainer: {
    marginTop: 8,
  },
  projectFilesLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
    marginBottom: 8,
  },
  projectFilesGrid: {
    gap: 8,
  },
  projectFileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
  },
  projectFileName: {
    flex: 1,
    fontSize: 13,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 6,
  },
  achievementDesc: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 16,
    lineHeight: 22,
  },
});
