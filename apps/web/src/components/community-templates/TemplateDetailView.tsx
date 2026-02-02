import { useState, useEffect, useCallback } from 'react';
import {
  Star,
  Download,
  Heart,
  Clock,
  Users,
  ArrowLeft,
  CheckCircle,
  Package,
  MessageSquare,
  Send,
} from 'lucide-react';
import { apiClient } from '@chorechamp/api-client';
import type { CommunityTemplate, TemplateReview } from '@chorechamp/types';
import { formatDuration, getDifficultyLabel, getAgeRangeLabel, getCategoryLabel } from '@chorechamp/types';

interface TemplateDetailViewProps {
  templateId: string;
  householdId: string;
  onBack: () => void;
  onImport: (template: CommunityTemplate) => void;
}

export function TemplateDetailView({
  templateId,
  householdId: _householdId,
  onBack,
  onImport,
}: TemplateDetailViewProps) {
  const [template, setTemplate] = useState<CommunityTemplate | null>(null);
  const [reviews, setReviews] = useState<TemplateReview[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadTemplate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await apiClient.getCommunityTemplate(templateId);
      setTemplate(result.template);
      setReviews(result.reviews);
      setIsFavorite(result.isFavorite);
      setHasDownloaded(result.hasDownloaded);
    } catch (err) {
      console.error('Failed to load template:', err);
      setError(err instanceof Error ? err.message : 'Failed to load template');
    } finally {
      setIsLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const handleToggleFavorite = async () => {
    if (!template) return;
    try {
      const result = await apiClient.toggleTemplateFavorite(template.id);
      setIsFavorite(result.isFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleImport = async () => {
    if (!template) return;
    onImport(template);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    try {
      setIsSubmittingReview(true);
      await apiClient.submitTemplateReview(template.id, {
        rating: reviewRating as 1 | 2 | 3 | 4 | 5,
        review: reviewText || undefined,
      });
      setShowReviewForm(false);
      setReviewText('');
      loadTemplate();
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error || 'Template not found'}</p>
        <button onClick={onBack} className="mt-3 text-sm text-red-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to templates
      </button>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{template.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">{template.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-lg ${
                isFavorite
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Download className="w-4 h-4" />
              {hasDownloaded ? 'Import Again' : 'Import Template'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-yellow-500">
              <Star className="w-5 h-5 fill-current" />
              <span className="text-lg font-bold">{template.ratings.average.toFixed(1)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{template.ratings.count} reviews</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-gray-700 dark:text-gray-300">
              <Download className="w-5 h-5" />
              <span className="text-lg font-bold">{template.downloads}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">downloads</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-gray-700 dark:text-gray-300">
              <Clock className="w-5 h-5" />
              <span className="text-lg font-bold">{formatDuration(template.estimatedDuration)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">duration</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {template.points} pts
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">points</p>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
              {getDifficultyLabel(template.difficulty)}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">difficulty</p>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            by {template.authorName}
          </span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            {getCategoryLabel(template.category)}
          </span>
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            {getAgeRangeLabel(template.ageRange)}
          </span>
        </div>

        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Steps */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Steps ({template.steps.length})
        </h2>
        <ol className="space-y-3">
          {template.steps.map((step, index) => (
            <li key={index} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium rounded-full">
                {step.order}
              </span>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-gray-100">{step.instruction}</p>
                {step.tips && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Tip: {step.tips}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Tips and Supplies */}
      <div className="grid md:grid-cols-2 gap-4">
        {template.tips.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Tips
            </h2>
            <ul className="space-y-2">
              {template.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                  <span className="text-yellow-500">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {template.supplies.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-500" />
              Supplies Needed
            </h2>
            <ul className="space-y-2">
              {template.supplies.map((supply, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  {supply}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-gray-500" />
            Reviews ({template.ratings.count})
          </h2>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Write a Review
          </button>
        </div>

        {/* Review form */}
        {showReviewForm && (
          <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewRating(rating)}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        rating <= reviewRating
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review (optional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                placeholder="Share your experience with this template..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}

        {/* Reviews list */}
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{review.userName}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'text-yellow-500 fill-current'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.review && (
                  <p className="text-gray-600 dark:text-gray-400">{review.review}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            No reviews yet. Be the first to review!
          </p>
        )}
      </div>
    </div>
  );
}
