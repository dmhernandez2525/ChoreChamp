import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Star,
  Download,
  Heart,
  Clock,
  Users,
  ChevronRight,
  Grid,
  List,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type {
  CommunityTemplate,
  TemplateSearchParams,
  TemplateCollection,
  TemplateCategory,
  AgeRange,
} from '@chorechamp/types';
import {
  TEMPLATE_CATEGORIES,
  AGE_RANGES,
  formatDuration,
  getDifficultyLabel,
} from '@chorechamp/types';

interface CommunityTemplateBrowserProps {
  householdId: string;
  onSelectTemplate?: (template: CommunityTemplate) => void;
  onImportTemplate?: (template: CommunityTemplate) => void;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'popular' | 'recent' | 'rating' | 'downloads';

export function CommunityTemplateBrowser({
  householdId: _householdId,
  onSelectTemplate,
  onImportTemplate,
}: CommunityTemplateBrowserProps) {
  // householdId is available for parent callbacks but not directly used here
  void _householdId;
  const [templates, setTemplates] = useState<CommunityTemplate[]>([]);
  const [featured, setFeatured] = useState<(TemplateCollection & { templates: CommunityTemplate[] })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | ''>('');
  const [selectedAgeRange, setSelectedAgeRange] = useState<AgeRange | ''>('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadTemplates = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const params: TemplateSearchParams = {
        query: searchQuery || undefined,
        category: selectedCategory || undefined,
        ageRange: selectedAgeRange || undefined,
        sortBy,
        page,
        limit: 12,
      };

      const result = await apiClient.searchCommunityTemplates(params);
      setTemplates(result.templates);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to load templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedCategory, selectedAgeRange, sortBy, page]);

  const loadFeatured = useCallback(async () => {
    try {
      const result = await apiClient.getFeaturedCollections();
      setFeatured(result.collections);
    } catch (err) {
      console.error('Failed to load featured:', err);
    }
  }, []);

  useEffect(() => {
    loadTemplates(false);
  }, [loadTemplates]);

  const handleRefresh = useCallback(() => {
    loadTemplates(true);
  }, [loadTemplates]);

  useEffect(() => {
    loadFeatured();
  }, [loadFeatured]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadTemplates(false);
  };

  const handleToggleFavorite = async (template: CommunityTemplate) => {
    try {
      await apiClient.toggleTemplateFavorite(template.id);
      loadTemplates();
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleImport = async (template: CommunityTemplate) => {
    if (onImportTemplate) {
      onImportTemplate(template);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedAgeRange('');
    setSortBy('popular');
    setPage(1);
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          <span>{error}</span>
        </div>
        <button
          onClick={() => loadTemplates(false)}
          className="mt-3 text-sm text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Community Templates
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Discover and import chore templates shared by other families
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
          >
            {viewMode === 'grid' ? <List className="w-5 h-5" aria-hidden="true" /> : <Grid className="w-5 h-5" aria-hidden="true" />}
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Refresh templates"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${
              showFilters
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Search
          </button>
        </form>

        {showFilters && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | '')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">All Categories</option>
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Age Range
                </label>
                <select
                  value={selectedAgeRange}
                  onChange={(e) => setSelectedAgeRange(e.target.value as AgeRange | '')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">All Ages</option>
                  {AGE_RANGES.map((age) => (
                    <option key={age.value} value={age.value}>
                      {age.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="popular">Most Popular</option>
                  <option value="recent">Most Recent</option>
                  <option value="rating">Highest Rated</option>
                  <option value="downloads">Most Downloads</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Featured Collections */}
      {!searchQuery && !selectedCategory && featured.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Featured Collections
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {featured.map((collection) => (
              <div
                key={collection.id}
                className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg"
              >
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{collection.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {collection.description}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-indigo-600 dark:text-indigo-400">
                    {collection.templates.length} templates
                  </span>
                  <ChevronRight className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {total} templates found
      </div>

      {/* Templates Grid/List */}
      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={onSelectTemplate}
              onFavorite={() => handleToggleFavorite(template)}
              onImport={() => handleImport(template)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <TemplateListItem
              key={template.id}
              template={template}
              onSelect={onSelectTemplate}
              onFavorite={() => handleToggleFavorite(template)}
              onImport={() => handleImport(template)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {templates.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" aria-hidden="true" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No templates found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
}

function TemplateCard({
  template,
  onSelect,
  onFavorite,
  onImport,
}: {
  template: CommunityTemplate;
  onSelect?: (template: CommunityTemplate) => void;
  onFavorite: () => void;
  onImport: () => void;
}) {
  return (
    <article
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow focus-within:ring-2 focus-within:ring-indigo-500"
      aria-label={`Template: ${template.name}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <button
            className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-indigo-600 text-left focus:outline-none focus:underline"
            onClick={() => onSelect?.(template)}
            aria-label={`View details for ${template.name}`}
          >
            {template.name}
          </button>
          <button
            onClick={onFavorite}
            className="text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
            aria-label={`Add ${template.name} to favorites`}
          >
            <Heart className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {template.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500" />
            {template.ratings.average.toFixed(1)}
          </span>
          <span className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            {template.downloads}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {formatDuration(template.estimatedDuration)}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">
            {getDifficultyLabel(template.difficulty)}
          </span>
          <span className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded">
            {template.points} pts
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Users className="w-3 h-3" aria-hidden="true" />
            {template.authorName}
          </span>
          <button
            onClick={onImport}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            aria-label={`Import ${template.name} template`}
          >
            Import
          </button>
        </div>
      </div>
    </article>
  );
}

function TemplateListItem({
  template,
  onSelect,
  onFavorite,
  onImport,
}: {
  template: CommunityTemplate;
  onSelect?: (template: CommunityTemplate) => void;
  onFavorite: () => void;
  onImport: () => void;
}) {
  return (
    <article
      className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-indigo-500"
      aria-label={`Template: ${template.name}`}
    >
      <div className="flex-1 min-w-0">
        <button
          className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer hover:text-indigo-600 truncate text-left w-full focus:outline-none focus:underline"
          onClick={() => onSelect?.(template)}
          aria-label={`View details for ${template.name}`}
        >
          {template.name}
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{template.description}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-500" />
            {template.ratings.average.toFixed(1)} ({template.ratings.count})
          </span>
          <span>{formatDuration(template.estimatedDuration)}</span>
          <span>{getDifficultyLabel(template.difficulty)}</span>
          <span className="text-indigo-600 dark:text-indigo-400">{template.points} pts</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onFavorite}
          className="p-2 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
          aria-label={`Add ${template.name} to favorites`}
        >
          <Heart className="w-5 h-5" aria-hidden="true" />
        </button>
        <button
          onClick={onImport}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label={`Import ${template.name} template`}
        >
          Import
        </button>
      </div>
    </article>
  );
}
