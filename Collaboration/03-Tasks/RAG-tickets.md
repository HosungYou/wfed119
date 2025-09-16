# RAG Workstream Starter Tickets

## RAG-01: Ingestion v0

**Priority:** P1 (Week 1)  
**Owner:** @trivikram  
**Type:** feature  
**Estimate:** 4 hours

### Definition of Ready
- [ ] Python environment set up
- [ ] Sample PDFs and markdown files available
- [ ] Text processing libraries installed

### Acceptance Criteria
- [ ] Script reads PDF files
- [ ] Script reads markdown files  
- [ ] Text normalized and cleaned
- [ ] Chunks created (~500 tokens)
- [ ] Metadata preserved

### Implementation
```python
# ingestion.py
import os
import json
from pathlib import Path
from typing import List, Dict
import PyPDF2
import markdown
from langchain.text_splitter import RecursiveCharacterTextSplitter

class DocumentIngester:
    def __init__(self, chunk_size=500, chunk_overlap=50):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ".", " ", ""]
        )
    
    def ingest_pdf(self, file_path: str) -> List[Dict]:
        """Extract and chunk PDF content"""
        chunks = []
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            for page_num, page in enumerate(pdf_reader.pages):
                text = page.extract_text()
                page_chunks = self.text_splitter.split_text(text)
                
                for i, chunk in enumerate(page_chunks):
                    chunks.append({
                        'document_id': Path(file_path).stem,
                        'chunk_id': f"{Path(file_path).stem}_p{page_num}_c{i}",
                        'content': chunk,
                        'metadata': {
                            'source': file_path,
                            'page': page_num,
                            'chunk_index': i,
                            'type': 'pdf'
                        }
                    })
        return chunks
    
    def ingest_markdown(self, file_path: str) -> List[Dict]:
        """Extract and chunk markdown content"""
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            
        # Convert markdown to plain text
        html = markdown.markdown(content)
        # Strip HTML tags (simple approach)
        text = html.replace('<p>', '').replace('</p>', '\n')
        
        chunks = self.text_splitter.split_text(text)
        
        return [{
            'document_id': Path(file_path).stem,
            'chunk_id': f"{Path(file_path).stem}_c{i}",
            'content': chunk,
            'metadata': {
                'source': file_path,
                'chunk_index': i,
                'type': 'markdown'
            }
        } for i, chunk in enumerate(chunks)]
    
    def save_chunks(self, chunks: List[Dict], output_dir: str = './chunks'):
        """Save chunks to JSON files"""
        Path(output_dir).mkdir(exist_ok=True)
        
        for chunk in chunks:
            filename = f"{output_dir}/{chunk['chunk_id']}.json"
            with open(filename, 'w') as f:
                json.dump(chunk, f, indent=2)
```

### Test Files Required
- `/test-data/sample.pdf` (LifeCraft excerpt)
- `/test-data/sample.md` (Course syllabus)

### Definition of Done
- [ ] Ingestion script working
- [ ] 10+ chunks generated from test files
- [ ] Chunks saved to disk/database
- [ ] Unit tests passing

---

## RAG-02: Embeddings v0

**Priority:** P1 (Week 1)  
**Owner:** @trivikram  
**Type:** feature  
**Estimate:** 3 hours

### Definition of Ready
- [ ] RAG-01 completed
- [ ] OpenAI API key available
- [ ] Chunks available for embedding

### Acceptance Criteria
- [ ] Embeddings generated for all chunks
- [ ] Model version recorded
- [ ] Embeddings persisted with chunk_id
- [ ] Batch processing implemented

