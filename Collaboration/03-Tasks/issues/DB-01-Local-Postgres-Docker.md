# DB-01: Local Postgres in Docker

**Priority:** P1 (Week 1)  
**Owner:** @jonathan (Database Lead)  
**Type:** setup  
**Estimate:** 3 hours

## Definition of Ready
- [ ] Docker Desktop installed
- [ ] Access to project repository
- [ ] `.env.example` available

## Acceptance Criteria
- [ ] PostgreSQL 15+ running in Docker
- [ ] Named volume for data persistence
- [ ] Healthcheck configured
- [ ] `init.sql` creates initial database
- [ ] Local connection verified with psql

## Implementation Steps

1. **Use the provided docker-compose.yml** (already created):
   ```bash
   cd wfed119
   cp .env.example .env.local
   # Edit .env.local with your database credentials
   ```

2. **Start the database services**:
   ```bash
   docker-compose up -d postgres
   ```

3. **Verify connection**:
   ```bash
   # Test connection
   psql -h localhost -U admin -d wfed119
   
   # Should see PostgreSQL prompt
   wfed119=# \l  # List databases
   wfed119=# \dt # List tables
   wfed119=# \q  # Quit
   ```

4. **Document setup in README**:
   - Add Docker setup section
   - Include connection troubleshooting
   - Document environment variables

## Testing Checklist
- [ ] Container starts without errors
- [ ] Healthcheck passes (green status)
- [ ] Can connect with psql client
- [ ] Database persists after container restart
- [ ] init.sql executes successfully

## Definition of Done
- [ ] Code merged to main branch
- [ ] README updated with setup instructions  
- [ ] Screenshot of successful connection
- [ ] Peer review completed by @trivikram

## Troubleshooting

**Common Issues:**
- Port 5432 already in use: `lsof -i :5432` and stop conflicting service
- Permission denied: Check Docker Desktop is running
- Connection refused: Wait for healthcheck to pass

## Links
- **PR:** [Link when created]
- **Demo:** [Screenshot of psql connection]
- **Docs:** [Updated README section]