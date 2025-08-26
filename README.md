# Admin Activity Portal

A comprehensive administrative portal for viewing and managing user activities across the Dsalta platform. This utility provides real-time insights into user behavior, security events, and system activities.

## Features

- **Activity Monitoring**: View all user activities with advanced filtering and search
- **Real-time Dashboard**: Statistics, trends, and insights with interactive charts
- **Export Capabilities**: CSV export with current filter settings
- **Security Audit**: Track login attempts, failed authentications, and access patterns
- **Multi-tenant Support**: Filter activities by organization/tenant
- **RESTful API**: Full API with OpenAPI/Swagger documentation
- **Responsive UI**: Modern React interface with dark mode support

## Architecture

### Data Flow
```
Source Tables → Normalization/Ingestion → Activity Log → API → UI
     ↓                    ↓                    ↓        ↓     ↓
   users              Polling Service    admin_audit   REST  React
  vendors           → Activity Mapper → activity_log → API → Dashboard
integrations         Background Jobs   PostgreSQL   Express Vite/Tailwind
```

### Components

1. **Database Layer** (`admin_audit` schema)
   - `activity_log` table with indexed columns
   - Views for joining with user/vendor/organization data
   - Partitioning for performance (recommended for production)

2. **Backend API** (Express + TypeScript)
   - JWT-based authentication
   - Rate limiting and security middleware
   - Comprehensive activity queries with pagination
   - CSV export functionality
   - OpenAPI documentation

3. **Frontend** (React + Vite + TypeScript)
   - Activity list with filters and search
   - Interactive dashboard with charts
   - Real-time updates and responsive design
   - Component library with Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 13+
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (Recommended)

1. **Clone and setup**:
   ```bash
   git clone <repository>
   cd admin-activity-portal
   cp env.example .env
   ```

2. **Configure environment variables** in `.env`:
   ```bash
   # Update these values
   ADMIN_EMAIL="your-admin@company.com"
   ADMIN_PASSWORD="YourSecurePassword123!"
   JWT_SECRET="your-super-secret-jwt-key"
   DATABASE_URL="postgres://user:pass@host:port/database"
   ```

3. **Start services**:
   ```bash
   docker-compose up -d
   ```

4. **Run migrations and seed data**:
   ```bash
   docker-compose exec server npm run migrate:up
   docker-compose exec server npm run seed
   ```

5. **Access the application**:
   - **Frontend**: http://localhost:3000
   - **API Docs**: http://localhost:3001/api/docs
   - **Health Check**: http://localhost:3001/health

### Option 2: Manual Setup

1. **Backend setup**:
   ```bash
   cd server
   npm install
   cp ../env.example .env
   # Update .env with your database credentials
   npm run migrate:up
   npm run seed
   npm run dev
   ```

2. **Frontend setup** (in new terminal):
   ```bash
   cd web
   npm install
   npm run dev
   ```

## Database Schema

### Core Table: `admin_audit.activity_log`

```sql
CREATE TABLE admin_audit.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,                    -- Foreign key to users table
    tenant_id TEXT,                  -- Organization/tenant identifier
    action activity_action NOT NULL, -- Enum: user.login, vendor.create, etc.
    entity_type entity_type NOT NULL,-- Enum: user, vendor, integration, etc.
    entity_id TEXT,                  -- ID of the affected entity
    metadata JSONB,                  -- Additional context and details
    ip INET,                         -- User IP address
    user_agent TEXT,                 -- User agent string
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes for Performance
- `created_at DESC` (primary sorting)
- `user_id` (user filtering)
- `tenant_id` (organization filtering)
- `action` (action filtering)
- `entity_type` (entity filtering)
- Composite index on `(tenant_id, created_at DESC, action)`

### Activity Actions Taxonomy

```typescript
enum ActivityAction {
  // User Management
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_CREATE = 'user.create',
  
  // Vendor Management
  VENDOR_CREATE = 'vendor.create',
  VENDOR_UPDATE = 'vendor.update',
  VENDOR_VIEW = 'vendor.view',
  
  // Integration Management
  INTEGRATION_CONNECT = 'integration.connect',
  INTEGRATION_TEST = 'integration.test',
  
  // Security Events
  SECURITY_LOGIN_FAILED = 'security.login_failed',
  SECURITY_ACCESS_DENIED = 'security.access_denied',
  
  // General Activities
  REPORT_EXPORT = 'report.export',
  SETTINGS_UPDATE = 'settings.update'
}
```

## API Documentation

### Authentication

All API endpoints except `/auth/login` require JWT authentication:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/activities
```

### Key Endpoints

- `POST /api/auth/login` - Admin authentication
- `GET /api/activities` - List activities with filtering
- `GET /api/activities/:id` - Get activity details
- `GET /api/activities/export/csv` - Export to CSV
- `GET /api/stats/overview` - Dashboard statistics
- `GET /api/users` - List users for filters
- `GET /api/vendors` - List vendors for filters

### Example: Get Activities

```bash
curl "http://localhost:3001/api/activities?page=1&limit=50&action=user.login&date_from=2024-01-01" \
  -H "Authorization: Bearer <token>"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "user_id": "user-123",
        "tenant_id": "org-456",
        "action": "user.login",
        "entity_type": "user",
        "entity_id": "user-123",
        "metadata": { "login_method": "password", "success": true },
        "ip": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2024-01-15T10:30:00Z",
        "user_email": "john@company.com",
        "user_name": "John Doe",
        "organization_name": "Acme Corp"
      }
    ],
    "total": 1523,
    "page": 1,
    "limit": 50,
    "total_pages": 31
  }
}
```

