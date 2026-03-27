const logger = require('../utils/logger')

class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status     = statusCode >= 500 ? 'error' : 'fail'
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

const notFound = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404))
}

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500

  /* ── Mongoose: duplicate key ── */
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0]
    err = new AppError(`Duplicate value for field: ${field}`, 409)
  }

  /* ── Mongoose: cast error ── */
  if (err.name === 'CastError') {
    err = new AppError(`Invalid ${err.path}: ${err.value}`, 400)
  }

  /* ── Mongoose: validation ── */
  if (err.name === 'ValidationError') {
    const msgs = Object.values(err.errors).map(e => e.message)
    err = new AppError(msgs.join('. '), 400)
  }

  /* ── JWT errors ── */
  if (err.name === 'JsonWebTokenError')  err = new AppError('Invalid token', 401)
  if (err.name === 'TokenExpiredError')  err = new AppError('Token expired. Please log in again', 401)

  const isProd = process.env.NODE_ENV === 'production'

  if (isProd && !err.isOperational) {
    logger.error('Unexpected error:', err)
    return res.status(500).json({ status: 'error', message: 'Something went wrong' })
  }

  logger.error(`${err.statusCode} – ${err.message}`, { stack: err.stack })

  res.status(err.statusCode).json({
    status:  err.status || 'error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = { AppError, notFound, globalErrorHandler }
