# .llm-context/ Maintenance Prompt

## Purpose
After completing a task or conversation, use this prompt to update the `.llm-context/` long-term memory files. This keeps documentation current and prevents context drift.

---

# 🔄 CONTEXT UPDATE PROTOCOL

You have just completed work on this project. Your task now is to **update the `.llm-context/` documentation** to reflect what changed.

## Step 1: Analyze What Changed

Review the conversation and identify:

### Code Changes Made:
- [ ] New files created
- [ ] Files modified  
- [ ] Files deleted
- [ ] Functions/components added
- [ ] Functions/components removed
- [ ] Functions/components modified

### Architectural Changes:
- [ ] New API endpoints
- [ ] Modified endpoints (request/response changes)
- [ ] Deprecated endpoints
- [ ] Database schema changes (tables, columns, relationships)
- [ ] New database migrations
- [ ] Authentication/authorization changes

### Feature Changes:
- [ ] New features added
- [ ] Features completed
- [ ] Features deprecated/removed
- [ ] Business rules changed
- [ ] User flows modified

### Configuration Changes:
- [ ] New dependencies added
- [ ] Dependencies removed/updated
- [ ] Environment variables added/changed
- [ ] Feature flags toggled
- [ ] Build configuration changed

---

## Step 2: Update Relevant Files

For each change identified, update the corresponding `.llm-context/` file(s).

### 📝 UPDATE MATRIX

| What Changed | Files to Update | Action |
|--------------|----------------|---------|
| New API endpoint | `api/endpoints-registry.md` | Add endpoint with signature |
| Modified endpoint | `api/endpoints-registry.md`, `types/api-contracts.md` | Update signature, types |
| Deleted endpoint | `api/endpoints-registry.md` | Remove or mark deprecated |
| New database table | `database/schema-overview.md`, `database/schema-full.sql` | Add table, relationships |
| Modified table | `database/schema-overview.md`, `database/migrations-log.md` | Update schema, log migration |
| New component | `frontend/component-registry.md` | Add component with props |
| Modified component props | `frontend/component-registry.md` | Update props interface |
| New custom hook | `frontend/hooks-registry.md` | Add hook signature and usage |
| New type/interface | `types/domain-models.md` or `types/api-contracts.md` | Add type definition |
| New service/helper | `backend/service-layer.md` or `frontend/hooks-registry.md` | Add function signature |
| New dependency | `config/dependencies.md` | Add package, version, purpose |
| New environment variable | `config/environments.md` | Document variable and usage |
| Feature completed | `QUICK_START.md` | Move from "In Progress" to "Working" |
| Architecture decision | `decisions/architecture-decisions.md` | Add ADR entry |
| Bug fix with workaround | `decisions/technical-debt.md` | Document if temporary |
| New workflow/process | `workflows/common-tasks.md` | Document steps |

---

## Step 3: Specific Update Instructions

### A. Update `QUICK_START.md`

```markdown
## What to Update:

**Current Focus**: 
- OLD: [previous task]
- NEW: [next task or "Ready for new work"]

**Recently Changed Files**:
Add to list:
- [file path] - [what changed]

**Working ✅**:
Move completed features from "In Progress 🚧"

**In Progress 🚧**:
- Remove completed items
- Add new items if started

**Active Constraints**:
- Add new constraints discovered
- Remove resolved constraints

**Known Issues**:
- Add new bugs discovered
- Remove fixed bugs
```

**Template**:
```markdown
Recently changed: [file] - [brief description of change]
Last updated: [current date]
```

---

### B. Update `api/endpoints-registry.md`

#### For New Endpoints:
```markdown
Add under appropriate section:

[METHOD] /api/[path]
Request: [type name or inline type]
Response: [type name or inline type]
Auth: Required/Optional/None
Description: [One sentence]

Example:
POST /api/posts/:id/publish
Request: { publishedAt?: Date }
Response: PostResponse
Auth: Required (author or admin)
Description: Publishes a draft post
```

#### For Modified Endpoints:
```markdown
Update the existing entry:
- Change request/response types
- Update description if behavior changed
- Add deprecation note if applicable

Example:
~~POST /api/posts~~ **DEPRECATED** - Use POST /api/posts/create instead
```

