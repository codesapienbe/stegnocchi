import { logInfo, Component } from '../core/logger';

export interface SearchFilter {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'regex';
  value: any;
  caseSensitive?: boolean;
}

export interface SearchQuery {
  text: string;
  filters: SearchFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult<T = any> {
  items: T[];
  total: number;
  query: SearchQuery;
  executionTime: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}

export interface SearchIndex<T = any> {
  id: string;
  name: string;
  fields: string[];
  data: T[];
  searchableFields: string[];
  filterableFields: string[];
  sortableFields: string[];
}

export interface SearchConfig {
  enabled: boolean;
  enableFuzzySearch: boolean;
  enableFacetedSearch: boolean;
  enableHighlighting: boolean;
  maxResults: number;
  minSearchLength: number;
}

/**
 * Advanced search and filtering capabilities utility
 */
export class AdvancedSearch {
  private config: SearchConfig;
  private indexes: Map<string, SearchIndex> = new Map();
  private searchHistory: SearchQuery[] = [];

  constructor(config?: Partial<SearchConfig>) {
    this.config = {
      enabled: true,
      enableFuzzySearch: true,
      enableFacetedSearch: true,
      enableHighlighting: true,
      maxResults: 100,
      minSearchLength: 2,
      ...config,
    };
  }

  /**
   * Create search index
   */
  createIndex<T>(index: SearchIndex<T>): void {
    this.indexes.set(index.id, index);
    
    logInfo(Component.UI, 'Search index created', {
      indexId: index.id,
      indexName: index.name,
      dataCount: index.data.length,
      searchableFields: index.searchableFields,
    });
  }

  /**
   * Add data to index
   */
  addToIndex<T>(indexId: string, data: T[]): boolean {
    const index = this.indexes.get(indexId);
    if (!index) {
      return false;
    }

    index.data.push(...data);
    
    logInfo(Component.UI, 'Data added to search index', {
      indexId,
      addedCount: data.length,
      totalCount: index.data.length,
    });

    return true;
  }

  /**
   * Remove data from index
   */
  removeFromIndex<T>(indexId: string, predicate: (item: T) => boolean): number {
    const index = this.indexes.get(indexId);
    if (!index) {
      return 0;
    }

    const initialLength = index.data.length;
    index.data = index.data.filter(item => !predicate(item));
    const removedCount = initialLength - index.data.length;
    
    logInfo(Component.UI, 'Data removed from search index', {
      indexId,
      removedCount,
      remainingCount: index.data.length,
    });

    return removedCount;
  }

  /**
   * Search in index
   */
  search<T>(indexId: string, query: SearchQuery): SearchResult<T> {
    const startTime = Date.now();
    const index = this.indexes.get(indexId);
    
    if (!index) {
      throw new Error(`Search index not found: ${indexId}`);
    }

    if (!this.config.enabled) {
      return {
        items: [],
        total: 0,
        query,
        executionTime: Date.now() - startTime,
      };
    }

    // Validate query
    if (query.text.length < this.config.minSearchLength) {
      return {
        items: [],
        total: 0,
        query,
        executionTime: Date.now() - startTime,
      };
    }

    // Apply text search
    let results = this.performTextSearch(index.data, query.text, index.searchableFields);

    // Apply filters
    if (query.filters.length > 0) {
      results = this.applyFilters(results, query.filters);
    }

    // Apply sorting
    if (query.sortBy && index.sortableFields.includes(query.sortBy)) {
      results = this.sortResults(results, query.sortBy, query.sortOrder || 'asc');
    }

    // Apply pagination
    const total = results.length;
    const offset = query.offset || 0;
    const limit = Math.min(query.limit || this.config.maxResults, this.config.maxResults);
    const paginatedResults = results.slice(offset, offset + limit);

    // Generate facets if enabled
    const facets = this.config.enableFacetedSearch ? this.generateFacets(results, index.filterableFields) : undefined;

    // Add to search history
    this.searchHistory.push(query);
    if (this.searchHistory.length > 100) {
      this.searchHistory = this.searchHistory.slice(-50);
    }

    const executionTime = Date.now() - startTime;
    
    logInfo(Component.UI, 'Search completed', {
      indexId,
      queryText: query.text,
      resultsCount: paginatedResults.length,
      totalResults: total,
      executionTime,
    });

    return {
      items: paginatedResults,
      total,
      query,
      executionTime,
      facets,
    };
  }

  /**
   * Perform text search
   */
  private performTextSearch<T>(data: T[], searchText: string, searchableFields: string[]): T[] {
    const normalizedSearchText = searchText.toLowerCase();
    
    return data.filter(item => {
      return searchableFields.some(field => {
        const value = this.getFieldValue(item, field);
        if (value === null || value === undefined) {
          return false;
        }

        const stringValue = String(value).toLowerCase();
        
        // Exact match
        if (stringValue === normalizedSearchText) {
          return true;
        }

        // Contains match
        if (stringValue.includes(normalizedSearchText)) {
          return true;
        }

        // Fuzzy search if enabled
        if (this.config.enableFuzzySearch) {
          return this.fuzzyMatch(stringValue, normalizedSearchText);
        }

        return false;
      });
    });
  }

