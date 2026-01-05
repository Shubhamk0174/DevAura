import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { getFeaturedUsers } from "@/lib/firestoreService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const Home = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [featuredUsers, setFeaturedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const result = await getFeaturedUsers(10);
      if (result.success) {
        // Filter out current user
        const filtered = result.users.filter((u) => u.id !== user?.id);
        setFeaturedUsers(filtered);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const FeatureCard = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.featureCard,
        { backgroundColor: colors.backgroundSecondary },
      ]}
      onPress={() =>
        router.push({
          pathname: "/(modals)/view-profile",
          params: { userId: item.id },
        })
      }
    >
      <Image
        source={item.profileImage ? { uri: item.profileImage } : null}
        style={[styles.featureImage, { backgroundColor: colors.primary }]}
      />
      {!item.profileImage && (
        <View
          style={[
            styles.featureImagePlaceholder,
            { backgroundColor: colors.primary },
          ]}
        >
          <ThemedText style={styles.featureInitials}>
            {item.displayName?.charAt(0).toUpperCase() || "U"}
          </ThemedText>
        </View>
      )}
      <View style={styles.featureInfo}>
        <ThemedText style={styles.featureName} numberOfLines={1}>
          {item.displayName}
        </ThemedText>
        <ThemedText style={styles.featureRole} numberOfLines={1}>
          {item.username ? `@${item.username}` : "Member"}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );

  const QuickAction = ({ icon, label, onPress, color }) => (
    <TouchableOpacity
      style={[
        styles.actionCard,
        { backgroundColor: colors.backgroundSecondary },
      ]}
      onPress={onPress}
    >
      <View style={[styles.actionIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <ThemedText style={styles.actionLabel}>{label}</ThemedText>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>{getGreeting()},</ThemedText>
            <ThemedText type="title">
              {user?.name?.split(" ")[0] || "User"}
            </ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.profileButton, { borderColor: colors.border }]}
            onPress={() => router.push("/(tabs)/profile")}
          >
            {/* Show user avatar or icon */}
            <Ionicons
              name="person-circle-outline"
              size={40}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionsGrid}>
            <QuickAction
              icon="search"
              label="Find People"
              onPress={() => router.push("/(tabs)/search")}
              color="#4F46E5"
            />
            <QuickAction
              icon="person"
              label="Edit Profile"
              onPress={() => router.push("/(modals)/edit-public-profile")}
              color="#10B981"
            />
            <QuickAction
              icon="chatbubbles"
              label="Messages"
              onPress={() => router.push("/(tabs)/chat")}
              color="#F59E0B"
            />
          </View>
        </View>

        {/* Featured Members */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Discover People</ThemedText>
            <TouchableOpacity onPress={() => router.push("/(tabs)/search")}>
              <ThemedText style={[styles.seeAll, { color: colors.primary }]}>
                See All
              </ThemedText>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={featuredUsers}
            renderItem={({ item }) => <FeatureCard item={item} />}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <ThemedText style={{ opacity: 0.6 }}>No users found</ThemedText>
              </View>
            }
          />
        </View>

        {/* Recent Updates / Placeholder */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Community Updates</ThemedText>
          <View
            style={[
              styles.updateCard,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
            <View style={styles.updateHeader}>
              <Ionicons name="sparkles" size={20} color="#F59E0B" />
              <ThemedText style={styles.updateTitle}>
                Welcome to DevAura!
              </ThemedText>
            </View>
            <ThemedText style={styles.updateText}>
              Connect with fellow developers, showcase your projects, and grow
              your network. Start by updating your profile and exploring the
              community.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 4,
  },
  profileButton: {
    padding: 2,
    borderRadius: 25,
    borderWidth: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  featuredList: {
    paddingHorizontal: 15, // card margin is 5, so 15+5=20 padding
  },

  // Feature Card
  featureCard: {
    width: 140,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
  },
  featureImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 12,
  },
  featureInitials: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  featureInfo: {
    alignItems: "center",
    width: "100%",
  },
  featureName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  featureRole: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: "center",
  },

  // Actions
  actionsGrid: {
    flexDirection: "row",
    paddingHorizontal: 15,
    gap: 10,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // Updates
  updateCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
  },
  updateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  updateText: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
});