#### For Deprecated Endpoints:
```markdown
Strike through and add deprecation notice:

~~GET /api/users/profile~~
**DEPRECATED v2.1.0** - Use GET /api/users/:id instead
Will be removed in v3.0.0
```

---

### C. Update `database/schema-overview.md`

#### For New Tables:
```markdown
Add under appropriate section:

### [TableName]
Purpose: [What this table stores]
Key columns: [primary columns]
Relationships:
- [relationship description]

Example:
### post_likes
Purpose: Tracks user likes on posts
Key columns: userId, postId, createdAt
Relationships:
- users (n) → (1) post_likes
- posts (n) → (1) post_likes
Indexes: Composite unique on (userId, postId)
```

#### For Modified Tables:
```markdown
Update existing entry:
- Add new columns to "Key columns" list
- Update relationships if foreign keys changed
- Note any index changes

Add to bottom of file:
**Recent Changes**:
- [Date]: Added 'publishedAt' column to posts table
```

#### For New Relationships:
```markdown
Update the relationships diagram/section:

OLD:
users (1) → (n) posts

NEW:
users (1) → (n) posts (1) → (n) post_likes
```

---

### D. Update `database/migrations-log.md`

```markdown
Add new entry at the top:

## Migration: [YYYYMMDD_description]
Date: [date]
Status: Applied ✅ / Pending ⏳

### Changes:
- Added table: [table_name]
- Modified table: [table_name] - added column [column_name]
- Dropped column: [table_name].[column_name]

### Reason:
[Why this migration was needed]

### Rollback:
[How to undo if needed, or "None - breaking change"]

### Data Impact:
[None / Existing data migrated / Requires manual data update]
```

---

### E. Update `frontend/component-registry.md`

#### For New Components:
```markdown
Add under appropriate section:

**[ComponentName]**: [One sentence description]
- Props: `{ prop1: type, prop2: type }`
- Location: `components/[path]`
- Usage: [When to use this]

Example:
**PublishButton**: Button to publish draft posts
- Props: `{ postId: string, onPublish: () => void, disabled?: boolean }`
- Location: `components/posts/PublishButton.tsx`
- Usage: Use on post edit/preview pages for draft posts
```

#### For Modified Components:
```markdown
Update props interface:

OLD:
**Button**: `{ label: string, onClick: () => void }`

NEW:
**Button**: `{ label: string, onClick: () => void, variant?: 'primary' | 'secondary', loading?: boolean }`

Added: variant, loading props for better UX
```

#### For Deprecated Components:
```markdown
~~**OldButton**~~ **DEPRECATED** - Use **Button** component instead
Removed in: v2.0.0
Migration: Replace `<OldButton>` with `<Button variant="primary">`
```

---

### F. Update `types/domain-models.md`

#### For New Types:
```typescript
Add under appropriate section:

## [TypeName]
Purpose: [What this represents]

interface [TypeName] {
  [field]: [type]; // [comment if needed]
}

Example:
## PostLike
Purpose: Represents a user's like on a post

interface PostLike {
  id: string;
  userId: string;
  postId: string;
  createdAt: Date;
}
```

#### For Modified Types:
```typescript
Update the interface and add changelog:

interface User {
  // ... existing fields
  emailVerified: boolean; // ADDED: v2.1.0 - tracks email verification status
  phoneNumber?: string; // DEPRECATED: v2.1.0 - will be removed in v3.0.0
}
```

---

### G. Update `types/api-contracts.md`

```typescript
For each endpoint with changed request/response:

## POST /api/posts/publish

Request:
interface PublishPostRequest {
  publishedAt?: Date; // Optional: defaults to now
}

Response:
interface PublishPostResponse {
  post: Post;
  publishedAt: Date;
}

Error Responses:
- 404: Post not found
- 403: Not authorized (must be author or admin)
- 400: Post already published
```

---

### H. Update `frontend/hooks-registry.md`

