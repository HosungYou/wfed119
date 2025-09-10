# Starter Backlog Guide for Interns

**Version:** 1.0  
**Last Updated:** September 9, 2025  
**Audience:** New interns with beginner to intermediate programming experience

---

## 🎯 What is the Starter Backlog?

The Starter Backlog is your **learning roadmap** for the first two weeks. Each task is:
- **Bite-sized**: Can be completed in 1-3 days
- **Testable**: Has clear success criteria
- **Educational**: Teaches you core concepts
- **Practical**: Builds real features we need

Think of it as **guided learning** where each task builds on the previous one.

---

## 📋 How Tasks Work

### Task Structure
Every task follows this format:
```
ID: Unique identifier (e.g., DB-01)
Title: What you're building
Output: Specific files/features you'll create
Acceptance: How we know it's done correctly
```

### One Task = One Pull Request
- Create a new branch for each task
- Complete the task fully
- Submit one pull request
- Get code review
- Merge when approved

---

## 🗄️ Database Workstream (Jonathan - Lead)

> **Goal**: Build a robust, scalable database system for the LifeCraft platform

### 📚 What You'll Learn
- Docker containerization
- PostgreSQL database management
- Schema design and migrations
- Data security and backups
- SQL optimization

---

### **DB-01: Local Postgres in Docker** 
**⏱️ Estimated Time**: 1-2 days  
**🎓 Difficulty**: Beginner

#### What You're Building
A containerized PostgreSQL database that runs consistently across all environments.

#### Why This Matters
- **Problem**: "It works on my machine" issues
- **Solution**: Docker ensures everyone has the same database setup
- **Real-world**: All modern companies use containerization

#### Deliverables
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Named volume
    healthcheck:
      test: ["CMD", "pg_isready"]               # Health check
    ports:
      - "5432:5432"

# init.sql
CREATE DATABASE lifecraft_dev;
-- Initial setup queries
```

#### Success Criteria (Acceptance)
1. Run `docker-compose up` - container starts without errors
2. Health check shows "healthy" status
3. Connect using: `psql -h localhost -U postgres -d lifecraft_dev`

#### Learning Resources
- [Docker Compose Tutorial](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)

---

### **DB-02: ERD v0 and Core Tables**
**⏱️ Estimated Time**: 2-3 days  
**🎓 Difficulty**: Intermediate

#### What You're Building
The database schema (structure) that stores all our application data.

#### Why This Matters
- **Foundation**: Everything else depends on good data structure
- **Performance**: Well-designed tables = fast queries
- **Scalability**: Good schema handles growth

#### Deliverables
```sql
-- ERD (Entity Relationship Diagram) - Visual representation
users table ←→ enrollments table ←→ courses table
     ↓               ↓                    ↓
interactions ←→ documents ←→ artifacts

-- DDL (Data Definition Language)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE courses (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT
);

-- ... more tables
```

#### Success Criteria
1. ERD diagram clearly shows relationships
2. All 5 tables create without errors
3. Sample data inserts successfully

#### Tools You'll Use
- **ERD Tool**: dbdiagram.io or draw.io
- **Database Client**: pgAdmin or TablePlus

---

### **DB-03: Migrations Tool**
**⏱️ Estimated Time**: 1-2 days  
**🎓 Difficulty**: Intermediate

#### What You're Building
A system to safely update database structure over time.

#### Why This Matters
- **Problem**: How do you update production databases safely?
- **Solution**: Migrations = version control for your database
- **Real-world**: Essential for any application that evolves

#### Key Concepts
```bash
# Migration = A single database change
# Forward migration = Apply the change
# Rollback = Undo the change

# Example:
npx prisma migrate dev --name add_user_preferences
# Creates:
# - 001_add_user_preferences_up.sql   (forward)
# - 001_add_user_preferences_down.sql (rollback)
```

#### Deliverables
- Migration files for creating initial schema
- Rollback scripts that undo changes
- Documentation on how to run migrations

#### Success Criteria
1. `migrate up` creates all tables
2. `migrate down` removes all tables
3. Process works on fresh database

---

### **DB-04: Seed Script**
**⏱️ Estimated Time**: 1 day  
**🎓 Difficulty**: Beginner

#### What You're Building
A script that fills your database with realistic test data.

#### Why This Matters
- **Testing**: Need data to test features
- **Development**: Easier to work with realistic data
- **Demos**: Makes presentations look professional

#### Deliverables
```javascript
// seed.js
async function seed() {
  // Create 10 test users
  const users = await createUsers(10);
  
  // Create 2 courses
  const courses = await createCourses(2);
  
  // Create 50 documents
  const docs = await createDocuments(50);
  
  // Create 100 interactions
  const interactions = await createInteractions(100);
  
  console.log('✅ Seeding complete!');
}
```

#### Success Criteria
1. Script runs without errors
2. Correct number of rows in each table:
   - 10 users
   - 2 courses  
   - 50 documents
   - 100 interactions

---

### **DB-05: Read Models for RAG**
**⏱️ Estimated Time**: 2 days  
**🎓 Difficulty**: Advanced

#### What You're Building
SQL views that make it easy for the RAG system to read document data.

#### Why This Matters
- **Problem**: RAG needs clean, structured data
- **Solution**: Views hide complexity and provide clean interface
- **Performance**: Optimized queries built once, used many times

#### Key Concepts
```sql
-- View = Virtual table that simplifies complex queries
CREATE VIEW rag_documents AS
SELECT 
    d.id,
    d.title,
    d.content,
    d.created_at,
    c.name as course_name,
    u.email as author_email
