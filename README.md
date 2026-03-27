# ⚡ BillFlow — Smart Billing System for SMBs

A full-stack, production-ready Progressive Web App for small and medium businesses.
Supports GST invoicing, inventory management, purchase tracking, and financial reports.

---

## 🗂 Project Structure

```
billflow/
├── frontend/                    # React + Vite PWA
│   ├── public/
│   ├── src/
│   │   ├── components/          # Sidebar, Topbar, Modal, DataTable…
│   │   ├── context/             # AuthContext, ThemeContext
│   │   ├── hooks/               # useProducts, useOfflineSync
│   │   ├── pages/               # Dashboard, Products, Sales, Purchases, Reports, Settings
│   │   ├── services/            # Axios API service layer
│   │   ├── styles/              # globals.css (CSS variables, utilities)
│   │   └── utils/               # helpers.js, indexedDB.js
│   ├── index.html
│   └── vite.config.js
│
└── backend/                     # Node.js + Express MVC
    ├── config/db.js             # Mongoose connection
    ├── controllers/             # auth, product, sales, purchase, report
    ├── middleware/              # auth, validate, rateLimiter, errorHandler
    ├── models/                  # User, Product, Sale, Purchase, AuditLog
    ├── routes/                  # auth, products, sales, purchases, reports
    ├── utils/                   # jwt, logger, auditLog, gst, seeder
    └── server.js
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (free tier works)
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/yourname/billflow.git
cd billflow
npm run install:all
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` — at minimum set `MONGO_URI` and `JWT_SECRET`:

```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/billflow
JWT_SECRET=your-super-secret-256-bit-key-here
BCRYPT_SALT_ROUNDS=12
```

### 3. Seed the Database

```bash
cd backend
npm run seed
```

This creates admin/staff users and sample products.

### 4. Run Development Servers

```bash
# From project root — starts both frontend and backend
npm run dev

# Or separately:
cd backend  && npm run dev   # API on :5000
cd frontend && npm run dev   # UI  on :3000
```

Open [http://localhost:3000](http://localhost:3000)

**Login credentials (after seed):**
| Role  | Email                  | Password   |
|-------|------------------------|------------|
| Admin | admin@billflow.in      | admin@123  |
| Staff | staff@billflow.in      | staff@123  |

---

## 🌐 API Reference

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint                     | Access  | Description              |
|--------|------------------------------|---------|--------------------------|
| POST   | `/auth/register`             | Public  | Create new user          |
| POST   | `/auth/login`                | Public  | Login → returns JWT      |
| POST   | `/auth/refresh`              | Public  | Refresh access token     |
| GET    | `/auth/me`                   | Auth    | Get current user profile |
| PATCH  | `/auth/change-password`      | Auth    | Change password          |

### Products
| Method | Endpoint                     | Access  | Description              |
|--------|------------------------------|---------|--------------------------|
| GET    | `/products`                  | Auth    | List (paginated + search)|
| GET    | `/products/low-stock`        | Auth    | Low stock products       |
| GET    | `/products/categories`       | Auth    | Distinct categories      |
| GET    | `/products/:id`              | Auth    | Single product           |
| POST   | `/products`                  | Admin   | Create product           |
| PUT    | `/products/:id`              | Admin   | Update product           |
| DELETE | `/products/:id`              | Admin   | Soft-delete product      |
| PATCH  | `/products/:id/stock`        | Auth    | Adjust stock manually    |

### Sales
| Method | Endpoint                     | Access  | Description              |
|--------|------------------------------|---------|--------------------------|
| GET    | `/sales`                     | Auth    | List sales (filtered)    |
| GET    | `/sales/:id`                 | Auth    | Single sale              |
| POST   | `/sales`                     | Auth    | Create sale + deduct stock|
| PUT    | `/sales/:id`                 | Auth    | Update status/notes      |
| DELETE | `/sales/:id`                 | Admin   | Delete + restore stock   |

### Purchases
| Method | Endpoint                     | Access  | Description              |
|--------|------------------------------|---------|--------------------------|
| GET    | `/purchases`                 | Auth    | List purchases           |
| GET    | `/purchases/:id`             | Auth    | Single purchase          |
| POST   | `/purchases`                 | Auth    | Create + increment stock |
| PUT    | `/purchases/:id`             | Auth    | Update notes/status      |
| PATCH  | `/purchases/:id/mark-paid`   | Auth    | Mark as paid             |
| DELETE | `/purchases/:id`             | Admin   | Delete + reverse stock   |

### Reports
| Method | Endpoint                     | Access  | Description              |
|--------|------------------------------|---------|--------------------------|
| GET    | `/reports/summary`           | Auth    | KPI summary              |
| GET    | `/reports/profit-loss`       | Auth    | Monthly P&L trend        |
| GET    | `/reports/gst`               | Auth    | GST breakdown by rate    |
| GET    | `/reports/export/sales`      | Auth    | Download sales Excel     |
| GET    | `/reports/export/purchases`  | Auth    | Download purchases Excel |

#### Query Parameters (most list endpoints)
| Param    | Type   | Description                              |
|----------|--------|------------------------------------------|
| `page`   | number | Page number (default: 1)                 |
| `limit`  | number | Items per page (default: 20, max: 100)   |
| `search` | string | Full-text search                         |
| `from`   | date   | Start date filter (YYYY-MM-DD)           |
| `to`     | date   | End date filter (YYYY-MM-DD)             |
| `period` | string | today / week / month / quarter / year    |
| `status` | string | paid / pending / cancelled               |

---

## 🚢 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Then connect repo to Vercel — set VITE_API_URL env var
```

```env
VITE_API_URL=https://your-backend.render.com/api
```

### Backend → Render

1. Create a new **Web Service** on [render.com](https://render.com)
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Set all env variables from `.env.example`

### Database → MongoDB Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Whitelist IP: `0.0.0.0/0` (or Render's static IP)
3. Copy connection string to `MONGO_URI`

---

## 🔐 Security Checklist

- [x] JWT authentication with expiry
- [x] bcrypt password hashing (12 rounds)
- [x] Role-based access control (Admin / Staff)
- [x] Joi request validation on all POST/PUT
- [x] MongoDB sanitization (NoSQL injection)
- [x] Rate limiting (global + auth-specific)
- [x] Helmet secure HTTP headers
- [x] CORS with allowlist
- [x] Audit logging for all mutations
- [x] Soft-delete (products never hard-deleted)
- [x] Mongoose transactions for stock operations

---

## 📱 PWA Features

- Installable on Android & iOS ("Add to Home Screen")
- Offline-first with Workbox Service Worker
- IndexedDB offline queue — syncs on reconnect
- Caches static assets + API responses
- Background sync when connection restored

---

## 🛠 Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, React Router 6, Recharts      |
| Build     | Vite 5 + vite-plugin-pwa (Workbox)      |
| Backend   | Node.js, Express 4, MVC architecture    |
| Database  | MongoDB, Mongoose 8 (transactions)      |
| Auth      | JWT (RS256) + bcrypt                    |
| Validation| Joi                                     |
| Security  | Helmet, express-rate-limit, mongo-sanitize |
| Logging   | Winston (file + console)                |
| Export    | ExcelJS (Excel), PDFKit (PDF)           |
| Offline   | Workbox, IndexedDB (idb)               |