  /**
   * Apply filters to results
   */
  private applyFilters<T>(data: T[], filters: SearchFilter[]): T[] {
    return data.filter(item => {
      return filters.every(filter => {
        const value = this.getFieldValue(item, filter.field);
        return this.evaluateFilter(value, filter);
      });
    });
  }

  /**
   * Evaluate single filter
   */
  private evaluateFilter(value: any, filter: SearchFilter): boolean {
    const filterValue = filter.value;
    const caseSensitive = filter.caseSensitive ?? false;

    switch (filter.operator) {
      case 'equals':
        return caseSensitive ? value === filterValue : String(value).toLowerCase() === String(filterValue).toLowerCase();
      
      case 'contains':
        return caseSensitive 
          ? String(value).includes(String(filterValue))
          : String(value).toLowerCase().includes(String(filterValue).toLowerCase());
      
      case 'starts_with':
        return caseSensitive
          ? String(value).startsWith(String(filterValue))
          : String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
      
      case 'ends_with':
        return caseSensitive
          ? String(value).endsWith(String(filterValue))
          : String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
      
      case 'greater_than':
        return Number(value) > Number(filterValue);
      
      case 'less_than':
        return Number(value) < Number(filterValue);
      
      case 'in':
        return Array.isArray(filterValue) && filterValue.includes(value);
      
      case 'not_in':
        return Array.isArray(filterValue) && !filterValue.includes(value);
      
      case 'exists':
        return value !== null && value !== undefined;
      
      case 'regex':
        try {
          const regex = new RegExp(String(filterValue), caseSensitive ? '' : 'i');
          return regex.test(String(value));
        } catch {
          return false;
        }
      
      default:
        return false;
    }
  }

  /**
   * Sort results
   */
  private sortResults<T>(data: T[], sortBy: string, sortOrder: 'asc' | 'desc'): T[] {
    return [...data].sort((a, b) => {
      const aValue = this.getFieldValue(a, sortBy);
      const bValue = this.getFieldValue(b, sortBy);

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === null || bValue === undefined) return sortOrder === 'asc' ? 1 : -1;

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Generate facets
   */
  private generateFacets<T>(data: T[], filterableFields: string[]): Record<string, Array<{ value: string; count: number }>> {
    const facets: Record<string, Array<{ value: string; count: number }>> = {};

    filterableFields.forEach(field => {
      const facetCounts = new Map<string, number>();
      
      data.forEach(item => {
        const value = this.getFieldValue(item, field);
        if (value !== null && value !== undefined) {
          const stringValue = String(value);
          const count = facetCounts.get(stringValue) || 0;
          facetCounts.set(stringValue, count + 1);
        }
      });

      facets[field] = Array.from(facetCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 values
    });

    return facets;
  }

  /**
   * Fuzzy string matching
   */
  private fuzzyMatch(text: string, pattern: string): boolean {
    const textLength = text.length;
    const patternLength = pattern.length;
    
    if (patternLength > textLength) {
      return false;
    }

    let patternIndex = 0;
    for (let i = 0; i < textLength && patternIndex < patternLength; i++) {
      if (text[i] === pattern[patternIndex]) {
        patternIndex++;
      }
    }

    return patternIndex === patternLength;
  }

  /**
   * Get field value from object
   */
  private getFieldValue(obj: any, field: string): any {
    const keys = field.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return null;
      }
      value = value[key];
    }
    
    return value;
  }

  /**
   * Get search suggestions
   */
  getSearchSuggestions(indexId: string, partialQuery: string, limit: number = 5): string[] {
    const index = this.indexes.get(indexId);
    if (!index || partialQuery.length < 2) {
      return [];
    }

    const suggestions = new Set<string>();
    const normalizedQuery = partialQuery.toLowerCase();

    index.data.forEach(item => {
      index.searchableFields.forEach(field => {
        const value = this.getFieldValue(item, field);
        if (value && typeof value === 'string') {
          const words = value.toLowerCase().split(/\s+/);
          words.forEach(word => {
            if (word.startsWith(normalizedQuery) && word !== normalizedQuery) {
              suggestions.add(word);
            }
          });
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Get search history
   */
  getSearchHistory(): SearchQuery[] {
    return [...this.searchHistory];
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
    
    logInfo(Component.UI, 'Search history cleared', {});
  }

  /**
   * Get index statistics
   */
  getIndexStats(indexId: string): { dataCount: number; searchableFields: string[]; filterableFields: string[] } | null {
    const index = this.indexes.get(indexId);
    if (!index) {
      return null;
    }

    return {
      dataCount: index.data.length,
      searchableFields: index.searchableFields,
      filterableFields: index.filterableFields,
    };
  }

  /**
   * Delete index
   */
  deleteIndex(indexId: string): boolean {
    const deleted = this.indexes.delete(indexId);
    
    if (deleted) {
      logInfo(Component.UI, 'Search index deleted', { indexId });
    }
    
    return deleted;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SearchConfig>): void {
    this.config = { ...this.config, ...config };
    
    logInfo(Component.UI, 'Search config updated', {
      config: this.config,
    });
  }
}

// Export singleton instance
export const advancedSearch = new AdvancedSearch(); 