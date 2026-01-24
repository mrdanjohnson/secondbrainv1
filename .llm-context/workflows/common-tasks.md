# Common Tasks - Second Brain Development

## Quick Reference

This guide covers common development tasks and workflows.

---

## Adding a New Feature

### 1. Database Changes

If your feature requires new tables or columns:

```bash
# 1. Create migration file
cd backend/src/db/migrations
touch 003_add_feature_name.js

# 2. Write migration
export const up = async (db) => {
  await db.query(`
    CREATE TABLE new_table (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
};

export const down = async (db) => {
  await db.query(`DROP TABLE IF EXISTS new_table;`);
};

# 3. Test migration
npm run db:migrate:dry   # Preview
npm run db:migrate       # Apply
npm run db:status        # Verify

# 4. Test rollback
npm run db:migrate:undo
npm run db:migrate       # Re-apply
```

---

### 2. Backend API Endpoint

```bash
# 1. Create controller
cd backend/src/controllers
touch newFeature.js
```

```javascript
// controllers/newFeature.js
export const newFeatureController = {
  async create(req, res) {
    try {
      const { data } = req.body;
      const userId = req.user.id;
      
      // Business logic here
      const result = await db.query(
        'INSERT INTO new_table (user_id, data) VALUES ($1, $2) RETURNING *',
        [userId, data]
      );
      
      res.status(201).json({ data: result.rows[0] });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
  
  async getAll(req, res) {
    // Implementation
  }
};
```

```bash
# 2. Create route
cd backend/src/routes
touch newFeature.js
```

```javascript
// routes/newFeature.js
import { Router } from 'express';
import { newFeatureController } from '../controllers/newFeature.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/', authMiddleware, newFeatureController.create);
router.get('/', authMiddleware, newFeatureController.getAll);

export default router;
```

```bash
# 3. Register route in index.js
```

```javascript
// backend/src/index.js
import newFeatureRoutes from './routes/newFeature.js';

app.use('/api/new-feature', newFeatureRoutes);
```

```bash
# 4. Test endpoint
curl -X POST http://localhost:3001/api/new-feature \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"data": "test"}'
```

---

### 3. Frontend Page/Component

```bash
# 1. Create page component
cd frontend/src/pages
touch NewFeature.jsx
```

```jsx
// pages/NewFeature.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';

export default function NewFeature() {
  const { data, isLoading } = useQuery({
    queryKey: ['new-feature'],
    queryFn: async () => {
      const res = await api.get('/new-feature');
      return res.data;
    }
  });
  
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/new-feature', data)
  });
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>New Feature</h1>
      {/* Component JSX */}
    </div>
  );
}
```

```bash
# 2. Add route
```

```javascript
// main.jsx
import NewFeature from './pages/NewFeature';

{
  path: 'new-feature',
  element: <NewFeature />
}
```

```bash
# 3. Add navigation link
```

```jsx
// components/Layout.jsx
<Link to="/new-feature">New Feature</Link>
```

---

## Fixing a Bug

### 1. Reproduce the Issue

```bash
# 1. Check error logs
docker-compose logs backend | grep ERROR

# 2. Test the failing request
curl -X POST http://localhost:3001/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# 3. Check database state
docker-compose exec db psql -U secondbrain -d secondbrain
SELECT * FROM table WHERE condition;
```

---

### 2. Fix the Code

```javascript
// Before (buggy)
const result = await db.query('SELECT * FROM memories WHERE id = $1', id);

// After (fixed - id should be in array)
const result = await db.query('SELECT * FROM memories WHERE id = $1', [id]);
```

---

### 3. Test the Fix

```bash
# Test manually
curl -X GET http://localhost:3001/api/memories/uuid-here

# Or write automated test (future)
npm test
```

---

## Database Maintenance

### Check Connection Pool

```javascript
// backend/src/db/index.js
pool.on('connect', () => {
  console.log('New client connected to pool');
});

pool.on('remove', () => {
  console.log('Client removed from pool');
});

// Get pool stats
const stats = {
  total: pool.totalCount,
  idle: pool.idleCount,
  waiting: pool.waitingCount
};
console.log('Pool stats:', stats);
```

---

### Rebuild Vector Index

```bash
# If vector search is slow
docker-compose exec db psql -U secondbrain -d secondbrain

REINDEX INDEX idx_memories_embedding;

# Check index size
SELECT pg_size_pretty(pg_relation_size('idx_memories_embedding'));
```

---

### Vacuum Database

```bash
# Reclaim storage
docker-compose exec db psql -U secondbrain -d secondbrain