FROM documents d
JOIN courses c ON d.course_id = c.id
JOIN users u ON d.author_id = u.id
WHERE d.status = 'published';

-- Now RAG can simply query:
SELECT * FROM rag_documents WHERE course_name = 'AI Ethics';
```

#### Success Criteria
1. RAG pipeline can read from views
2. No complex SQL needed in application code
3. Views return all needed fields

---

### **DB-06: Backups and Restore**
**⏱️ Estimated Time**: 1-2 days  
**🎓 Difficulty**: Intermediate

#### What You're Building
Automated database backup system and recovery procedures.

#### Why This Matters
- **Reality Check**: Data loss = business death
- **Requirements**: Every production system needs backups
- **Peace of Mind**: Sleep better knowing data is safe

#### Deliverables
```bash
#!/bin/bash
# backup.sh - Nightly backup script
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump lifecraft_prod > "backup_$DATE.sql"

# restore.sh - Recovery script
psql lifecraft_prod < backup_20250909_120000.sql
```

#### Success Criteria
1. Backup script runs automatically
2. Restore process documented step-by-step
3. Recovery tested in < 1 minute

---

### **DB-07: Row Level Security**
**⏱️ Estimated Time**: 2-3 days  
**🎓 Difficulty**: Advanced

#### What You're Building
Security rules that control who can see what data.

#### Why This Matters
- **Privacy**: Students shouldn't see other students' data
- **Security**: Critical for any multi-tenant application
- **Compliance**: Required for FERPA/GDPR compliance

#### Key Concepts
```sql
-- Row Level Security (RLS) = Database-level privacy
-- Rules are enforced automatically

-- Enable RLS on table
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Create policy for students
CREATE POLICY student_interactions ON interactions
    FOR ALL TO student_role
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- Now students automatically only see their own data!
```

#### Success Criteria
1. Student role can only read their own interactions
2. Educator role can read all interactions in their courses
3. Security cannot be bypassed

---

## 🤖 RAG Workstream (Trivikram - Lead)

> **Goal**: Build an intelligent document search and retrieval system

### 📚 What You'll Learn
- Document processing and parsing
- Natural Language Processing (NLP)
- Vector databases and embeddings
- API development
- Performance optimization

---

### **RAG-01: Document Ingestion v0**
**⏱️ Estimated Time**: 2-3 days  
**🎓 Difficulty**: Intermediate

#### What You're Building
A system that reads documents and prepares them for AI processing.

#### Why This Matters
- **Problem**: AI can't read PDFs/Word docs directly
- **Solution**: Extract and structure text for processing
- **Real-world**: First step in any document AI system

#### Key Concepts
```python
# Document ingestion pipeline:
PDF/DOCX/MD → Text extraction → Chunking → Storage

# Example:
def ingest_document(file_path):
    # 1. Extract text
    text = extract_text(file_path)
    
    # 2. Chunk into ~500 tokens
    chunks = chunk_text(text, max_tokens=500)
    
    # 3. Store with metadata
    for i, chunk in enumerate(chunks):
        save_chunk({
            'doc_id': generate_id(),
            'chunk_id': i,
            'content': chunk,
            'token_count': count_tokens(chunk)
        })
```

#### Deliverables
- Python script that processes multiple file formats
- Chunking algorithm that splits text intelligently
- Storage system (files or database)

#### Success Criteria
1. Script processes PDF, DOCX, and Markdown files
2. Text is chunked into ~500 token pieces
3. Each chunk has unique doc_id and chunk_id
4. Chunks are saved to disk or database

---

### **RAG-02: Embeddings v0**
**⏱️ Estimated Time**: 2 days  
**🎓 Difficulty**: Intermediate

#### What You're Building
Convert text chunks into mathematical vectors that AI can understand.

#### Why This Matters
- **Problem**: Computers don't understand meaning of words
- **Solution**: Embeddings = mathematical representation of meaning
- **Magic**: Similar meanings = similar vectors

#### Key Concepts
```python
# Embeddings turn text into numbers
text = "The cat sat on the mat"
embedding = [0.1, -0.3, 0.8, ..., 0.2]  # 1536 numbers

