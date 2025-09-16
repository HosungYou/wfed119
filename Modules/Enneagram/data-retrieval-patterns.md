# Enneagram Module Data Retrieval Patterns

## Overview
This document outlines the data storage and retrieval patterns for the Enneagram module v1.

## Core Data Patterns

### 1. User Type Profile Retrieval
**Pattern**: Cached profile with relationship preloading
```javascript
// Prisma query for user Enneagram profile
const getUserEnneagramProfile = async (userId) => {
  // Check cache
  const cached = await redis.get(`enneagram:${userId}`);
  if (cached) return JSON.parse(cached);
  
  // Fetch from database with relationships
  const profile = await prisma.userEnneagramProfiles.findFirst({
    where: { 
      userId,
      assessmentId: {
        in: await prisma.userEnneagramAssessments.findFirst({
          where: { 
            userId,
            completionStatus: 'completed'
          },
          orderBy: { completedAt: 'desc' },
          select: { id: true }
        })
      }
    },
    include: {
      enneagramType: {
        include: {
          wings: true,
          levels: true,
          stressPoint: true,
          growthPoint: true
        }
      },
      subtype: true
    }
  });
  
  // Cache for 2 hours
  await redis.setex(`enneagram:${userId}`, 7200, JSON.stringify(profile));
  return profile;
};
```

### 2. Type Compatibility Analysis
**Pattern**: Pre-computed matrix with lazy loading
```javascript
// Get compatibility between two types
const getTypeCompatibility = async (type1, type2) => {
  // Use sorted key for consistency
  const key = [type1, type2].sort().join(':');
  
  // Check cache
  const cached = await redis.get(`compatibility:${key}`);
  if (cached) return JSON.parse(cached);
  
  // Query pre-computed compatibility
  const compatibility = await prisma.typeRelationships.findFirst({
    where: {
      OR: [
        { type1, type2 },
        { type1: type2, type2: type1 }
      ]
    }
  });
  
  // Cache indefinitely (static data)
  await redis.set(`compatibility:${key}`, JSON.stringify(compatibility));
  return compatibility;
};
```

### 3. Growth Tracking and Insights
**Pattern**: Time-series data with aggregation
```javascript
// Track user growth over time
const trackEnneagramGrowth = async (userId) => {
  const growthData = await prisma.userEnneagramGrowth.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: {
      type: true,
      actionItems: true
    }
  });
  
  // Aggregate progress
  const progress = growthData.map(entry => ({
    date: entry.createdAt,
    level: entry.currentLevel,
    targetLevel: entry.targetLevel,
    progressPercentage: ((entry.currentLevel / entry.targetLevel) * 100).toFixed(2)
  }));
  
  return {
    currentLevel: growthData[growthData.length - 1]?.currentLevel,
    history: progress,
    trends: calculateGrowthTrends(progress)
  };
};
```

## Retrieval Strategies

### 1. Type Information (Static Data)
```javascript
// Load all type information once at startup
const loadEnneagramTypes = async () => {
  const types = await prisma.enneagramTypes.findMany({
    include: {
      wings: true,
      levels: {
        orderBy: { levelNumber: 'asc' }
      },
      content: {
        where: { isActive: true }
      }
    }
  });
  
  // Store in memory cache
  types.forEach(type => {
    memoryCache.set(`type:${type.typeNumber}`, type);
  });
  
  return types;
};
```

### 2. Assessment Processing
```javascript
// Process assessment responses to determine type
const processEnneagramAssessment = async (userId, responses) => {
  // Store raw responses
  const assessment = await prisma.userEnneagramAssessments.create({
    data: {
      userId,
      responses,
      completionStatus: 'completed',
      completedAt: new Date()
    }
  });
  
  // Calculate type scores
  const typeScores = await calculateTypeScores(responses);
  
  // Determine primary type and wing
  const { primaryType, wing, confidence } = analyzeTypeScores(typeScores);
  
  // Determine subtype
  const subtype = await determineSubtype(responses);
  
  // Calculate tritype
  const tritype = calculateTritype(typeScores);
  
  // Store profile
  const profile = await prisma.userEnneagramProfiles.create({
    data: {
      userId,
      assessmentId: assessment.id,
      primaryType,
      primaryConfidence: confidence,
      wingType: wing,
      subtypeId: subtype.id,
      tritype,
      typeScores
    }
  });
  
  // Invalidate cache
  await redis.del(`enneagram:${userId}`);
  
  return profile;
};
```

### 3. Personalized Content Delivery
```javascript
// Get personalized content based on type
const getPersonalizedContent = async (userId, contentType) => {
  const profile = await getUserEnneagramProfile(userId);
  
  if (!profile) return [];
  
  // Fetch content for user's type
  const content = await prisma.enneagramContent.findMany({
    where: {
      typeNumber: profile.primaryType,
      contentType,
      isActive: true
    },
    orderBy: [
      { relevanceScore: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 10
  });
  
  // Track content delivery
  await prisma.contentDelivery.create({
    data: {
      userId,
      contentIds: content.map(c => c.id),
      deliveredAt: new Date()
    }
  });
  
  return content;
};
```

## Caching Strategy

