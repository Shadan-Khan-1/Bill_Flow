const rateLimit = require('express-rate-limit')

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 1 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    status:  'fail',
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  skip: (req) => process.env.NODE_ENV === 'test',
})

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max:      parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    status:  'fail',
    message: 'Too many login attempts. Please wait 15 minutes and try again.'
  },
})

const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      10,
  message: {
    status:  'fail',
    message: 'Report generation is rate-limited. Please wait a moment.'
  },
})

module.exports = {
  global: globalLimiter,
  auth:   authLimiter,
  report: reportLimiter,
}