VACUUM ANALYZE memories;

# Full vacuum (locks table)
VACUUM FULL memories;
```

---

## Adding a New LLM Provider

### 1. Update Service

```javascript
// backend/src/services/aiService.js

async function classifyWithNewProvider(content, settings) {
  const { model, temperature, maxTokens } = settings;
  
  const response = await newProviderAPI.chat({
    model,
    messages: [{ role: 'user', content }],
    temperature,
    max_tokens: maxTokens
  });
  
  return JSON.parse(response.content);
}

export async function classifyAndStructure(content, userId = null) {
  const settings = await getUserSettings(userId, 'classification');
  
  if (settings.provider === 'new-provider') {
    return await classifyWithNewProvider(content, settings);
  }
  // ... existing providers
}
```

---

### 2. Update Database Schema

```sql
-- Add new provider to CHECK constraint
ALTER TABLE user_llm_settings 
DROP CONSTRAINT IF EXISTS user_llm_settings_chat_provider_check;

ALTER TABLE user_llm_settings 
ADD CONSTRAINT user_llm_settings_chat_provider_check
CHECK (chat_provider IN ('openai', 'anthropic', 'ollama', 'new-provider'));
```

---

### 3. Update Frontend

```jsx
// components/LLMSettings.jsx

const providers = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'ollama', label: 'Ollama' },
  { value: 'new-provider', label: 'New Provider' }
];

const models = {
  'new-provider': {
    chat: ['model-1', 'model-2'],
    embedding: ['embedding-model']
  }
};
```

---

## Performance Optimization

### 1. Add Database Index

```sql
-- If queries are slow
EXPLAIN ANALYZE SELECT * FROM memories WHERE category = 'Idea';

-- Add index if needed
CREATE INDEX idx_name ON table(column);
```

---

### 2. Query Optimization

```javascript
// Bad: N+1 queries
for (const memory of memories) {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [memory.user_id]);
}

// Good: Single query with JOIN
const result = await db.query(`
  SELECT m.*, u.name, u.email 
  FROM memories m
  LEFT JOIN users u ON m.user_id = u.id
`);
```

---

### 3. Frontend Bundle Optimization

```bash
# Analyze bundle size
cd frontend
npm run build
npx vite-bundle-visualizer

# Code splitting (future)
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

---

## Debugging

### Backend Debugging

```javascript
// Add breakpoints with debugger
export async function createMemory(req, res) {
  debugger;  // Pause execution
  const { raw_content } = req.body;
  // ...
}
```

```bash
# Run with inspect flag
node --inspect src/index.js

# Connect Chrome DevTools
chrome://inspect
```

---

### Frontend Debugging

```bash
# React DevTools (browser extension)
# Install from Chrome Web Store

# TanStack Query DevTools
# Already installed, toggle with bottom-left button
```

---

## Testing (Future)

### Backend Unit Tests

```javascript
// backend/src/controllers/memories.test.js
import { describe, it, expect } from 'jest';
import { memoriesController } from './memories';

describe('Memories Controller', () => {
  it('should create memory', async () => {
    const req = {
      body: { raw_content: 'Test memory' },
      user: { id: 'user-id' }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    await memoriesController.create(req, res);
    
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });
});
```

---

### Frontend Component Tests

```javascript
// frontend/src/components/MemoryCard.test.jsx
import { render, screen } from '@testing-library/react';
import MemoryCard from './MemoryCard';

test('renders memory content', () => {
  const memory = {
    id: '1',
    rawContent: 'Test memory',
    category: 'Idea',
    tags: ['test']
  };
  
  render(<MemoryCard memory={memory} />);
  
  expect(screen.getByText('Test memory')).toBeInTheDocument();
});
```

---

## Updating Dependencies

### Check for Updates

```bash
# Backend
cd backend
npm outdated

# Frontend
cd frontend
npm outdated
```

---

### Update Packages

```bash
# Update all to latest (careful!)
npm update

# Update specific package
npm install react@latest

# Update with version
npm install react-router-dom@^6.25.0
```

---

## Git Workflow

### Feature Branch

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push branch
git push origin feature/new-feature

# Create PR on GitHub
```

---

### Commit Messages

**Format**: `type(scope): description`

```bash
feat(memories): add bulk delete functionality
fix(auth): correct token expiration handling
docs(api): update endpoints documentation
refactor(database): optimize query performance
test(chat): add unit tests for message handling
chore(deps): update dependencies
```

---

**Last Updated**: 2026-01-24  
**For deployment**: See `deployment.md`  
**For troubleshooting**: See `troubleshooting.md`