### Implementation
```python
# embeddings.py
import os
import json
import numpy as np
from typing import List, Dict
from openai import OpenAI
import pickle

class EmbeddingGenerator:
    def __init__(self, model="text-embedding-ada-002"):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = model
        self.version = "v1.0"
        
    def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for single text"""
        response = self.client.embeddings.create(
            input=text,
            model=self.model
        )
        return response.data[0].embedding
    
    def batch_generate_embeddings(self, chunks: List[Dict]) -> List[Dict]:
        """Generate embeddings for multiple chunks"""
        embedded_chunks = []
        
        # Process in batches of 10
        batch_size = 10
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i+batch_size]
            texts = [chunk['content'] for chunk in batch]
            
            # Get embeddings for batch
            response = self.client.embeddings.create(
                input=texts,
                model=self.model
            )
            
            # Add embeddings to chunks
            for j, chunk in enumerate(batch):
                chunk['embedding'] = response.data[j].embedding
                chunk['embedding_model'] = self.model
                chunk['embedding_version'] = self.version
                embedded_chunks.append(chunk)
                
        return embedded_chunks
    
    def save_embeddings(self, embedded_chunks: List[Dict], output_file: str):
        """Save embeddings to file"""
        # Extract embeddings as numpy array for efficient storage
        embeddings_data = {
            'model': self.model,
            'version': self.version,
            'embeddings': []
        }
        
        for chunk in embedded_chunks:
            embeddings_data['embeddings'].append({
                'chunk_id': chunk['chunk_id'],
                'embedding': chunk['embedding'],
                'metadata': chunk['metadata']
            })
        
        # Save as pickle for numpy arrays
        with open(output_file, 'wb') as f:
            pickle.dump(embeddings_data, f)
            
    def load_embeddings(self, input_file: str) -> Dict:
        """Load embeddings from file"""
        with open(input_file, 'rb') as f:
            return pickle.load(f)
```

### Testing
```python
# Test embedding generation
generator = EmbeddingGenerator()

# Load chunks from RAG-01
chunks = load_chunks_from_directory('./chunks')

# Generate embeddings
embedded_chunks = generator.batch_generate_embeddings(chunks)

# Save embeddings
generator.save_embeddings(embedded_chunks, 'embeddings.pkl')

print(f"Generated {len(embedded_chunks)} embeddings")
```

### Definition of Done
- [ ] Embedding script functional
- [ ] All chunks have embeddings
- [ ] Embeddings persisted
- [ ] Cost tracking implemented

---

## RAG-03: Vector Index v0

**Priority:** P1 (Week 1)  
**Owner:** @jonathan  
**Type:** feature  
**Estimate:** 4 hours

### Definition of Ready
- [ ] RAG-02 completed
- [ ] Docker running
- [ ] Embeddings available

### Acceptance Criteria
- [ ] Vector database running (Qdrant/FAISS)
- [ ] Embeddings indexed
- [ ] Search endpoint working
- [ ] Top-k retrieval functional

### Implementation (Qdrant)
```python
# vector_index.py
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
import uuid

class VectorIndex:
    def __init__(self, host="localhost", port=6333):
        self.client = QdrantClient(host=host, port=port)
        self.collection_name = "wfed119_docs"
        
    def create_collection(self, vector_size=1536):
        """Create Qdrant collection"""
        self.client.recreate_collection(
            collection_name=self.collection_name,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE
            )
        )
        
    def index_embeddings(self, embedded_chunks):
        """Index embeddings in Qdrant"""
        points = []
        for chunk in embedded_chunks:
            point = PointStruct(
                id=str(uuid.uuid4()),
                vector=chunk['embedding'],
                payload={
                    'chunk_id': chunk['chunk_id'],
                    'content': chunk['content'],
                    'metadata': chunk['metadata']
                }
            )
            points.append(point)
        
        # Upload in batches
        batch_size = 100
        for i in range(0, len(points), batch_size):
            self.client.upsert(
                collection_name=self.collection_name,
                points=points[i:i+batch_size]
            )
            
    def search(self, query_embedding, top_k=5):
        """Search for similar documents"""
        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=top_k
        )
        
        return [{
            'chunk_id': hit.payload['chunk_id'],
            'content': hit.payload['content'],
            'score': hit.score,
            'metadata': hit.payload['metadata']
        } for hit in results]
```

