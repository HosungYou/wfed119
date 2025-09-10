# RAG-01: Ingestion v0

**Priority:** P1 (Week 1)  
**Owner:** @trivikram (RAG Lead)  
**Type:** feature  
**Estimate:** 4 hours

## Definition of Ready
- [ ] Python environment set up
- [ ] Sample PDFs and markdown files available
- [ ] Text processing libraries installed

## Acceptance Criteria
- [ ] Script reads PDF files
- [ ] Script reads markdown files  
- [ ] Text normalized and cleaned
- [ ] Chunks created (~500 tokens)
- [ ] Metadata preserved

## Implementation

### Setup Dependencies
```bash
# Install required packages
pip install PyPDF2 langchain tiktoken markdown

# Or add to requirements.txt
echo "PyPDF2==3.0.1" >> requirements.txt
echo "langchain==0.1.0" >> requirements.txt
echo "tiktoken==0.5.1" >> requirements.txt
echo "markdown==3.5.1" >> requirements.txt
```

### Core Implementation
Create `src/ingestion/document_processor.py`:

```python
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
            separators=["\\n\\n", "\\n", ".", " ", ""]
        )
    
    def ingest_pdf(self, file_path: str) -> List[Dict]:
        \"\"\"Extract and chunk PDF content\"\"\"
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
    
    def save_chunks(self, chunks: List[Dict], output_dir: str = './chunks'):
        \"\"\"Save chunks to JSON files\"\"\"
        Path(output_dir).mkdir(exist_ok=True)
        
        for chunk in chunks:
            filename = f"{output_dir}/{chunk['chunk_id']}.json"
            with open(filename, 'w') as f:
                json.dump(chunk, f, indent=2)
```

### Test Implementation
Create test script `test_ingestion.py`:
```python
# Test with sample files from resources/materials/
ingester = DocumentIngester()

# Test PDF ingestion
pdf_chunks = ingester.ingest_pdf('resources/materials/split_LifeCraft_4parts/LifeCraft_part01a_p1-50.pdf')
print(f"Generated {len(pdf_chunks)} PDF chunks")

# Save chunks
ingester.save_chunks(pdf_chunks, 'output/chunks')
print("Chunks saved to output/chunks/")
```

## Test Data Setup
Use existing files in `resources/materials/`:
- `split_LifeCraft_4parts/LifeCraft_part01a_p1-50.pdf`
- `split_LifeCraft_4parts/LifeCraft_part01b_p51-100.pdf`
- Create a sample markdown file from syllabus

## Validation Checklist
- [ ] Processes at least 2 PDF files
- [ ] Generates 20+ chunks total
- [ ] Each chunk has required metadata fields
- [ ] Chunks saved as individual JSON files
- [ ] No errors during processing

## Definition of Done
- [ ] Ingestion script working
- [ ] 10+ chunks generated from test files
- [ ] Chunks saved to output directory
- [ ] Unit tests added
- [ ] Documentation updated
- [ ] Code reviewed by @jonathan

## Deliverables
1. `src/ingestion/document_processor.py` - Main ingestion class
2. `test_ingestion.py` - Test script
3. `requirements.txt` - Updated dependencies
4. `output/chunks/` - Sample chunk outputs
5. README section documenting usage

## Links
- **PR:** [Link when created]
- **Demo:** [Screenshot of generated chunks]  
- **Docs:** [Ingestion documentation]