# Similar texts have similar embeddings
"dog" ≈ "puppy" ≈ "canine" (close vectors)
"dog" ≠ "computer" ≠ "pizza" (distant vectors)

# Example:
def embed_chunks(chunks):
    for chunk in chunks:
        embedding = openai.embeddings.create(
            model="text-embedding-ada-002",
            input=chunk['content']
        )
        chunk['embedding'] = embedding
        chunk['embedding_version'] = "ada-002"
        save_chunk(chunk)
```

#### Deliverables
- Function that creates embeddings for text chunks
- System that tracks which embedding model was used
- Storage that links embeddings to original chunks

#### Success Criteria
1. All chunks have embeddings
2. Embedding version is recorded
3. Embeddings are persisted (saved permanently)
4. Process is resumable (can restart if interrupted)

---

### **RAG-03: Vector Index v0**
**⏱️ Estimated Time**: 2-3 days  
**🎓 Difficulty**: Advanced

#### What You're Building
A specialized database that can quickly find similar vectors.

#### Why This Matters
- **Problem**: Need to find similar documents quickly
- **Solution**: Vector databases are optimized for similarity search
- **Performance**: Search millions of documents in milliseconds

#### Key Concepts
```python
# Vector search = Find most similar embeddings
query = "How does machine learning work?"
query_embedding = embed(query)

# Find top 5 most similar chunks
results = vector_db.search(
    vector=query_embedding,
    limit=5,
    threshold=0.7  # Minimum similarity score
)

# Results look like:
[
    {'chunk_id': 'abc123', 'score': 0.95, 'content': '...'},
    {'chunk_id': 'def456', 'score': 0.89, 'content': '...'},
    ...
]
```

#### Technology Options
- **Qdrant**: Professional vector database (recommended)
- **FAISS**: Facebook's vector library (simpler setup)

#### Deliverables
- Docker setup for Qdrant OR FAISS installation
- Scripts to build the vector index
- Search functions that return top-k results

#### Success Criteria
1. Vector database runs in Docker or locally
2. All embeddings are indexed
3. Sample search returns relevant results with scores > 0
4. Search completes in < 1 second

---

### **RAG-04: Retrieval API v0**
**⏱️ Estimated Time**: 1-2 days  
**🎓 Difficulty**: Intermediate

#### What You're Building
A web API that other parts of the system can use to search documents.

#### Why This Matters
- **Integration**: The chat system needs to search documents
- **Separation**: API separates search logic from UI logic
- **Scalability**: APIs can be cached and optimized

#### Deliverables
```python
# FastAPI endpoint
@app.post("/search")
async def search_documents(query: SearchRequest):
    # 1. Create embedding for query
    query_embedding = embed(query.text)
    
    # 2. Search vector database
    results = vector_db.search(query_embedding, limit=10)
    
    # 3. Return structured response
    return {
        'query': query.text,
        'results': [
            {
                'doc_id': r.doc_id,
                'chunk_id': r.chunk_id,
                'score': r.score,
                'content': r.content[:200] + '...'
            }
            for r in results
        ],
        'total_results': len(results),
        'search_time_ms': 42
    }
```

#### Success Criteria
1. API endpoint `/search` accepts POST requests
2. Returns JSON with doc_id, chunk_id, and scores
3. Curl test works: `curl -X POST http://localhost:8000/search -d '{"text": "machine learning"}'`
4. Response time < 500ms

---

### **RAG-05: Citations and Renderer**
**⏱️ Estimated Time**: 2 days  
**🎓 Difficulty**: Intermediate

#### What You're Building
A system that shows users where information came from (like academic citations).

#### Why This Matters
- **Trust**: Users need to verify AI responses
- **Academic**: Proper citations prevent plagiarism
- **Transparency**: Users should see the sources

#### Key Concepts
```python
# Citation = Reference to original source
citation = {
    'source': 'Introduction to Machine Learning (2023)',
    'page': 42,
    'snippet': 'Neural networks consist of interconnected nodes...',
    'url': 'https://example.com/ml-textbook.pdf',
    'confidence': 0.89
}

# Rendered citation:
# "Neural networks consist of interconnected nodes..." 
# — Introduction to Machine Learning (2023), p. 42 [Score: 89%]
```

#### Deliverables
- Citation object structure
- Renderer that formats citations nicely
- Integration with search results

