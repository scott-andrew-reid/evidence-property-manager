# Evidence Property Manager

⚖️ **Digital Evidence Property Management System**

A full-stack web application for managing digital evidence in forensic investigations. Built with Next.js, TypeScript, and Neon Postgres.

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

### User Interface
- ✅ shadcn/ui component library
- ✅ Dark/Light mode toggle
- ✅ Responsive design with Tailwind CSS
- ✅ Professional grayscale theme
- ✅ Clean, modern interface
- ✅ Table view with status badges
- ✅ Inline evidence creation form
- ✅ Mobile-friendly layout

### Audit Trail
- ✅ Automatic audit logging for all actions
- ✅ User attribution for all evidence entries
- ✅ Timestamp tracking

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Neon Postgres (serverless)
- **Authentication**: JWT + bcryptjs
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Theme**: next-themes
- **Deployment**: Vercel

## 📦 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Neon Postgres account (free tier available)

### 1. Clone the repository

```bash
git clone https://github.com/scott-andrew-reid/evidence-property-manager.git
cd evidence-property-manager
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Neon Postgres

1. Create a free account at [console.neon.tech](https://console.neon.tech)
2. Create a new project
3. Copy the connection string

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this
DATABASE_URL=postgresql://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
```

### 5. Run development server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🔐 Default Credentials

**Username**: `admin`  
**Password**: `admin123`

⚠️ **IMPORTANT**: Change the default password immediately in production!

## 📝 Database Schema

### Users Table
- `id`: SERIAL PRIMARY KEY
- `username`: TEXT UNIQUE NOT NULL
- `password_hash`: TEXT NOT NULL
- `full_name`: TEXT NOT NULL
- `role`: TEXT NOT NULL DEFAULT 'user'
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Evidence Items Table
- `id`: SERIAL PRIMARY KEY
- `case_number`: TEXT NOT NULL
- `item_number`: TEXT NOT NULL
- `description`: TEXT NOT NULL
- `collected_date`: DATE NOT NULL
- `collected_by`: TEXT NOT NULL
- `location`: TEXT
- `chain_of_custody`: TEXT
- `status`: TEXT DEFAULT 'stored'
- `notes`: TEXT
- `created_by`: INTEGER (FK to users)
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updated_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Audit Log Table
- `id`: SERIAL PRIMARY KEY
- `user_id`: INTEGER (FK to users)
- `action`: TEXT NOT NULL
- `table_name`: TEXT NOT NULL
- `record_id`: INTEGER
- `details`: TEXT
- `timestamp`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables:
   - `JWT_SECRET`
   - `DATABASE_URL` (from Neon)
4. Deploy!

The database will automatically initialize on first request.

### Vercel CLI

```bash
npm run build
vercel --prod
```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Evidence Management
- `GET /api/evidence` - List all evidence items
- `POST /api/evidence` - Create new evidence item

## 🔒 Security Features

- ✅ JWT authentication with HTTP-only cookies
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Protected API routes
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (React auto-escaping)
- ✅ CSRF protection (SameSite cookies)
- ✅ Secure database connections (SSL)

## 🎨 UI Components

Built with shadcn/ui:
- Button
- Input
- Label
- Card
- Textarea
- Select
- Theme Toggle

## 🌓 Theme Support

- Light mode (default)
- Dark mode
- System preference detection
- Persistent theme selection

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
- [ ] Batch operations
- [ ] Advanced reporting

## 📄 License

ISC

## 👤 Author

**Malchador** (The Sigillite)
- GitHub: [@scott-andrew-reid](https://github.com/scott-andrew-reid)

## 🙏 Acknowledgments

Built for digital forensic analysts who need a simple, reliable evidence tracking system.

---

**⚖️ Built with precision. Deployed with confidence.**