### Docker Setup
```yaml
# docker-compose.yml addition
qdrant:
  image: qdrant/qdrant:latest
  container_name: wfed119-qdrant
  ports:
    - "6333:6333"
  volumes:
    - qdrant-data:/qdrant/storage

volumes:
  qdrant-data:
```

### Definition of Done
- [ ] Vector DB running
- [ ] Collection created
- [ ] Embeddings indexed
- [ ] Search returns results

---

## RAG-04: Retrieval API v0

**Priority:** P1 (Week 1)  
**Owner:** @jonathan  
**Type:** feature  
**Estimate:** 3 hours

### Definition of Ready
- [ ] RAG-03 completed
- [ ] FastAPI/Flask installed
- [ ] Vector index accessible

### Acceptance Criteria
- [ ] `/search` endpoint exists
- [ ] Returns JSON response
- [ ] Includes doc_id, chunk_id, score
- [ ] Latency < 500ms

### Implementation
```python
# api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import time

app = FastAPI(title="WFED119 RAG API")

# Initialize services
embedding_generator = EmbeddingGenerator()
vector_index = VectorIndex()

class SearchRequest(BaseModel):
    query: str
    top_k: Optional[int] = 5

class SearchResult(BaseModel):
    chunk_id: str
    document_id: str
    content: str
    score: float
    metadata: dict

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    latency_ms: int

@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Search for relevant documents"""
    start_time = time.time()
    
    try:
        # Generate query embedding
        query_embedding = embedding_generator.generate_embedding(request.query)
        
        # Search vector index
        results = vector_index.search(query_embedding, request.top_k)
        
        # Format response
        search_results = [
            SearchResult(
                chunk_id=r['chunk_id'],
                document_id=r['metadata'].get('document_id', ''),
                content=r['content'][:200] + "...",  # Truncate for response
                score=r['score'],
                metadata=r['metadata']
            )
            for r in results
        ]
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        return SearchResponse(
            query=request.query,
            results=search_results,
            latency_ms=latency_ms
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Testing
```bash
# Start API
uvicorn api:app --reload

# Test search
curl -X POST "http://localhost:8000/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "career planning", "top_k": 3}'
```

### Definition of Done
- [ ] API running locally
- [ ] Search endpoint working
- [ ] JSON response valid
- [ ] Latency acceptable

---

## RAG-05: Citations and Renderer

**Priority:** P2 (Week 1)  
**Owner:** @trivikram  
**Type:** feature  
**Estimate:** 3 hours

### Definition of Ready
- [ ] RAG-04 completed
- [ ] Citation format agreed
- [ ] Source documents available

### Acceptance Criteria
- [ ] Citations include source, page, snippet
- [ ] Human-readable format
- [ ] Machine-parseable structure
- [ ] Consistent rendering

### Implementation
```python
# citations.py
from typing import Dict, List
import re

