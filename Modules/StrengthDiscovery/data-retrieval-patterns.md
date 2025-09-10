# Strength Discovery Data Retrieval Patterns

## Overview
This document outlines the data storage and retrieval patterns for the Strength Discovery module v1.

## Core Data Patterns

### 1. User Strength Profile Retrieval
**Pattern**: Cached aggregate with lazy refresh
```javascript
// Prisma query example
const getUserStrengthProfile = async (userId) => {
  // Check cache first
  const cached = await redis.get(`strength_profile:${userId}`);
  if (cached) return JSON.parse(cached);
  
  // Fetch from database
  const profile = await prisma.userStrengths.findMany({
    where: { 
      userId,
      assessmentId: {
        in: await prisma.userAssessments.findFirst({
          where: { userId },
          orderBy: { completedAt: 'desc' },
          select: { id: true }
        })
      }
    },
    include: {
      strength: {
        include: { category: true }
      }
    },
    orderBy: { rank: 'asc' },
    take: 10
  });
  
  // Cache for 1 hour
  await redis.setex(`strength_profile:${userId}`, 3600, JSON.stringify(profile));
  return profile;
};
```

### 2. Assessment Data Storage
**Pattern**: Event-sourced with snapshots
```javascript
// Store assessment responses incrementally
const saveAssessmentProgress = async (userId, assessmentId, responses) => {
  // Append to event stream
  await prisma.assessmentEvents.create({
    data: {
      userId,
      assessmentId,
      eventType: 'RESPONSE_SAVED',
      payload: responses,
      timestamp: new Date()
    }
  });
  
  // Update snapshot every 10 responses
  if (responses.length % 10 === 0) {
    await createAssessmentSnapshot(assessmentId);
  }
};
```

### 3. Strength Insights Generation
**Pattern**: Queue-based processing with caching
```javascript
// Generate insights asynchronously
const generateStrengthInsights = async (userId) => {
  // Queue for processing
  await queue.add('generate-insights', { userId });
  
  // Worker processes in background
  queue.process('generate-insights', async (job) => {
    const insights = await analyzeUserStrengths(job.data.userId);
    
    // Store in database
    await prisma.strengthInsights.createMany({
      data: insights
    });
    
    // Invalidate cache
    await redis.del(`strength_profile:${job.data.userId}`);
  });
};
```

## Retrieval Strategies

### 1. Most Recent Assessment
```sql
-- Get latest assessment with computed strengths
WITH latest_assessment AS (
  SELECT * FROM user_assessments
  WHERE user_id = $1
  ORDER BY completed_at DESC
  LIMIT 1
)
SELECT * FROM user_strengths
WHERE assessment_id = (SELECT id FROM latest_assessment);
```

### 2. Historical Strength Development
```sql
-- Track strength changes over time
SELECT 
  s.name,
  us.score,
  ua.completed_at
FROM user_strengths us
JOIN strengths s ON us.strength_id = s.id
JOIN user_assessments ua ON us.assessment_id = ua.id
WHERE us.user_id = $1
  AND s.id IN ($2) -- specific strengths
ORDER BY ua.completed_at;
```

### 3. Personalized Recommendations
```javascript
// Combine multiple data sources
const getPersonalizedRecommendations = async (userId) => {
  const [strengths, goals, activities] = await Promise.all([
    getUserTopStrengths(userId),
    getActiveGoals(userId),
    getRecentActivities(userId)
  ]);
  
  return generateRecommendations({
    strengths,
    goals,
    activities,
    userId
  });
};
```

## Caching Strategy

### Cache Levels
1. **Application Cache** (Redis)
   - User strength profiles: 1 hour TTL
   - Assessment results: 24 hours TTL
   - Insights: 6 hours TTL

2. **Database Cache** (Materialized Views)
   - User strength summaries
   - Category aggregations
   - Trending strengths

3. **CDN Cache** (Static Assets)
   - Assessment questions
   - Strength descriptions
   - Category metadata

### Cache Invalidation
- On new assessment completion
- On manual strength update
- On goal achievement
- Scheduled daily refresh

## Performance Optimizations

### 1. Batch Loading
```javascript
// Load multiple users' strengths efficiently
const batchLoadStrengths = async (userIds) => {
  return await prisma.userStrengths.findMany({
    where: { userId: { in: userIds } },
    include: { strength: true }
  });
};
```

### 2. Pagination
```javascript
// Paginate large result sets
const getPaginatedInsights = async (userId, page = 1, limit = 20) => {
  return await prisma.strengthInsights.findMany({
    where: { userId },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });
};
```

### 3. Selective Field Loading
```javascript
// Load only required fields
const getStrengthSummary = async (userId) => {
  return await prisma.userStrengths.findMany({
    where: { userId },
    select: {
      strength: {
        select: { name: true, category: true }
      },
      score: true,
      rank: true
    }
  });
};
```

## Data Consistency

### Transaction Patterns
```javascript
// Ensure consistency during assessment completion
const completeAssessment = async (assessmentId, responses) => {
  return await prisma.$transaction(async (tx) => {
    // Update assessment status
    await tx.userAssessments.update({
      where: { id: assessmentId },
      data: { 
        completionStatus: 'completed',
        completedAt: new Date()
      }
    });
    
    // Calculate and store strengths
    const strengths = calculateStrengths(responses);
    await tx.userStrengths.createMany({
      data: strengths
    });
    
    // Generate initial insights
    const insights = generateInitialInsights(strengths);
    await tx.strengthInsights.createMany({
      data: insights
    });
  });
};
```

## Monitoring & Metrics

### Key Metrics to Track
- Assessment completion rate
- Average retrieval time
- Cache hit ratio
- Insight generation latency
- Database query performance

### Implementation
```javascript
// Track performance metrics
const trackMetric = async (metric, value) => {
  await metrics.gauge(metric, value);
  await logger.info(`Metric: ${metric} = ${value}`);
};

// Usage
const profile = await trackPerformance(
  'strength_profile_retrieval',
  () => getUserStrengthProfile(userId)
);
```