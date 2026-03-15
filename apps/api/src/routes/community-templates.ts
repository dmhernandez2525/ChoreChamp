import { FastifyInstance } from 'fastify';
import type {
  CommunityTemplate,
  TemplateReview,
  TemplateSearchResult,
  TemplateCollection,
  MyTemplatesOverview,
} from '@chorechamp/types';
import {
  TEMPLATE_CATEGORIES,
  AGE_RANGES,
  TemplateSearchParamsSchema,
  CreateCommunityTemplateRequestSchema,
  UpdateCommunityTemplateRequestSchema,
  SubmitReviewRequestSchema,
  ImportTemplateRequestSchema,
} from '@chorechamp/types';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';
import { randomUUID } from 'crypto';

// Max pagination limit
const MAX_PAGE_LIMIT = 100;

// In-memory storage for templates
const communityTemplates = new Map<string, CommunityTemplate>();
const templateReviews = new Map<string, TemplateReview[]>();
const userFavorites = new Map<string, Set<string>>();
const userDownloads = new Map<string, string[]>();

// Seed some sample templates
function seedSampleTemplates() {
  if (communityTemplates.size > 0) return;

  const samples: CommunityTemplate[] = [
    {
      id: 'template-1',
      name: 'Morning Bedroom Routine',
      description: 'A simple morning routine to keep bedrooms tidy. Perfect for kids learning responsibility.',
      category: 'daily-routines',
      ageRange: 'child',
      estimatedDuration: 15,
      difficulty: 1,
      points: 10,
      steps: [
        { order: 1, instruction: 'Make your bed', tips: 'Pull sheets tight and fluff pillows' },
        { order: 2, instruction: 'Put dirty clothes in hamper' },
        { order: 3, instruction: 'Put away any toys or items on the floor' },
        { order: 4, instruction: 'Open curtains to let in light' },
      ],
      tips: ['Do this right after waking up', 'Play upbeat music to make it fun'],
      supplies: [],
      authorId: 'system',
      authorName: 'ChoreChamp Team',
      householdId: null,
      visibility: 'public',
      tags: ['morning', 'bedroom', 'kids', 'daily'],
      downloads: 1250,
      ratings: { average: 4.7, count: 89, distribution: { 1: 1, 2: 2, 3: 5, 4: 20, 5: 61 } },
      favorites: 342,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      publishedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'template-2',
      name: 'Weekly Kitchen Deep Clean',
      description: 'Comprehensive kitchen cleaning checklist for a spotless cooking space.',
      category: 'kitchen',
      ageRange: 'teen',
      estimatedDuration: 60,
      difficulty: 3,
      points: 50,
      steps: [
        { order: 1, instruction: 'Clear and wipe all countertops' },
        { order: 2, instruction: 'Clean stovetop and burners' },
        { order: 3, instruction: 'Wipe down all appliances (microwave, toaster, etc.)' },
        { order: 4, instruction: 'Clean inside the microwave' },
        { order: 5, instruction: 'Wipe cabinet fronts' },
        { order: 6, instruction: 'Clean sink and polish faucet' },
        { order: 7, instruction: 'Take out trash and recycling' },
        { order: 8, instruction: 'Sweep and mop floor' },
      ],
      tips: ['Work top to bottom', 'Use microfiber cloths for best results'],
      supplies: ['All-purpose cleaner', 'Microfiber cloths', 'Mop', 'Trash bags'],
      authorId: 'system',
      authorName: 'ChoreChamp Team',
      householdId: null,
      visibility: 'public',
      tags: ['kitchen', 'deep-clean', 'weekly'],
      downloads: 2100,
      ratings: { average: 4.8, count: 156, distribution: { 1: 2, 2: 3, 3: 8, 4: 28, 5: 115 } },
      favorites: 521,
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
      publishedAt: '2024-01-10T10:00:00Z',
    },
    {
      id: 'template-3',
      name: 'Pet Feeding & Care Routine',
      description: 'Daily pet care checklist for responsible pet owners.',
      category: 'pet-care',
      ageRange: 'child',
      estimatedDuration: 20,
      difficulty: 2,
      points: 15,
      steps: [
        { order: 1, instruction: 'Check and refill water bowl with fresh water' },
        { order: 2, instruction: 'Measure and serve pet food' },
        { order: 3, instruction: 'Clean food area if messy' },
        { order: 4, instruction: 'Quick brush (if applicable)' },
        { order: 5, instruction: 'Check litter box/outdoor needs' },
      ],
      tips: ['Always wash hands after handling pet supplies', 'Stick to feeding schedule'],
      supplies: ['Pet food', 'Fresh water', 'Brush'],
      authorId: 'system',
      authorName: 'ChoreChamp Team',
      householdId: null,
      visibility: 'public',
      tags: ['pets', 'daily', 'feeding', 'kids'],
      downloads: 890,
      ratings: { average: 4.6, count: 67, distribution: { 1: 1, 2: 2, 3: 6, 4: 18, 5: 40 } },
      favorites: 234,
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
      publishedAt: '2024-01-20T10:00:00Z',
    },
    {
      id: 'template-4',
      name: 'Bathroom Sparkle Routine',
      description: 'Keep your bathroom fresh and clean with this quick routine.',
      category: 'bathroom',
      ageRange: 'preteen',
      estimatedDuration: 25,
      difficulty: 2,
      points: 25,
      steps: [
        { order: 1, instruction: 'Spray and wipe mirror' },
        { order: 2, instruction: 'Wipe down sink and faucet' },
        { order: 3, instruction: 'Clean toilet (outside and seat)' },
        { order: 4, instruction: 'Wipe countertops' },
        { order: 5, instruction: 'Empty trash' },
        { order: 6, instruction: 'Replace towels if needed' },
      ],
      tips: ['Use separate cloths for toilet and other surfaces', 'Let cleaner sit before wiping'],
      supplies: ['Glass cleaner', 'Bathroom cleaner', 'Toilet brush', 'Microfiber cloths'],
      authorId: 'system',
      authorName: 'ChoreChamp Team',
      householdId: null,
      visibility: 'public',
      tags: ['bathroom', 'cleaning', 'quick'],
      downloads: 1500,
      ratings: { average: 4.5, count: 98, distribution: { 1: 2, 2: 4, 3: 10, 4: 25, 5: 57 } },
      favorites: 389,
      createdAt: '2024-01-12T10:00:00Z',
      updatedAt: '2024-01-12T10:00:00Z',
      publishedAt: '2024-01-12T10:00:00Z',
    },
    {
      id: 'template-5',
      name: 'Spring Cleaning Garage',
      description: 'Annual garage organization and deep clean for a clutter-free space.',
      category: 'seasonal',
      ageRange: 'adult',
      estimatedDuration: 180,
      difficulty: 5,
      points: 100,
      steps: [
        { order: 1, instruction: 'Remove everything from shelves and floor' },
        { order: 2, instruction: 'Sort items: keep, donate, trash' },
        { order: 3, instruction: 'Sweep entire floor' },
        { order: 4, instruction: 'Clean shelves and storage units' },
        { order: 5, instruction: 'Organize items back by category' },
        { order: 6, instruction: 'Label storage bins' },
        { order: 7, instruction: 'Dispose of or donate unwanted items' },
      ],
      tips: ['Start early in the day', 'Have donation boxes ready', 'Take before/after photos'],
      supplies: ['Broom', 'Storage bins', 'Labels', 'Trash bags', 'Donation boxes'],
      authorId: 'system',
      authorName: 'ChoreChamp Team',
      householdId: null,
      visibility: 'public',
      tags: ['garage', 'seasonal', 'organization', 'spring-cleaning'],
      downloads: 650,
      ratings: { average: 4.9, count: 45, distribution: { 1: 0, 2: 1, 3: 2, 4: 5, 5: 37 } },
      favorites: 178,
      createdAt: '2024-02-01T10:00:00Z',
      updatedAt: '2024-02-01T10:00:00Z',
      publishedAt: '2024-02-01T10:00:00Z',
    },
  ];

  samples.forEach((t) => communityTemplates.set(t.id, t));
}