### Cache Layers
1. **Memory Cache** (In-Process)
   - Static type information: No expiry
   - Type relationships: No expiry
   - Growth levels: No expiry

2. **Redis Cache**
   - User profiles: 2 hours TTL
   - Assessment results: 24 hours TTL
   - Personalized insights: 6 hours TTL
   - Compatibility analyses: No expiry

3. **Database Materialized Views**
   - User type distribution
   - Common type pairs
   - Growth progress aggregates

### Cache Invalidation Rules
```javascript
const invalidateEnneagramCache = async (userId) => {
  const keys = [
    `enneagram:${userId}`,
    `enneagram:insights:${userId}`,
    `enneagram:growth:${userId}`,
    `enneagram:content:${userId}:*`
  ];
  
  await redis.del(...keys);
};
```

## Performance Optimizations

### 1. Batch Type Analysis
```javascript
// Analyze multiple users' types efficiently
const batchAnalyzeTypes = async (userIds) => {
  const profiles = await prisma.userEnneagramProfiles.findMany({
    where: {
      userId: { in: userIds },
      assessmentId: {
        in: await prisma.$queryRaw`
          SELECT MAX(id) as id 
          FROM user_enneagram_assessments 
          WHERE user_id = ANY(${userIds})
          GROUP BY user_id
        `
      }
    },
    include: {
      enneagramType: true
    }
  });
  
  return profiles.reduce((acc, profile) => {
    acc[profile.userId] = profile;
    return acc;
  }, {});
};
```

### 2. Relationship Dynamics Preloading
```javascript
// Preload all relationship dynamics for a team
const preloadTeamDynamics = async (teamUserIds) => {
  // Get all team members' types
  const profiles = await batchAnalyzeTypes(teamUserIds);
  
  // Get unique type pairs
  const typePairs = new Set();
  const types = Object.values(profiles).map(p => p.primaryType);
  
  for (let i = 0; i < types.length; i++) {
    for (let j = i + 1; j < types.length; j++) {
      typePairs.add([types[i], types[j]].sort().join(':'));
    }
  }
  
  // Batch load compatibility
  const compatibilities = await Promise.all(
    Array.from(typePairs).map(pair => {
      const [type1, type2] = pair.split(':').map(Number);
      return getTypeCompatibility(type1, type2);
    })
  );
  
  return compatibilities;
};
```

### 3. Insight Generation Queue
```javascript
// Queue-based insight generation
const queueInsightGeneration = async (userId) => {
  await queue.add('generate-enneagram-insights', {
    userId,
    priority: 1
  });
};

// Worker process
queue.process('generate-enneagram-insights', async (job) => {
  const { userId } = job.data;
  
  const [profile, growth, recentInsights] = await Promise.all([
    getUserEnneagramProfile(userId),
    trackEnneagramGrowth(userId),
    getRecentInsights(userId)
  ]);
  
  const newInsights = await generateInsights({
    profile,
    growth,
    recentInsights
  });
  
  await prisma.enneagramInsights.createMany({
    data: newInsights
  });
  
  // Notify user
  await notifyUser(userId, 'new_insights_available');
});
```

## Data Consistency

### Transaction Patterns
```javascript
// Ensure consistency during profile updates
const updateEnneagramProfile = async (userId, updates) => {
  return await prisma.$transaction(async (tx) => {
    // Get current profile
    const current = await tx.userEnneagramProfiles.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    // Create new profile version
    const newProfile = await tx.userEnneagramProfiles.create({
      data: {
        ...current,
        ...updates,
        previousVersionId: current.id
      }
    });
    
    // Update growth tracking
    if (updates.primaryType !== current.primaryType) {
      await tx.userEnneagramGrowth.create({
        data: {
          userId,
          typeNumber: updates.primaryType,
          currentLevel: 5, // Default middle level
          targetLevel: 2, // Healthy level
          growthAreas: await identifyGrowthAreas(updates.primaryType)
        }
      });
    }
    
    // Invalidate caches
    await invalidateEnneagramCache(userId);
    
    return newProfile;
  });
};
```

## Monitoring & Analytics

### Key Metrics
```javascript
const enneagramMetrics = {
  // User engagement
  assessmentCompletionRate: async () => {
    const completed = await prisma.userEnneagramAssessments.count({
      where: { completionStatus: 'completed' }
    });
    const total = await prisma.userEnneagramAssessments.count();
    return (completed / total) * 100;
  },
  
  // Type distribution
  typeDistribution: async () => {
    return await prisma.$queryRaw`
      SELECT primary_type, COUNT(*) as count
      FROM user_enneagram_profiles
      WHERE assessment_id IN (
        SELECT MAX(id) FROM user_enneagram_assessments
        GROUP BY user_id
      )
      GROUP BY primary_type
      ORDER BY primary_type
    `;
  },
  
  // Growth progress
  averageGrowthProgress: async () => {
    return await prisma.$queryRaw`
      SELECT AVG(
        CAST(current_level AS FLOAT) / 
        NULLIF(target_level, 0)
      ) * 100 as average_progress
      FROM user_enneagram_growth
      WHERE updated_at > NOW() - INTERVAL '30 days'
    `;
  }
};
```