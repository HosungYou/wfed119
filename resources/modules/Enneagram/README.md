# Enneagram Module

## Overview
The Enneagram module provides personality type assessment and insights based on the Enneagram system, helping users understand their core motivations, fears, and growth paths.

## 📁 Module Contents

### Core Files
- `README.md` - This overview document
- `Enneagram_Test_Plan.md` - Complete testing strategy
- `database-schema.sql` - PostgreSQL schema for Enneagram data
- `data-retrieval-patterns.md` - Data access patterns and caching strategies

## Database Design

### Core Tables
- `enneagram_types` - Nine core types with descriptions
- `user_enneagram_profiles` - User's Enneagram type and wings
- `enneagram_assessments` - Assessment history
- `type_relationships` - Inter-type dynamics
- `growth_paths` - Development recommendations per type

## Data Storage Patterns

### Type Information
- Static type descriptions cached in memory
- User type profiles stored with confidence scores
- Historical assessment data for type evolution tracking

### Relationship Dynamics
- Pre-computed compatibility matrices
- Cached interaction patterns
- Dynamic relationship insights

## API Endpoints

### Assessment
- `POST /api/enneagram/assessment` - Submit type assessment
- `GET /api/enneagram/assessment/:id` - Get assessment results

### Type Information
- `GET /api/enneagram/types` - List all types
- `GET /api/enneagram/type/:number` - Get specific type details
- `GET /api/enneagram/user/:userId/type` - Get user's type

### Growth & Development
- `GET /api/enneagram/growth/:typeNumber` - Growth recommendations
- `GET /api/enneagram/stress/:typeNumber` - Stress patterns
- `POST /api/enneagram/journal` - Track growth journey

### Relationships
- `GET /api/enneagram/compatibility/:type1/:type2` - Type compatibility
- `GET /api/enneagram/team-dynamics` - Team type analysis

## Integration Points

### With Other Modules
- **Strength Discovery**: Map strengths to Enneagram types
- **Life Planning**: Use type insights for goal alignment
- **Communication**: Tailor communication based on type
- **Team Building**: Optimize team composition

## Enneagram Types Overview

### Type 1: The Perfectionist
- Core Motivation: Being good, right, perfect
- Core Fear: Being corrupt, defective

### Type 2: The Helper
- Core Motivation: Being loved and needed
- Core Fear: Being unloved, unwanted

### Type 3: The Achiever
- Core Motivation: Being valuable and worthwhile
- Core Fear: Being worthless

### Type 4: The Individualist
- Core Motivation: Finding themselves and significance
- Core Fear: Having no identity

### Type 5: The Investigator
- Core Motivation: Being competent and understanding
- Core Fear: Being overwhelmed, invaded

### Type 6: The Loyalist
- Core Motivation: Having security and support
- Core Fear: Being without support, guidance

### Type 7: The Enthusiast
- Core Motivation: Maintaining happiness and freedom
- Core Fear: Being in pain, deprived

### Type 8: The Challenger
- Core Motivation: Being self-reliant, in control
- Core Fear: Being controlled, vulnerable

### Type 9: The Peacemaker
- Core Motivation: Maintaining inner and outer peace
- Core Fear: Loss of connection, separation

## Development Status
- [ ] Database schema implementation
- [ ] Assessment tool development  
- [ ] Type analysis engine
- [ ] API endpoint creation
- [ ] Content management system
- [ ] Integration with StrengthDiscovery module

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- Basic understanding of Enneagram theory

### Database Setup
```bash
# Apply the schema
psql -U admin -d wfed119 -f database-schema.sql
```

### Development
See the main project setup in `/lifecraft-bot/README.md`

## Related Modules
- **StrengthDiscovery**: Complementary strength assessment
- **LifePlan**: Uses Enneagram insights for career planning