```typescript
## For New Hooks:

**usePostLikes**: Manages post like state
Signature: `(postId: string) => { likes: number, isLiked: boolean, toggleLike: () => void }`
Dependencies: React Query, API client
Usage: Use on any component displaying post likes

## For Modified Hooks:

**useAuth**: 
~~OLD: `() => { user: User | null, login: (email, password) => void }`~~
NEW: `() => { user: User | null, login: (email, password) => Promise<void>, logout: () => void, isLoading: boolean }`
CHANGED v2.1.0: Added logout function and loading state
```

---

### I. Update `config/dependencies.md`

```markdown
## For New Dependencies:

### [package-name] (v[version])
Purpose: [What it's used for]
Why chosen: [Why this over alternatives]
Used in: [Which parts of the codebase]
Docs: [link]

Example:
### react-query (v4.29.0)
Purpose: Server state management and data fetching
Why chosen: Better caching, automatic refetching, built-in loading states
Used in: All data-fetching hooks (hooks/api/*)
Docs: https://tanstack.com/query

## For Updated Dependencies:

Update version number and note breaking changes if any:

### prisma (~~v4.0.0~~ v5.1.0)
**UPDATED**: v4.0.0 → v5.1.0
Breaking changes: None affecting our usage
Migration notes: Regenerate Prisma Client after update
```

---

### J. Update `decisions/architecture-decisions.md`

```markdown
For significant decisions made during this session:

## ADR-[NUMBER]: [Title]
Date: [date]
Status: Accepted / Proposed / Deprecated

### Context
[What problem are we solving?]

### Decision
[What did we decide to do?]

### Consequences
**Positive**:
- [benefit]

**Negative**:
- [tradeoff]

**Neutral**:
- [consideration]

### Alternatives Considered
- [alternative 1]: [why not chosen]
- [alternative 2]: [why not chosen]

Example:
## ADR-007: Use Server Actions for Form Submissions
Date: 2024-01-15
Status: Accepted

### Context
Need to handle form submissions in Next.js 14 app. Could use API routes or Server Actions.

### Decision
Use Server Actions for all form submissions.

### Consequences
**Positive**:
- Type-safe without manual endpoint definitions
- Better integration with React 19 features
- Less boilerplate

**Negative**:
- Newer pattern, less Stack Overflow help
- Team needs to learn the pattern

### Alternatives Considered
- API Routes: More familiar but more boilerplate
- Client-side fetch: Loses SSR benefits
```

---

### K. Update `decisions/technical-debt.md`

```markdown
## For New Technical Debt:

### [Brief Title]
Date Added: [date]
Severity: Low / Medium / High
Location: [file/component]

**Issue**:
[What's the problem or shortcut taken?]

**Why Deferred**:
[Why didn't we fix it properly now?]

**Proper Solution**:
[How should this be fixed eventually?]

**Impact**:
[What are the consequences of not fixing?]

**Effort to Fix**: [estimate]

Example:
### Post Publishing Uses Polling Instead of WebSockets
Date Added: 2024-01-15
Severity: Medium
Location: components/PostPublisher.tsx

**Issue**:
Currently polls /api/posts/:id/status every 2 seconds to check publish status instead of using real-time updates.

**Why Deferred**:
WebSocket infrastructure not yet in place. Publishing is rare enough that polling is acceptable for MVP.

**Proper Solution**:
Implement WebSocket connection for real-time status updates across all async operations.

**Impact**:
- Slightly delayed UI updates (max 2 second delay)
- Unnecessary API calls
- Poor UX if used frequently

**Effort to Fix**: 2-3 days (need to set up WebSocket infrastructure)

## For Resolved Technical Debt:

Move to "Resolved" section:

~~### [Title]~~
**RESOLVED**: [date]
Solution: [what was done]
```

---

### L. Update `workflows/common-tasks.md`

```markdown
If a new pattern or process was established:

## [Task Name]

### When to Use
[Situation where this applies]

### Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Example
[Concrete example]

### Common Issues
- [Issue]: [Solution]

Example:
## Publishing a Draft Post

### When to Use
After a draft post is reviewed and ready for public viewing.

### Steps
1. Navigate to post in admin panel
2. Click "Publish" button
3. (Optional) Set publish date or leave blank for immediate
4. Confirm in modal
5. System sends to publishing queue
6. Poll status or wait for notification

### Example
```typescript
const { publishPost } = usePostActions();
await publishPost(postId, { publishedAt: new Date() });
```

### Common Issues
- "Already published" error: Check post.status first
- Publish button disabled: User might not have permission
```