## Development

### Available Scripts

**Backend** (`/server`):
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run migrate:up` - Run database migrations
- `npm run migrate:down` - Rollback last migration
- `npm run seed` - Seed sample data

**Frontend** (`/web`):
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Project Structure

```
admin-activity-portal/
├── server/                 # Backend API
│   ├── src/
│   │   ├── auth/          # Authentication middleware
│   │   ├── db/            # Database client and migrations
│   │   ├── domain/        # Business logic and queries
│   │   ├── routes/        # API route handlers
│   │   ├── utils/         # Utilities (logging, etc.)
│   │   └── index.ts       # Main server file
│   ├── package.json
│   └── Dockerfile
├── web/                   # Frontend React app
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # API client and utilities
│   │   ├── types/         # TypeScript definitions
│   │   └── main.tsx       # Main React entry
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml     # Local development setup
├── env.example           # Environment variables template
└── README.md             # This file
```

### Adding New Activity Types

1. **Update enums** in both backend and frontend:
   ```typescript
   // server/src/domain/activity.ts & web/src/types/index.ts
   enum ActivityAction {
     NEW_ACTION = 'category.action',
   }
   ```

2. **Update database enum**:
   ```sql
   ALTER TYPE admin_audit.activity_action ADD VALUE 'category.action';
   ```

3. **Create ingestion logic** to capture the new activity type

## Deployment

### Production Environment

1. **Database setup**:
   - Create `admin_audit` schema
   - Run migrations: `npm run migrate:up`
   - Set up proper indexes and partitioning

2. **Environment variables**:
   ```bash
   NODE_ENV=production
   DATABASE_URL="postgres://..."
   JWT_SECRET="secure-random-key"
   ADMIN_EMAIL="admin@company.com"
   ADMIN_PASSWORD="SecurePassword"
   ```

3. **Build and deploy**:
   ```bash
   # Backend
   cd server && npm run build
   
   # Frontend
   cd web && npm run build
   ```

### Docker Production

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Performance Considerations

- **Database partitioning** by date for large datasets (>1M rows)
- **Read replicas** for heavy read workloads
- **Caching** with Redis for frequently accessed data
- **CDN** for frontend assets
- **Load balancing** for multiple backend instances

## Security

### Authentication & Authorization

- **JWT tokens** with configurable expiration
- **Admin-only access** with role-based permissions
- **Rate limiting** to prevent abuse
- **CORS protection** with configurable origins

### Data Protection

- **PII minimization**: Only store necessary user identifiers
- **IP masking**: Optional IP address anonymization
- **Secure headers** with Helmet.js
- **Input validation** with Joi schemas

### Monitoring

- **Request logging** with Winston
- **Error tracking** with structured logging
- **Health checks** for all services
- **Performance monitoring** with slow query detection

## Troubleshooting

### Common Issues

1. **Database connection failed**:
   ```bash
   # Check DATABASE_URL format
   postgres://user:password@host:port/database
   
   # Test connection
   psql "$DATABASE_URL" -c "SELECT 1;"
   ```

2. **Migration errors**:
   ```bash
   # Check if schema exists
   psql "$DATABASE_URL" -c "CREATE SCHEMA IF NOT EXISTS admin_audit;"
   
   # Re-run migrations
   npm run migrate:up
   ```

3. **Authentication issues**:
   ```bash
   # Verify admin credentials
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@example.com","password":"password"}'
   ```

4. **No activities showing**:
   ```bash
   # Run seed script
   npm run seed
   
   # Check if data exists
   psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM admin_audit.activity_log;"
   ```

### Logs

- **Backend logs**: `server/logs/combined.log`
- **Error logs**: `server/logs/error.log`
- **Docker logs**: `docker-compose logs server`

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation at `/api/docs`
3. Check application logs
4. Open an issue with detailed error information

---

**Admin Activity Portal v1.0.0** - Built with ❤️ for Dsalta

## 🚀 Quick Setup with Existing Dsalta Database

Since you're already working with the main Dsalta repository, the Admin Activity Portal is pre-configured to use your existing database and environment:

### Automated Setup
```bash
# Run the setup script (recommended)
./setup.sh
```

### Manual Setup
```bash
# 1. Install dependencies
cd server && npm install && cd ..
cd web && npm install && cd ..

# 2. Run database migrations (creates admin_audit schema)
cd server && npm run migrate:up && cd ..

# 3. Seed sample data (optional)
cd server && npm run seed && cd ..

# 4. Start the application
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend  
cd web && npm run dev
```

### Configuration Notes
- ✅ **Database**: Pre-configured to use your existing Dsalta PostgreSQL database
- ✅ **JWT Secret**: Uses same secret as main app (`your_jwt_secret`)
- ✅ **Google Cloud**: Uses same GCP project and service account
- ✅ **Admin User**: Default credentials are `admin@dsalta.com` / `SecureAdminPassword123!`

The portal will create a separate `admin_audit` schema in your existing database, so it won't interfere with your main application data.

