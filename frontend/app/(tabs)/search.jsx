import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/context/ThemeContext';
import { searchUsers } from '@/lib/firestoreService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const Search = () => {
  const { colors } = useTheme();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (text) => {
    setSearchTerm(text);
    
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const result = await searchUsers(text);
    setIsSearching(false);

    if (result.success) {
      setSearchResults(result.users);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.userCard, { backgroundColor: colors.backgroundSecondary }]}
      onPress={() => {
        router.push({
          pathname: '/(modals)/view-profile',
          params: { userId: item.id }
        });
      }}
    >
      <View style={styles.userInfo}>
        {item.profileImage ? (
          <Image source={{ uri: item.profileImage }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.avatarText}>
              {item.displayName?.charAt(0).toUpperCase() || 'U'}
            </ThemedText>
          </View>
        )}
        <View style={styles.userDetails}>
          <ThemedText style={styles.displayName}>{item.displayName}</ThemedText>
          <ThemedText style={styles.username}>@{item.username}</ThemedText>
          {item.bio && (
            <ThemedText style={styles.bio} numberOfLines={1}>
              {item.bio}
            </ThemedText>
          )}
         
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name or username..."
            placeholderTextColor={colors.textSecondary}
            value={searchTerm}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {isSearching ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={styles.loadingText}>Searching...</ThemedText>
        </View>
      ) : searchTerm.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={64} color={colors.textSecondary} />
          <ThemedText style={styles.emptyTitle}>Find People</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Search for users by their name or username
          </ThemedText>
        </View>
      ) : searchResults.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
          <ThemedText style={styles.emptyTitle}>No Results</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            No users found matching "{searchTerm}"
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ThemedView>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
  },
  username: {
    fontSize: 13,
    opacity: 0.6,
  },
  bio: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
});