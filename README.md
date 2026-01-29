# Evidence Property Manager

⚖️ **Digital Evidence Property Management System**

A full-stack web application for managing digital evidence in forensic investigations. Built with Next.js, TypeScript, and SQLite.

## 🚀 Live Demo

- **Production**: https://evidence-property-manager.vercel.app
- **GitHub**: https://github.com/scott-andrew-reid/evidence-property-manager

## ✨ Features

### Authentication
- ✅ Secure JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Protected API routes and pages
- ✅ Session management with HTTP-only cookies

### Evidence Management
- ✅ Create, read, update evidence items
- ✅ Case number and item number tracking
- ✅ Collection date and collector information
- ✅ Storage location tracking
- ✅ Status management (Stored, In Analysis, Released, Destroyed)
- ✅ Chain of custody documentation
- ✅ Notes and additional details

### Audit Trail
- ✅ Automatic audit logging for all actions
- ✅ User attribution for all evidence entries
- ✅ Timestamp tracking

### User Interface
- ✅ Responsive design with Tailwind CSS
- ✅ Clean, professional interface
- ✅ Table view with status badges
- ✅ Inline evidence creation form
- ✅ Mobile-friendly layout

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT + bcryptjs
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/scott-andrew-reid/evidence-property-manager.git
cd evidence-property-manager

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Edit .env.local and set your JWT_SECRET

# Run development server
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🔐 Default Credentials

**Username**: `admin`  
**Password**: `admin123`

⚠️ **IMPORTANT**: Change the default password immediately in production!

## 📝 Database Schema

### Users Table
- `id`: Primary key
- `username`: Unique username
- `password_hash`: Bcrypt hashed password
- `full_name`: User's full name
- `role`: User role (admin/user)
- `created_at`: Registration timestamp

### Evidence Items Table
- `id`: Primary key
- `case_number`: Case reference number
- `item_number`: Evidence item number
- `description`: Item description
- `collected_date`: Collection date
- `collected_by`: Collector name
- `location`: Storage location
- `chain_of_custody`: Chain of custody details
- `status`: Current status
- `notes`: Additional notes
- `created_by`: User ID of creator
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Audit Log Table
- `id`: Primary key
- `user_id`: User performing action
- `action`: Action type
- `table_name`: Affected table
- `record_id`: Affected record
- `details`: Action details (JSON)
- `timestamp`: Action timestamp

## 🚀 Deployment

### Vercel (Current)

```bash
npm run build
vercel --prod
```

### ⚠️ Important Notes for Production

**SQLite Limitation on Vercel:**
- SQLite works locally but **NOT in Vercel's serverless environment**
- Database resets on each deployment
- For production, migrate to:
  - **Neon** (recommended - serverless Postgres)
  - **PlanetScale** (MySQL)
  - **Supabase** (PostgreSQL)
  - **MongoDB Atlas**

**Migration Path:**
1. Choose a cloud database provider
2. Update `lib/db/schema.ts` with cloud database client
3. Migrate schema and seed data
4. Update environment variables
5. Redeploy

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this
DATABASE_URL=your-database-connection-string-here
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Evidence Management
- `GET /api/evidence` - List all evidence items
- `POST /api/evidence` - Create new evidence item
- `PUT /api/evidence/:id` - Update evidence item (TODO)
- `DELETE /api/evidence/:id` - Delete evidence item (TODO)

## 🔒 Security Features

- ✅ JWT authentication with HTTP-only cookies
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Protected API routes
- ✅ SQL injection prevention (prepared statements)
- ✅ XSS protection (React auto-escaping)
- ✅ CSRF protection (SameSite cookies)

## 🚧 Roadmap

- [ ] Edit/Update evidence items
- [ ] Delete evidence items (with confirmation)
- [ ] Search and filter functionality
- [ ] Export to PDF/CSV
- [ ] File attachment support
- [ ] Multi-user management
- [ ] Role-based permissions
- [ ] Advanced audit trail viewer
- [ ] Email notifications
- [ ] Barcode/QR code generation
- [ ] Cloud database migration
- [ ] Docker support

## 📄 License

ISC

## 👤 Author

**Malchador** (The Sigillite)
- GitHub: [@scott-andrew-reid](https://github.com/scott-andrew-reid)

## 🙏 Acknowledgments

Built for digital forensic analysts who need a simple, reliable evidence tracking system.

---

**⚖️ Built with precision. Deployed with confidence.**
