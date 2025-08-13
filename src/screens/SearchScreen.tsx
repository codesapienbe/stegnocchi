import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/Navigation';

type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Search'>;

interface SearchResultItem {
  id: string;
  title: string;
  score: number;
}

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);

  const handleBack = (): void => {
    navigation.goBack();
  };

  const handleSearch = (): void => {
    setIsSearching(true);
    // Placeholder: do not call core; simulate empty results
    setTimeout(() => {
      setResults([]);
      setIsSearching(false);
    }, 400);
  };

  const renderItem = ({ item }: { item: SearchResultItem }) => (
    <View style={styles.resultItem}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{item.score.toFixed(2)}</Text>
        </View>
      </View>
      <Text style={styles.resultSubtitle}>Similarity score</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search by face, object, or scene tags"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={isSearching || !query.trim()}>
            <Text style={styles.searchButtonText}>{isSearching ? 'Searching...' : 'Search'}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="image-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyText}>{isSearching ? 'Searching...' : 'No results yet'}</Text>
              <Text style={styles.emptySubtext}>Enter a query and tap Search</Text>
            </View>
          }
          contentContainerStyle={results.length === 0 ? { flexGrow: 1, justifyContent: 'center' } : undefined}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    color: '#111827',
  },
  searchButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 24,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  resultItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultTitle: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  resultSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  scoreBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
}); 