# Module Collaboration Guide

## Overview
This guide helps collaborators understand how to work with the StrengthDiscovery and Enneagram modules effectively.

## For Database Lead (Jonathan)

### Your Focus Areas

#### StrengthDiscovery Module
- **Schema Location**: `/Modules/StrengthDiscovery/database-schema.sql`
- **Data Patterns**: `/Modules/StrengthDiscovery/data-retrieval-patterns.md`
- **Key Tables**: `user_strengths`, `strength_assessments`, `strength_insights`

#### Enneagram Module  
- **Schema Location**: `/Modules/Enneagram/database-schema.sql`
- **Data Patterns**: `/Modules/Enneagram/data-retrieval-patterns.md`
- **Key Tables**: `enneagram_sessions`, `user_enneagram_profiles`, `enneagram_types`

### Immediate Tasks

1. **Review Database Schemas**
   ```bash
   cd "/Volumes/External SSD/Projects/Research/WFED119/Modules"
   
   # Review schemas
   cat StrengthDiscovery/database-schema.sql
   cat Enneagram/database-schema.sql
   ```

2. **Set Up Local Database**
   ```bash
   # Using Docker (recommended)
   docker run --name lifecraft-db \
     -e POSTGRES_PASSWORD=yourpassword \
     -e POSTGRES_DB=lifecraft \
     -p 5432:5432 \
     -d postgres:15
   
   # Apply schemas
   psql -U postgres -d lifecraft < StrengthDiscovery/database-schema.sql
   psql -U postgres -d lifecraft < Enneagram/database-schema.sql
   ```

3. **Test Data Retrieval Patterns**
   - Implement the patterns from `data-retrieval-patterns.md`
   - Focus on caching strategies
   - Optimize query performance

### Key Decisions Needed

1. **PostgreSQL vs Alternatives**
   - Current: PostgreSQL with Prisma ORM
   - Consider: Performance, scalability, JSON support
   - Document recommendation in `/Modules/database-recommendation.md`

2. **Caching Strategy**
   - Redis for session data?
   - In-memory caching for static data?
   - Database materialized views?

3. **Data Partitioning**
   - Partition by user_id?
   - Archive old assessments?
   - Separate read/write concerns?

## For RAG Lead (Trivikram)

### Integration Points

While your primary focus is on PDF translation and RAG pipeline, these modules may integrate with your work:

1. **Content Generation**
   - Strength descriptions and insights
   - Enneagram type information
   - Could be source documents for RAG

2. **Multilingual Support**
   - Korean translations needed for both modules
   - Assessment questions in multiple languages
   - Results export in Korean/English

### Potential Collaboration

1. **Document Processing**
   - Process strength/Enneagram PDFs
   - Extract assessment questions from documents
   - Build knowledge base for insights

2. **Export Functionality**
   - Both modules need PDF export
   - Your PDF expertise valuable here
   - Maintain layout for reports

## Development Workflow

### 1. Getting Started

```bash
# Clone repository
git clone https://github.com/HosungYou/wfed119.git

# Navigate to modules
cd wfed119/Modules

# Read module documentation
cat StrengthDiscovery/README.md
cat Enneagram/README.md
```

### 2. Understanding Current Implementation

```bash
# Navigate to actual implementation
cd ../lifecraft-bot

# Install dependencies
pnpm install

# Start development server
pnpm dev

# View modules in browser
open http://localhost:3000/discover/strengths
open http://localhost:3000/discover/enneagram
```

### 3. Making Changes

#### For Database Changes

1. **Modify Schema**
   ```sql
   -- Edit in /Modules/[ModuleName]/database-schema.sql
   ALTER TABLE user_strengths ADD COLUMN new_field VARCHAR(255);
   ```

2. **Update Prisma Schema**
   ```prisma
   // Edit /lifecraft-bot/prisma/schema.prisma
   model UserStrength {
     newField String?
   }
   ```

3. **Run Migration**
   ```bash
   cd lifecraft-bot
   pnpm prisma migrate dev --name add_new_field
   ```

#### For Logic Changes

1. **Locate File** (see CODE_MAP.md)
2. **Make Changes**
3. **Test Locally**
4. **Create PR**

### 4. Testing Your Changes

```bash
# Run tests
pnpm test

# Test specific module
pnpm test enneagram
pnpm test strength

# Manual testing
pnpm dev
# Navigate to module pages
```