---

## Step 4: Cleanup Tasks

### Remove Deprecated Items (after grace period)

If an item has been marked deprecated for >2 versions or >3 months:

```markdown
1. Search all .llm-context/ files for "DEPRECATED"
2. For each item deprecated in v[old_version]:
   - If current version is >[old_version + 2]: Remove entirely
   - Otherwise: Keep with deprecation notice

Example:
Current version: v3.0.0
~~GET /api/old-endpoint~~ DEPRECATED v1.5.0
→ REMOVE (deprecated 2+ versions ago)

~~POST /api/recent~~ DEPRECATED v2.8.0  
→ KEEP (deprecated only 1 version ago)
```

### Consolidate Redundant Information

```markdown
If the same information appears in multiple files:

1. Choose the "source of truth" file
2. Update that file with complete info
3. Other files: Replace with reference

Example:
In api/endpoints-registry.md:
POST /api/users
→ Full signature here

In types/api-contracts.md:
CreateUserRequest type
→ "See api/endpoints-registry.md for endpoint usage"
```

### Archive Old Information

```markdown
If context files are getting too large:

1. Create archive files:
   - decisions/archive/[year]/
   - database/migrations-archive/[year]/

2. Move old entries:
   - ADRs older than 1 year → archive
   - Migrations older than 6 months → archive
   - Keep summary/index in main file

Example in decisions/architecture-decisions.md:

## Recent Decisions (2024)
[Current ADRs]

## Archived Decisions
See: decisions/archive/2023/decisions.md
```

---

## Step 5: Verify Consistency

### Cross-Reference Check

```markdown
Ensure consistency across related files:

1. **API + Types**: Endpoint in registry matches types in api-contracts.md
2. **Database + Types**: Schema matches domain-models.md types
3. **Components + Types**: Component props match interface definitions
4. **Dependencies + Code**: All imported packages listed in dependencies.md

Example check:
✅ api/endpoints-registry.md shows: POST /api/posts → CreatePostRequest
✅ types/api-contracts.md defines: interface CreatePostRequest
✅ Match!

❌ Component uses usePostLikes hook
❌ hooks-registry.md doesn't list usePostLikes
→ ADD to hooks-registry.md
```

### Broken Reference Check

```markdown
Look for references to files/functions that no longer exist:

Search for:
- "See: [file]" links
- "Defined in: [file]" references
- "@see [function]" comments

If target doesn't exist: Update or remove reference
```

---

## Step 6: Update Metadata

### Update File Timestamps

```markdown
At bottom of each modified file:

**Last Updated**: [current date]
**Last Changed By**: [task/feature name]
**Change Summary**: [brief description]

Example:
**Last Updated**: 2024-01-15
**Last Changed By**: Post publishing feature
**Change Summary**: Added publishPost endpoint, PublishButton component, post.publishedAt field
```

### Update Version References

```markdown
If version changed during this work:

1. Update QUICK_START.md: Current version
2. Update dependencies.md: Package versions
3. Update deprecation notices: Version numbers
4. Update migration log: Version introduced
```

---

## Step 7: Generate Update Summary

### Create a Changelog Entry

```markdown
In .llm-context/CHANGELOG.md (create if doesn't exist):

## [Date] - [Task/Feature Name]

### Added
- [New endpoint/component/feature]

### Changed  
- [Modified behavior]

### Deprecated
- [Old pattern being phased out]

### Removed
- [Deleted code/feature]

### Fixed
- [Bug fixes]

### Documentation
- [Doc updates made]

Example:
## 2024-01-15 - Post Publishing Feature

### Added
- POST /api/posts/:id/publish endpoint
- PublishButton component
- usePostPublish hook
- PostStatus enum type

### Changed
- Post interface now includes publishedAt field
- Posts table migration: added publishedAt column

### Documentation
- Updated api/endpoints-registry.md with publish endpoint
- Updated frontend/component-registry.md with PublishButton
- Updated database/schema-overview.md with new column
- Added ADR-007 for Server Actions decision
```

---

