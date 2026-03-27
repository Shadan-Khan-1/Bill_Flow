const jwt = require('jsonwebtoken')

/**
 * Sign a new access token
 */
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer:    'billflow',
    audience:  'billflow-client',
  })

/**
 * Sign a refresh token
 */
const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer:    'billflow',
    audience:  'billflow-client',
  })

/**
 * Verify an access token — throws on invalid/expired
 */
const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET, {
    issuer:   'billflow',
    audience: 'billflow-client',
  })

/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
    issuer:   'billflow',
    audience: 'billflow-client',
  })

/**
 * Build the standard auth response payload
 */
const buildAuthResponse = (user) => ({
  token: signToken({
    id:       user._id,
    email:    user.email,
    role:     user.role,
    tenantId: user.tenantId,
  }),
  refreshToken: signRefreshToken({ id: user._id }),
  user: {
    _id:      user._id,
    name:     user.name,
    email:    user.email,
    role:     user.role,
    tenantId: user.tenantId,
    avatar:   user.avatar,
  }
})

module.exports = { signToken, verifyToken, signRefreshToken, verifyRefreshToken, buildAuthResponse }