#### Success Criteria
1. Each search result includes complete citation
2. Citations are human-readable and checkable
3. Page numbers and sources are accurate
4. Citations render consistently across the app

---

### **RAG-06: Mini Evaluation Harness**
**⏱️ Estimated Time**: 2-3 days  
**🎓 Difficulty**: Advanced

#### What You're Building
A system to measure how good your search results are.

#### Why This Matters
- **Quality**: Need to know if the search actually works
- **Improvement**: Measure changes to see if they help
- **Confidence**: Prove to stakeholders that the system works

#### Key Concepts
```python
# Evaluation metrics:
# Precision@K = How many of top K results are relevant?
# MRR = Mean Reciprocal Rank = How quickly do you find the right answer?

test_queries = [
    {
        'query': 'What is machine learning?',
        'expected_docs': ['ml_intro.pdf', 'ai_basics.pdf']
    },
    {
        'query': 'How do neural networks work?',
        'expected_docs': ['neural_nets.pdf', 'deep_learning.pdf']
    },
    # ... 18 more queries
]

def evaluate():
    precision_at_1 = 0
    precision_at_3 = 0
    mrr_total = 0
    
    for test in test_queries:
        results = search(test['query'])
        # Calculate metrics...
    
    return {
        'precision_at_1': precision_at_1 / len(test_queries),
        'precision_at_3': precision_at_3 / len(test_queries), 
        'mrr': mrr_total / len(test_queries)
    }
```

#### Deliverables
- 20 test queries with expected results
- Evaluation script that calculates P@1, P@3, and MRR
- Markdown report with results

#### Success Criteria
1. Test suite runs automatically
2. Generates markdown report with metrics
3. Results show reasonable performance (P@1 > 0.5)
4. Report is human-readable

---

### **RAG-07: Latency and Cost Tracking**
**⏱️ Estimated Time**: 1-2 days  
**🎓 Difficulty**: Intermediate

#### What You're Building
A monitoring system that tracks how fast and expensive your searches are.

#### Why This Matters
- **Performance**: Slow searches = bad user experience
- **Cost**: AI APIs charge per request - need to track spending
- **Operations**: Production systems need monitoring

#### Key Concepts
```python
import time
import logging

def search_with_monitoring(query):
    start_time = time.time()
    
    # Do the search
    results = vector_search(query)
    
    # Track metrics
    latency_ms = (time.time() - start_time) * 1000
    estimated_cost = calculate_cost(query)
    
    # Log metrics
    logger.info(f"Search completed: {latency_ms:.2f}ms, ${estimated_cost:.4f}")
    
    return results

# Cost calculation
def calculate_cost(query):
    # OpenAI embedding: $0.0001 per 1K tokens
    tokens = count_tokens(query)
    return (tokens / 1000) * 0.0001
```

#### Deliverables
- Logging system that tracks timing and costs
- Weekly report generator
- Performance monitoring dashboard (optional)

#### Success Criteria
1. Every search logs timing and estimated cost
2. Weekly report shows P50, P95 latencies
3. Report shows cost per 100 queries
4. Logs are structured and searchable

---

## 🚀 Getting Started

### Your First Day
1. **Choose your workstream** - Database or RAG
2. **Read the overview** - Understand the big picture
3. **Set up your environment** - Get tools installed
4. **Start with task #01** - Begin your learning journey

### Daily Workflow
1. **Morning**: Review your current task
2. **Work**: Focus on deliverables
3. **Afternoon**: Test your work
4. **Evening**: Update progress and ask questions

### When You're Stuck
1. **Try for 30 minutes** - Attempt to solve it yourself
2. **Search documentation** - Read official docs
3. **Ask your teammate** - They might have faced the same issue
4. **Post in Slack** - The team is here to help

### Success Tips
- **Read the acceptance criteria** - Know what "done" looks like
- **Test frequently** - Don't wait until the end
- **Document as you go** - Future you will thank current you
- **Ask questions** - There are no stupid questions

---

## 📚 Learning Resources

### Database Resources
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Docker for Beginners](https://docker-curriculum.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)

### RAG Resources
- [LangChain Documentation](https://python.langchain.com/)
- [OpenAI API Guide](https://platform.openai.com/docs/guides)
- [Qdrant Documentation](https://qdrant.tech/documentation/)

### General Programming
- [Git Tutorial](https://learngitbranching.js.org/)
- [API Testing with Postman](https://learning.postman.com/)
- [Python Testing with pytest](https://docs.pytest.org/)

---

## 🎯 Remember

This backlog is designed to **teach you** while **building real features**. Each task builds on the previous one, creating a complete learning experience.

**You're not just completing tasks - you're becoming a full-stack AI engineer!** 🚀

---

**Questions?** Post in the #wfed119-dev Slack channel or ask during our daily standups!