## Step 8: Final Validation

### Checklist

Before finishing, verify:

- [ ] QUICK_START.md reflects current state
- [ ] All new endpoints documented in api/endpoints-registry.md
- [ ] All schema changes in database/schema-overview.md
- [ ] New migrations logged in migrations-log.md
- [ ] New components in component-registry.md
- [ ] New types in appropriate types/*.md file
- [ ] New dependencies in dependencies.md
- [ ] Significant decisions in architecture-decisions.md
- [ ] Technical debt documented if applicable
- [ ] Deprecated items marked clearly
- [ ] Cross-references still valid
- [ ] Timestamps updated
- [ ] CHANGELOG.md entry created

---

## Output Format

After completing all updates, provide:

```markdown
# .llm-context/ Update Summary

## Files Modified
- [file path] - [what changed]

## Files Created
- [file path] - [purpose]

## Files Deleted
- [file path] - [reason]

## Key Changes
1. [Major change 1]
2. [Major change 2]

## Deprecated Items
- [item] - [deprecation version]

## Technical Debt Added/Resolved
- Added: [new debt item]
- Resolved: [fixed debt item]

## Action Items
- [ ] [Any follow-up needed]

## Next Session Prep
Based on these changes, for the next session you should load:
- [file 1]
- [file 2]
```

---

## 🎯 Automation Opportunities

### For projects with tooling:

```bash
# Generate schema from database
npm run db:export-schema > .llm-context/database/schema-full.sql

# Extract types from TypeScript
npm run generate-types-docs > .llm-context/types/generated.md

# List all API routes
npm run list-routes > .llm-context/api/routes-auto.md

# Git-based changelog
git log --since="1 day ago" --pretty=format:"%s" > .llm-context/recent-commits.txt
```

---

## 🚨 Critical Reminders

1. **Never delete information without archiving** - Move to archive/ folders
2. **Always mark deprecations before removing** - Give 2 version grace period
3. **Keep QUICK_START.md current** - This is the first file loaded each session
4. **Update timestamps** - Know when info was last verified
5. **Link related updates** - If you update endpoints, update types too
6. **Test references** - Make sure links to other files still work
7. **Keep it DRY** - One source of truth, other files reference it
8. **Think about next session** - What will LLM need to load?

---

## Example Full Update Session

```markdown
# Task Completed: Added Post Publishing Feature

## Step 1: Changes Identified
- ✅ New endpoint: POST /api/posts/:id/publish
- ✅ New component: PublishButton
- ✅ New hook: usePostPublish  
- ✅ Database: Added publishedAt column to posts
- ✅ Migration: 20240115_add_published_at.sql
- ✅ Modified: Post interface (added publishedAt field)

## Step 2: Files Updated

### api/endpoints-registry.md
Added:
POST /api/posts/:id/publish
Request: { publishedAt?: Date }
Response: PostResponse
Auth: Required (author or admin)

### database/schema-overview.md
Updated posts table:
- Added publishedAt: Date | null

### database/migrations-log.md
Added migration entry for 20240115_add_published_at

### frontend/component-registry.md
Added PublishButton component

### frontend/hooks-registry.md
Added usePostPublish hook

### types/domain-models.md
Updated Post interface with publishedAt field

### types/api-contracts.md
Added PublishPostRequest and PublishPostResponse

### QUICK_START.md
Moved "Post publishing" from "Planned" to "Working ✅"
Updated "Recently Changed Files" list

### decisions/architecture-decisions.md
Added ADR-007 for Server Actions decision

## Step 3: Cleanup
- No deprecated items this session
- No outdated references found

## Step 4: Validation
✅ All checklist items complete

## Step 5: Summary

Files Modified: 9
Files Created: 0
Files Deleted: 0

Key Changes:
1. Posts can now be published with timestamp
2. New UI component for publishing
3. Database schema updated

Next Session Prep:
If working on publishing further, load:
- api/endpoints-registry.md (publish endpoints)
- frontend/component-registry.md (PublishButton)
- types/api-contracts.md (publish types)
```

---

**Remember**: Maintaining `.llm-context/` is like tending a garden. Regular upkeep prevents overgrowth and keeps everything healthy and useful.