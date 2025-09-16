# Strength Discovery Module

## Overview
The Strength Discovery module helps users identify and develop their personal strengths through AI-powered assessments and personalized insights.

## 📁 Module Contents

### Core Files
- `README.md` - This overview document
- `database-schema.sql` - PostgreSQL schema for strength data
- `data-retrieval-patterns.md` - Data access patterns and caching strategies
- `strength_discovery_conversation_flow.md` - AI conversation design

### React Components
- `StrengthHexagon.tsx` - Hexagonal strength visualization
- `StrengthRadarChart.tsx` - Radar chart for strength comparison  
- `StrengthMindMap.tsx` - Mind map visualization of strengths

## Database Design

### Core Tables
- `user_strengths` - User's identified strengths
- `strength_assessments` - Assessment history and results
- `strength_categories` - Taxonomy of strength types
- `strength_insights` - Generated insights and recommendations

## API Endpoints

### Assessment
- `POST /api/strength/assessment` - Submit assessment
- `GET /api/strength/assessment/:id` - Retrieve assessment results

### Analysis
- `GET /api/strength/profile/:userId` - Get user's strength profile
- `POST /api/strength/insights` - Generate personalized insights

### Progress
- `GET /api/strength/progress/:userId` - Track development
- `POST /api/strength/goals` - Set strength development goals

## Development Status
- [ ] Database schema implementation
- [ ] Assessment conversation flow
- [✓] Visualization components (3 complete)
- [ ] API endpoint creation
- [ ] Integration with Enneagram module

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- React 18+ with TypeScript

### Database Setup
```bash
# Apply the schema
psql -U admin -d wfed119 -f database-schema.sql
```

### Using Components
```tsx
import { StrengthRadarChart } from '@/modules/StrengthDiscovery/StrengthRadarChart';
import { StrengthHexagon } from '@/modules/StrengthDiscovery/StrengthHexagon';
import { StrengthMindMap } from '@/modules/StrengthDiscovery/StrengthMindMap';
```

### Development
See the main project setup in `/lifecraft-bot/README.md`

## Related Modules
- **Enneagram**: Complementary personality assessment
- **LifePlan**: Uses strength insights for career planning