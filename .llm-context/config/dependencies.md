# Dependencies - Second Brain

## Backend Dependencies

**File**: `backend/package.json`

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **@anthropic-ai/sdk** | ^0.39.0 | Claude AI API client |
| **axios** | ^1.7.9 | HTTP client for external APIs |
| **bcryptjs** | ^2.4.3 | Password hashing |
| **cors** | ^2.8.5 | Enable CORS |
| **dotenv** | ^16.4.5 | Environment variable loading |
| **express** | ^4.19.2 | Web framework |
| **express-rate-limit** | ^7.2.0 | Rate limiting middleware |
| **helmet** | ^7.1.0 | Security headers |
| **jsonwebtoken** | ^9.0.2 | JWT authentication |
| **morgan** | ^1.10.0 | HTTP request logging |
| **openai** | ^4.47.1 | OpenAI API client |
| **pg** | ^8.11.5 | PostgreSQL client |
| **uuid** | ^9.0.1 | UUID generation |
| **zod** | ^3.23.8 | Schema validation |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **jest** | ^29.7.0 | Testing framework |
| **nodemon** | ^3.1.0 | Auto-restart on changes |

---

## Frontend Dependencies

**File**: `frontend/package.json`

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **@tanstack/react-query** | ^5.40.0 | Server state management |
| **axios** | ^1.7.2 | HTTP client |
| **date-fns** | ^3.6.0 | Date utilities |
| **framer-motion** | ^11.2.10 | Animations |
| **lucide-react** | ^0.379.0 | Icon library |
| **react** | ^18.3.1 | UI framework |
| **react-dom** | ^18.3.1 | React DOM renderer |
| **react-markdown** | ^9.0.1 | Markdown rendering |
| **react-router-dom** | ^6.24.0 | Routing |
| **zustand** | ^4.5.2 | Global state management |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **@types/react** | ^18.3.3 | React TypeScript types |
| **@types/react-dom** | ^18.3.0 | React DOM TypeScript types |
| **@vitejs/plugin-react** | ^4.3.1 | Vite React plugin |
| **autoprefixer** | ^10.4.19 | CSS autoprefixer |
| **postcss** | ^8.4.38 | CSS processing |
| **tailwindcss** | ^3.4.4 | Utility-first CSS |
| **vite** | ^5.3.1 | Build tool |

---

## Infrastructure Dependencies

### PostgreSQL Extensions

| Extension | Version | Purpose |
|-----------|---------|---------|
| **pgvector** | 0.5.1 | Vector similarity search |

### Docker Images

| Service | Image | Version |
|---------|-------|---------|
| **Database** | postgres | 16 |
| **n8n** | n8nio/n8n | latest |
| **Ollama** | ollama/ollama | latest |

---

## Dependency Update Strategy

### Critical Security Updates
- **Frequency**: Immediate
- **Trigger**: Security advisory
- **Process**: 
  1. Review advisory
  2. Update package
  3. Test thoroughly
  4. Deploy ASAP

### Minor Updates
- **Frequency**: Monthly
- **Process**:
  1. Run `npm outdated`
  2. Update patch versions
  3. Test in development
  4. Deploy in next release

### Major Updates
- **Frequency**: Quarterly
- **Process**:
  1. Review breaking changes
  2. Update in feature branch
  3. Update code for breaking changes
  4. Comprehensive testing
  5. Deploy with migration guide

---

## Compatibility Matrix

| Frontend | Backend | PostgreSQL | Node.js |
|----------|---------|------------|---------|
| 1.0.0 | 1.0.0 | 16.x | 20.x |

---

**Last Updated**: 2026-01-24  
**Total Dependencies**: 35 (24 prod, 11 dev)  
**Package Manager**: npm
