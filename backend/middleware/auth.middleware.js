const { verifyToken } = require('../utils/jwt')
const User            = require('../models/User.model')
const { AppError }    = require('./errorHandler')

/* ─── Authenticate: verify JWT ─── */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided. Please log in.', 401))
  }

  const token = authHeader.split(' ')[1]

  const decoded = verifyToken(token)          // throws if invalid/expired

  const user = await User.findById(decoded.id).select('+isActive')
  if (!user)           return next(new AppError('User no longer exists', 401))
  if (!user.isActive)  return next(new AppError('Account is deactivated', 403))

  req.user     = user
  req.tenantId = user.tenantId || decoded.tenantId || 'default'
  next()
}

/* ─── Authorize: role-based access ─── */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError(`Role '${req.user.role}' is not allowed to perform this action`, 403))
  }
  next()
}

/* ─── Admin-only shorthand ─── */
const adminOnly = authorize('admin')

/* ─── Attach tenantId from header (multi-tenant support) ─── */
const resolveTenant = (req, res, next) => {
  const headerTenant = req.headers['x-tenant-id']
  if (headerTenant && req.user?.role === 'admin') {
    req.tenantId = headerTenant
  }
  next()
}

module.exports = { authenticate, authorize, adminOnly, resolveTenant }