## Communication Protocol

### Daily Standups
- Post progress in Slack channel
- Flag blockers immediately
- Share interesting findings

### Code Reviews
1. Create feature branch: `feature/module-name-description`
2. Make changes
3. Push and create PR
4. Tag relevant team members
5. Address feedback
6. Merge when approved

### Documentation Updates
- Update module README when adding features
- Keep interface specs current
- Document breaking changes
- Update this guide as needed

## Module-Specific Guidelines

### StrengthDiscovery Module

#### Key Concepts
- **Top 5 Strengths**: Primary focus
- **34 Themes**: Based on Gallup framework
- **4 Domains**: Executing, Influencing, Relationship, Strategic Thinking

#### Development Priorities
1. Assessment accuracy
2. Visualization quality
3. Insight generation
4. Performance optimization

#### Testing Approach
- Unit test scoring algorithms
- Integration test assessment flow
- E2E test full journey
- Performance test with large datasets

### Enneagram Module

#### Key Concepts
- **9 Types**: Core personality types
- **Wings**: Adjacent type influences
- **Instincts**: Self-preservation, Social, Sexual
- **Levels of Health**: 9 levels per type

#### Development Priorities
1. Type determination accuracy
2. Discriminator effectiveness
3. Instinctual variant calculation
4. Report generation quality

#### Testing Approach
- Validate against known type profiles
- Test discriminator logic
- Verify wing calculations
- Check tritype accuracy

## Common Issues and Solutions

### Issue: Module not loading
```bash
# Check if server is running
pnpm dev

# Check for errors in console
# Check network tab for failed requests
```

### Issue: Database connection failed
```bash
# Verify DATABASE_URL in .env.local
echo $DATABASE_URL

# Test connection
pnpm prisma db pull

# Check if database is running
docker ps
```

### Issue: Import errors
```typescript
// Use correct alias
import { something } from '@/lib/module/file';
// Not: import { something } from '../../../lib/module/file';
```

### Issue: Type errors
```bash
# Generate Prisma types
pnpm prisma generate

# Check TypeScript
pnpm tsc --noEmit
```

## Resources

### Documentation
- [Module Architecture](./StrengthDiscovery/MODULE_ARCHITECTURE.md)
- [Interface Specifications](./StrengthDiscovery/INTERFACE_SPEC.md)
- [Development Guide](./StrengthDiscovery/DEVELOPMENT_GUIDE.md)
- [Code Map](./CODE_MAP.md)

### External Resources
- [Gallup StrengthsFinder](https://www.gallup.com/cliftonstrengths)
- [Enneagram Institute](https://www.enneagraminstitute.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

### Team Contacts
- **Hosung**: Project lead, overall architecture
- **Jonathan**: Database design and optimization
- **Trivikram**: RAG pipeline and document processing

## Best Practices

### Code Quality
- Write clear, self-documenting code
- Add comments for complex logic
- Follow existing patterns
- Use TypeScript strictly

### Performance
- Implement caching where appropriate
- Optimize database queries
- Lazy load heavy components
- Monitor API response times

### Security
- Validate all inputs
- Sanitize user data
- Use parameterized queries
- Implement rate limiting

### Collaboration
- Communicate early and often
- Document your decisions
- Ask questions when unsure
- Share knowledge with team

## Module Roadmap

### Phase 1: Foundation (Current)
- ✅ Basic module structure
- ✅ Database schemas
- ✅ Core APIs
- 🔄 Testing framework

### Phase 2: Enhancement
- [ ] Advanced visualizations
- [ ] Improved algorithms
- [ ] Performance optimization
- [ ] Comprehensive testing

### Phase 3: Integration
- [ ] Cross-module insights
- [ ] Unified dashboard
- [ ] Export/import functionality
- [ ] Analytics pipeline

### Phase 4: Scale
- [ ] Microservice architecture
- [ ] Independent deployment
- [ ] Horizontal scaling
- [ ] Advanced caching

## Questions and Support

### Getting Help
1. Check documentation first
2. Search existing issues on GitHub
3. Ask in Slack channel
4. Schedule pair programming session

### Reporting Issues
1. Create GitHub issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
2. Tag relevant team members
3. Label appropriately (bug, enhancement, etc.)

### Suggesting Improvements
- Open to all suggestions
- Create issue or discussion
- Provide use case and benefits
- Consider implementation complexity