// Initialize sample data
seedSampleTemplates();

export async function communityTemplateRoutes(fastify: FastifyInstance) {
  // GET /api/community-templates - Search/browse templates
  fastify.get('/', { preHandler: [requireAuth] }, async (request, reply) => {
    // Validate query params
    const parseResult = TemplateSearchParamsSchema.safeParse(request.query);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: parseResult.error.flatten(),
      });
    }
    const params = parseResult.data;
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, MAX_PAGE_LIMIT);

    let templates = Array.from(communityTemplates.values()).filter(
      (t) => t.visibility === 'public'
    );

    // Apply filters
    if (params.query) {
      const query = params.query.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (params.category) {
      templates = templates.filter((t) => t.category === params.category);
    }

    if (params.ageRange) {
      templates = templates.filter((t) => t.ageRange === params.ageRange || t.ageRange === 'all-ages');
    }

    if (params.minRating) {
      templates = templates.filter((t) => t.ratings.average >= params.minRating!);
    }

    if (params.maxDuration) {
      templates = templates.filter((t) => t.estimatedDuration <= params.maxDuration!);
    }

    if (params.difficulty) {
      templates = templates.filter((t) => t.difficulty === params.difficulty);
    }

    if (params.tags && params.tags.length > 0) {
      templates = templates.filter((t) => params.tags!.some((tag) => t.tags.includes(tag)));
    }

    // Sort
    switch (params.sortBy) {
      case 'recent':
        templates.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rating':
        templates.sort((a, b) => b.ratings.average - a.ratings.average);
        break;
      case 'downloads':
        templates.sort((a, b) => b.downloads - a.downloads);
        break;
      case 'popular':
      default:
        templates.sort((a, b) => b.downloads + b.favorites * 2 - (a.downloads + a.favorites * 2));
        break;
    }

    // Paginate
    const total = templates.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    templates = templates.slice(startIndex, startIndex + limit);

    const result: TemplateSearchResult = {
      templates,
      total,
      page,
      totalPages,
      hasMore: page < totalPages,
    };

    return result;
  });

  // GET /api/community-templates/categories - Get categories
  fastify.get('/categories', { preHandler: [requireAuth] }, async () => {
    return { categories: TEMPLATE_CATEGORIES, ageRanges: AGE_RANGES };
  });

  // GET /api/community-templates/featured - Get featured collections
  fastify.get('/featured', { preHandler: [requireAuth] }, async () => {
    const collections: TemplateCollection[] = [
      {
        id: 'collection-1',
        name: 'Getting Started with Kids',
        description: 'Easy chores perfect for children just starting their chore journey',
        templateIds: ['template-1', 'template-3'],
        featured: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'collection-2',
        name: 'Weekly Cleaning Essentials',
        description: 'Must-have templates for keeping your home clean all week',
        templateIds: ['template-2', 'template-4'],
        featured: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
    ];

    // Get templates for collections
    const populatedCollections = collections.map((c) => ({
      ...c,
      templates: c.templateIds
        .map((id) => communityTemplates.get(id))
        .filter((t): t is CommunityTemplate => t !== undefined),
    }));

    return { collections: populatedCollections };
  });

  // GET /api/community-templates/my-templates - User's templates
  fastify.get('/my-templates', { preHandler: [requireAuth] }, async (request) => {
    const { user } = request as AuthenticatedRequest;

    const userTemplates = Array.from(communityTemplates.values()).filter(
      (t) => t.authorId === user.id
    );

    const published = userTemplates.filter((t) => t.visibility === 'public');
    const drafts = userTemplates.filter((t) => t.visibility !== 'public');

    const overview: MyTemplatesOverview = {
      published,
      drafts,
      stats: {
        totalDownloads: published.reduce((sum, t) => sum + t.downloads, 0),
        totalRatings: published.reduce((sum, t) => sum + t.ratings.count, 0),
        averageRating:
          published.length > 0
            ? published.reduce((sum, t) => sum + t.ratings.average, 0) / published.length
            : 0,
        totalFavorites: published.reduce((sum, t) => sum + t.favorites, 0),
      },
    };

    return overview;
  });

  // GET /api/community-templates/favorites - User's favorites
  fastify.get('/favorites', { preHandler: [requireAuth] }, async (request) => {
    const { user } = request as AuthenticatedRequest;
    const favorites = userFavorites.get(user.id) || new Set();

    const templates = Array.from(favorites)
      .map((id) => communityTemplates.get(id))
      .filter((t): t is CommunityTemplate => t !== undefined && t.visibility === 'public');

    return { templates };
  });

  // GET /api/community-templates/:templateId - Get template details
  fastify.get('/:templateId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    const { user } = request as AuthenticatedRequest;

    const template = communityTemplates.get(templateId);
    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    // Check access
    if (template.visibility === 'private' && template.authorId !== user.id) {
      return reply.status(403).send({ error: 'Access denied' });
    }

    const reviews = templateReviews.get(templateId) || [];
    const isFavorite = userFavorites.get(user.id)?.has(templateId) || false;
    const hasDownloaded = userDownloads.get(user.id)?.includes(templateId) || false;

    return {
      template,
      reviews: reviews.slice(0, 10),
      totalReviews: reviews.length,
      isFavorite,
      hasDownloaded,
    };
  });

  // POST /api/community-templates - Create template
  fastify.post('/', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;

    // Validate request body
    const parseResult = CreateCommunityTemplateRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: parseResult.error.flatten(),
      });
    }
    const body = parseResult.data;

    const template: CommunityTemplate = {
      id: randomUUID(),
      name: body.name,
      description: body.description,
      category: body.category,
      ageRange: body.ageRange,
      estimatedDuration: body.estimatedDuration,
      difficulty: body.difficulty,
      points: body.points,
      steps: body.steps.map((s, i) => ({ ...s, order: i + 1 })),
      tips: body.tips,
      supplies: body.supplies,
      authorId: user.id,
      authorName: user.name || 'Anonymous',
      householdId: null,
      visibility: body.visibility,
      tags: body.tags,
      downloads: 0,
      ratings: { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
      favorites: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: body.visibility === 'public' ? new Date().toISOString() : null,
    };

    communityTemplates.set(template.id, template);
    return template;
  });

  // PATCH /api/community-templates/:templateId - Update template
  fastify.patch('/:templateId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    const { user } = request as AuthenticatedRequest;

    // Validate request body
    const parseResult = UpdateCommunityTemplateRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: parseResult.error.flatten(),
      });
    }
    const body = parseResult.data;

    const template = communityTemplates.get(templateId);
    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    if (template.authorId !== user.id) {
      return reply.status(403).send({ error: 'Not authorized to edit this template' });
    }

    const wasPrivate = template.visibility !== 'public';
    const isNowPublic = body.visibility === 'public';

    const updated: CommunityTemplate = {
      ...template,
      ...body,
      steps: body.steps ? body.steps.map((s, i) => ({ ...s, order: i + 1 })) : template.steps,
      updatedAt: new Date().toISOString(),
      publishedAt: wasPrivate && isNowPublic ? new Date().toISOString() : template.publishedAt,
    };

    communityTemplates.set(templateId, updated);
    return updated;
  });

  // DELETE /api/community-templates/:templateId - Delete template
  fastify.delete('/:templateId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    const { user } = request as AuthenticatedRequest;

    const template = communityTemplates.get(templateId);
    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    if (template.authorId !== user.id) {
      return reply.status(403).send({ error: 'Not authorized to delete this template' });
    }

    communityTemplates.delete(templateId);
    templateReviews.delete(templateId);

    return { success: true };
  });

  // POST /api/community-templates/:templateId/favorite - Toggle favorite
  fastify.post('/:templateId/favorite', { preHandler: [requireAuth] }, async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    const { user } = request as AuthenticatedRequest;

    const template = communityTemplates.get(templateId);
    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    const favorites = userFavorites.get(user.id) || new Set();
    const isFavorite = favorites.has(templateId);

    if (isFavorite) {
      favorites.delete(templateId);
      template.favorites = Math.max(0, template.favorites - 1);
    } else {
      favorites.add(templateId);
      template.favorites++;
    }

    userFavorites.set(user.id, favorites);
    communityTemplates.set(templateId, template);

    return { isFavorite: !isFavorite, favorites: template.favorites };
  });

  // POST /api/community-templates/:templateId/download - Download/import template
  fastify.post('/:templateId/download', { preHandler: [requireAuth] }, async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    const { user } = request as AuthenticatedRequest;

    // Validate request body
    const parseResult = ImportTemplateRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: parseResult.error.flatten(),
      });
    }
    const body = parseResult.data;

    const template = communityTemplates.get(templateId);
    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    // Verify membership
    const membership = await verifyMembership(user.id, body.householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Not a member of the household' });
    }

    // Track download
    const downloads = userDownloads.get(user.id) || [];
    if (!downloads.includes(templateId)) {
      downloads.push(templateId);
      userDownloads.set(user.id, downloads);
      template.downloads++;
      communityTemplates.set(templateId, template);
    }

    // Return template data for import (actual chore creation happens client-side)
    return {
      success: true,
      template: {
        name: body.customizations?.name || template.name,
        description: template.description,
        points: body.customizations?.points || template.points,
        estimatedDuration: template.estimatedDuration,
        difficulty: template.difficulty,
        steps: template.steps,
        tips: template.tips,
        supplies: template.supplies,
        category: template.category,
      },
    };
  });

  // POST /api/community-templates/:templateId/reviews - Submit review
  fastify.post('/:templateId/reviews', { preHandler: [requireAuth] }, async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    const { user } = request as AuthenticatedRequest;

    // Validate request body
    const parseResult = SubmitReviewRequestSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: 'Invalid request body',
        details: parseResult.error.flatten(),
      });
    }
    const body = parseResult.data;

    const template = communityTemplates.get(templateId);
    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    // Check if already reviewed
    const reviews = templateReviews.get(templateId) || [];
    const existingReview = reviews.find((r) => r.userId === user.id);

    if (existingReview) {
      // Update existing review
      existingReview.rating = body.rating;
      existingReview.review = body.review || null;
      existingReview.updatedAt = new Date().toISOString();
    } else {
      // Create new review
      const review: TemplateReview = {
        id: randomUUID(),
        templateId,
        userId: user.id,
        userName: user.name || 'Anonymous',
        rating: body.rating,
        review: body.review || null,
        helpful: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      reviews.push(review);
    }

    templateReviews.set(templateId, reviews);

    // Update template rating
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = total / reviews.length;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      distribution[r.rating as keyof typeof distribution]++;
    });

    template.ratings = { average, count: reviews.length, distribution };
    communityTemplates.set(templateId, template);

    return { success: true, ratings: template.ratings };
  });

  // GET /api/community-templates/:templateId/reviews - Get reviews
  fastify.get('/:templateId/reviews', { preHandler: [requireAuth] }, async (request, reply) => {
    const { templateId } = request.params as { templateId: string };
    const query = request.query as { page?: number; limit?: number };

    const template = communityTemplates.get(templateId);
    if (!template) {
      return reply.status(404).send({ error: 'Template not found' });
    }

    const reviews = templateReviews.get(templateId) || [];
    const page = query.page || 1;
    const limit = query.limit || 10;
    const startIndex = (page - 1) * limit;

    return {
      reviews: reviews.slice(startIndex, startIndex + limit),
      total: reviews.length,
      page,
      totalPages: Math.ceil(reviews.length / limit),
    };
  });
}