class CitationRenderer:
    def __init__(self):
        self.citation_style = "inline"  # or "footnote"
        
    def create_citation(self, result: Dict) -> Dict:
        """Create citation object from search result"""
        metadata = result.get('metadata', {})
        
        citation = {
            'source': metadata.get('source', 'Unknown'),
            'page': metadata.get('page', None),
            'chunk_index': metadata.get('chunk_index', 0),
            'snippet': self._extract_snippet(result['content']),
            'score': result.get('score', 0.0)
        }
        
        return citation
    
    def _extract_snippet(self, content: str, max_length: int = 100) -> str:
        """Extract meaningful snippet from content"""
        # Clean up content
        content = re.sub(r'\s+', ' ', content).strip()
        
        # Take first sentence or max_length characters
        sentences = content.split('.')
        if sentences[0] and len(sentences[0]) < max_length:
            return sentences[0] + '.'
        else:
            return content[:max_length] + '...'
    
    def render_inline(self, citation: Dict) -> str:
        """Render as inline citation"""
        source = citation['source'].split('/')[-1]  # Get filename
        
        if citation['page'] is not None:
            return f"[{source}, p.{citation['page']}]"
        else:
            return f"[{source}]"
    
    def render_full(self, citation: Dict) -> str:
        """Render full citation with snippet"""
        inline = self.render_inline(citation)
        snippet = citation['snippet']
        score = citation['score']
        
        return f"{inline} \"{snippet}\" (relevance: {score:.2f})"
    
    def render_bibliography(self, citations: List[Dict]) -> str:
        """Render bibliography section"""
        unique_sources = {}
        
        for cite in citations:
            source = cite['source']
            if source not in unique_sources:
                unique_sources[source] = []
            unique_sources[source].append(cite)
        
        bibliography = "## References\n\n"
        for i, (source, cites) in enumerate(unique_sources.items(), 1):
            pages = set(c['page'] for c in cites if c['page'] is not None)
            page_str = f", pages {', '.join(map(str, sorted(pages)))}" if pages else ""
            bibliography += f"{i}. {source.split('/')[-1]}{page_str}\n"
        
        return bibliography
```

### Enhanced API Response
```python
# Update SearchResponse to include citations
class CitedSearchResponse(BaseModel):
    query: str
    results: List[SearchResult]
    citations: List[str]  # Rendered citations
    bibliography: str
    latency_ms: int

@app.post("/search-with-citations", response_model=CitedSearchResponse)
async def search_with_citations(request: SearchRequest):
    # ... existing search logic ...
    
    # Add citation rendering
    renderer = CitationRenderer()
    citations = []
    citation_objects = []
    
    for result in results:
        citation = renderer.create_citation(result)
        citation_objects.append(citation)
        citations.append(renderer.render_full(citation))
    
    bibliography = renderer.render_bibliography(citation_objects)
    
    return CitedSearchResponse(
        query=request.query,
        results=search_results,
        citations=citations,
        bibliography=bibliography,
        latency_ms=latency_ms
    )
```

### Definition of Done
- [ ] Citation objects created
- [ ] Renderer implemented
- [ ] API returns citations
- [ ] Format validated

---

## RAG-06: Mini Evaluation Harness

**Priority:** P1 (Week 2)  
**Owner:** @trivikram  
**Type:** quality  
**Estimate:** 4 hours

### Definition of Ready
- [ ] RAG-05 completed
- [ ] Test queries prepared
- [ ] Ground truth available

### Acceptance Criteria
- [ ] 20+ test queries
- [ ] Expected sources defined
- [ ] Precision@k calculated
- [ ] MRR calculated
- [ ] Report generated

### Implementation
```python
# evaluation.py
import json
from typing import List, Dict, Set
import numpy as np

