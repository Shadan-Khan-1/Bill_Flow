require('express-async-errors')
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const mongoSanitize = require('express-mongo-sanitize')
// const xssClean   = require('xss-clean')  // uncomment if package installed

const connectDB = require('./config/db')
const logger = require('./utils/logger')
const { globalErrorHandler, notFound } = require('./middleware/errorHandler')
const rateLimiter = require('./middleware/rateLimiter')

/* ─── Routes ─── */
const authRoutes = require('./routes/auth.routes')
const productRoutes = require('./routes/product.routes')
const purchaseRoutes = require('./routes/purchase.routes')
const salesRoutes = require('./routes/sales.routes')
const reportRoutes = require('./routes/report.routes')

const app = express()

/* ─── Security Middleware ─── */
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
    }
  }
}))

app.use(cors({
  origin: (origin, cb) => {
    const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim())
    if (!origin || allowed.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID']
}))

app.use(rateLimiter.global)
app.use(compression())
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(mongoSanitize())           // prevent NoSQL injection
// app.use(xssClean())              // sanitize XSS in request body

/* ─── Logging ─── */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) }
  }))
}

/* ─── Health check ─── */
app.get('/health', (_, res) =>
  res.json({ status: 'ok', uptime: process.uptime(), env: process.env.NODE_ENV })
)

/* ─── API Routes ─── */
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/purchases', purchaseRoutes)
app.use('/api/sales', salesRoutes)
app.use('/api/reports', reportRoutes)

/* ─── Error Handlers ─── */
app.use(notFound)
app.use(globalErrorHandler)

/* ─── Start ─── */
const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`🚀 BillFlow API running on port ${PORT} [${process.env.NODE_ENV}]`)
  })
}).catch(err => {
  logger.error('DB connection failed:', err)
  process.exit(1)
})

/* ─── Unhandled rejections ─── */
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err)
  process.exit(1)
})
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err)
  process.exit(1)
})

module.exports = app
