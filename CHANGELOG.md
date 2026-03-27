# Changelog

All notable changes to BillFlow are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com).

---

## [2.4.1] — 2025-03-27

### Added
- Full multi-file project structure (frontend + backend separated)
- PWA support: installable, offline-capable via Workbox + IndexedDB
- Background sync queue for offline transactions
- Barcode / QR scanner via BarcodeDetector API with manual fallback
- Stock adjustment modal with add / remove / set modes
- PDF invoice generator (PDFKit) — professional A4 layout with GST breakdown
- Excel export for Sales and Purchases reports (ExcelJS)
- Notification panel with low-stock, pending sale, and payment alerts
- DateRangePicker component (preset + custom range)
- Docker Compose with MongoDB, backend, frontend, and Mongo Express
- GitHub Actions CI/CD pipeline (test → build → Docker push → deploy)
- Jest + Supertest API test suite (auth, products, rate limiting)
- Render deployment config (render.yaml)
- Vercel deployment config with rewrite rules
- Nginx config for SPA routing + API proxy + security headers
- Makefile for common dev tasks
- Comprehensive README + DEPLOYMENT guide

### Changed
- Separated single-file artifact into 55+ proper source files
- Replaced mock API calls with real Axios service layer + interceptors
- Upgraded hooks to use IndexedDB caching with offline fallback
- DataTable now supports server-side pagination, sorting, and search

### Security
- JWT with issuer/audience claims
- Bcrypt salt rounds configurable via env
- MongoDB sanitization against NoSQL injection
- Rate limiting on global + auth routes
- Helmet with CSP headers
- Audit log TTL (90 days auto-expire)
- Docker runs backend as non-root user

---

## [2.0.0] — 2025-01-15

### Added
- Initial full-stack implementation
- Role-based access control (Admin / Staff)
- GST invoice generation with CGST/SGST split
- Multi-tenant tenantId support on all collections
- Mongoose transactions for stock operations (atomic)
- Winston logging with file rotation

---

## [1.0.0] — 2024-10-01

### Added
- Initial release — basic billing system
- Product CRUD, Sales, Purchases
- Simple JWT authentication