class RAGEvaluator:
    def __init__(self, api_client):
        self.api_client = api_client
        self.test_queries = []
        self.ground_truth = {}
        
    def load_test_set(self, file_path: str):
        """Load test queries and ground truth"""
        with open(file_path, 'r') as f:
            data = json.load(f)
            
        self.test_queries = data['queries']
        self.ground_truth = data['ground_truth']
    
    def precision_at_k(self, retrieved: List[str], relevant: Set[str], k: int) -> float:
        """Calculate precision@k"""
        if not retrieved or k == 0:
            return 0.0
            
        retrieved_k = retrieved[:k]
        relevant_in_k = sum(1 for doc in retrieved_k if doc in relevant)
        
        return relevant_in_k / k
    
    def mean_reciprocal_rank(self, retrieved: List[str], relevant: Set[str]) -> float:
        """Calculate reciprocal rank"""
        for i, doc in enumerate(retrieved, 1):
            if doc in relevant:
                return 1.0 / i
        return 0.0
    
    def evaluate(self) -> Dict:
        """Run full evaluation"""
        results = {
            'precision_at_1': [],
            'precision_at_3': [],
            'precision_at_5': [],
            'mrr': [],
            'query_details': []
        }
        
        for query_data in self.test_queries:
            query = query_data['query']
            expected_docs = set(self.ground_truth.get(query_data['id'], []))
            
            # Get search results
            response = self.api_client.search(query, top_k=10)
            retrieved = [r['metadata']['document_id'] for r in response['results']]
            
            # Calculate metrics
            p_at_1 = self.precision_at_k(retrieved, expected_docs, 1)
            p_at_3 = self.precision_at_k(retrieved, expected_docs, 3)
            p_at_5 = self.precision_at_k(retrieved, expected_docs, 5)
            mrr = self.mean_reciprocal_rank(retrieved, expected_docs)
            
            results['precision_at_1'].append(p_at_1)
            results['precision_at_3'].append(p_at_3)
            results['precision_at_5'].append(p_at_5)
            results['mrr'].append(mrr)
            
            results['query_details'].append({
                'query': query,
                'expected': list(expected_docs),
                'retrieved': retrieved[:5],
                'p@1': p_at_1,
                'p@3': p_at_3,
                'mrr': mrr
            })
        
        # Calculate averages
        results['avg_precision_at_1'] = np.mean(results['precision_at_1'])
        results['avg_precision_at_3'] = np.mean(results['precision_at_3'])
        results['avg_precision_at_5'] = np.mean(results['precision_at_5'])
        results['avg_mrr'] = np.mean(results['mrr'])
        
        return results
    
    def generate_report(self, results: Dict, output_file: str):
        """Generate markdown report"""
        report = "# RAG Evaluation Report\n\n"
        report += "## Summary Metrics\n\n"
        report += f"- **Precision@1**: {results['avg_precision_at_1']:.3f}\n"
        report += f"- **Precision@3**: {results['avg_precision_at_3']:.3f}\n"
        report += f"- **Precision@5**: {results['avg_precision_at_5']:.3f}\n"
        report += f"- **Mean Reciprocal Rank**: {results['avg_mrr']:.3f}\n\n"
        
        report += "## Query Details\n\n"
        for detail in results['query_details'][:10]:  # Show first 10
            report += f"### Query: \"{detail['query']}\"\n"
            report += f"- P@1: {detail['p@1']:.2f}, P@3: {detail['p@3']:.2f}, MRR: {detail['mrr']:.2f}\n"
            report += f"- Expected: {detail['expected']}\n"
            report += f"- Retrieved: {detail['retrieved']}\n\n"
        
        with open(output_file, 'w') as f:
            f.write(report)
```

### Test Set Format
```json
{
  "queries": [
    {"id": "q1", "query": "What is career planning?"},
    {"id": "q2", "query": "Describe strength discovery process"},
    {"id": "q3", "query": "How to set SMART goals?"}
  ],
  "ground_truth": {
    "q1": ["lifecraft_part01a", "syllabus"],
    "q2": ["lifecraft_part01b", "strength_guide"],
    "q3": ["lifecraft_part02a", "goal_worksheet"]
  }
}
```

### Definition of Done
- [ ] Test set created
- [ ] Evaluation script runs
- [ ] Metrics calculated
- [ ] Report in `/docs/eval/`

---

## RAG-07: Latency and Cost Counters

**Priority:** P2 (Week 2)  
**Owner:** @jonathan  
**Type:** quality  
**Estimate:** 2 hours

### Definition of Ready
- [ ] RAG-06 completed
- [ ] API logging configured
- [ ] Cost model defined

### Acceptance Criteria
- [ ] Timing for each component
- [ ] Cost per query estimated
- [ ] P50/P95 calculated
- [ ] Weekly report generated

### Implementation
```python
# monitoring.py
import time
import statistics
from collections import defaultdict
from datetime import datetime, timedelta

class RAGMonitor:
    def __init__(self):
        self.metrics = defaultdict(list)
        self.costs = {
            'embedding': 0.0001,  # per 1k tokens
            'storage': 0.01,      # per GB/month
            'search': 0.001       # per query
        }
        
    def record_latency(self, operation: str, latency_ms: float):
        """Record operation latency"""
        self.metrics[f'{operation}_latency'].append(latency_ms)
        
    def record_tokens(self, operation: str, token_count: int):
        """Record token usage"""
        self.metrics[f'{operation}_tokens'].append(token_count)
        
    def calculate_percentiles(self, values: List[float]) -> Dict:
        """Calculate P50, P95, P99"""
        if not values:
            return {'p50': 0, 'p95': 0, 'p99': 0}
            
        sorted_values = sorted(values)
        n = len(sorted_values)
        
        return {
            'p50': sorted_values[int(n * 0.5)],
            'p95': sorted_values[int(n * 0.95)],
            'p99': sorted_values[int(n * 0.99)] if n > 100 else sorted_values[-1]
        }
    
    def estimate_cost(self) -> Dict:
        """Estimate costs based on usage"""
        total_embeddings = sum(self.metrics['embedding_tokens'])
        total_queries = len(self.metrics['search_latency'])
        
        embedding_cost = (total_embeddings / 1000) * self.costs['embedding']
        search_cost = total_queries * self.costs['search']
        
        return {
            'embedding_cost': embedding_cost,
            'search_cost': search_cost,
            'total_cost': embedding_cost + search_cost,
            'cost_per_100_queries': (embedding_cost + search_cost) / max(total_queries, 1) * 100
        }
    
    def generate_weekly_report(self) -> str:
        """Generate weekly metrics report"""
        report = f"# RAG Performance Report - Week of {datetime.now().strftime('%Y-%m-%d')}\n\n"
        
        # Latency metrics
        report += "## Latency Metrics (ms)\n\n"
        for operation in ['embedding', 'search', 'total']:
            key = f'{operation}_latency'
            if key in self.metrics:
                percentiles = self.calculate_percentiles(self.metrics[key])
                avg = statistics.mean(self.metrics[key])
                report += f"### {operation.capitalize()}\n"
                report += f"- Average: {avg:.2f}ms\n"
                report += f"- P50: {percentiles['p50']:.2f}ms\n"
                report += f"- P95: {percentiles['p95']:.2f}ms\n\n"
        
        # Cost metrics
        report += "## Cost Analysis\n\n"
        costs = self.estimate_cost()
        report += f"- Embedding costs: ${costs['embedding_cost']:.4f}\n"
        report += f"- Search costs: ${costs['search_cost']:.4f}\n"
        report += f"- Total costs: ${costs['total_cost']:.4f}\n"
        report += f"- Cost per 100 queries: ${costs['cost_per_100_queries']:.4f}\n\n"
        
        # Usage statistics
        report += "## Usage Statistics\n\n"
        report += f"- Total queries: {len(self.metrics['search_latency'])}\n"
        report += f"- Total tokens processed: {sum(self.metrics.get('embedding_tokens', []))}\n"
        
        return report

# Integration with API
monitor = RAGMonitor()

@app.middleware("http")
async def add_monitoring(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    latency = (time.time() - start_time) * 1000
    
    if request.url.path == "/search":
        monitor.record_latency("search", latency)
    
    return response
```

### Weekly Report Example
```markdown
# RAG Performance Report - Week of 2025-01-27

## Latency Metrics (ms)

### Search
- Average: 245.32ms
- P50: 230.00ms
- P95: 380.00ms

## Cost Analysis
- Embedding costs: $0.0234
- Search costs: $0.1200
- Total costs: $0.1434
- Cost per 100 queries: $0.1195

## Usage Statistics
- Total queries: 120
- Total tokens processed: 234,000
```

### Definition of Done
- [ ] Monitoring integrated
- [ ] Metrics collected
- [ ] Report generated
- [ ] Cost tracking verified