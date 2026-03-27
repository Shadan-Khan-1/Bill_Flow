const User = require('../models/User.model')
const { buildAuthResponse, verifyRefreshToken, signToken } = require('../utils/jwt')
const { AppError } = require('../middleware/errorHandler')
const { audit, ACTIONS } = require('../utils/auditLog')

/* ── POST /api/auth/register ── */
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body

  const existing = await User.findOne({ email })
  if (existing) throw new AppError('Email already in use', 409)

  const user = await User.create({
    name, email, password,
    role: role || 'staff',
    tenantId: req.body.tenantId || 'default',
  })

  audit(ACTIONS.CREATE_USER, 'User', user._id, req)

  const payload = buildAuthResponse(user)
  res.status(201).json({ status: 'success', ...payload })
}

/* ── POST /api/auth/login ── */
exports.login = async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email, isActive: true })
    .select('+password')
  // console.table('user :', user);

  if (!user || !(
    await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401)
  }

  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  audit(ACTIONS.LOGIN, 'User', user._id, req)

  const payload = buildAuthResponse(user)
  res.json({ status: 'success', ...payload })
}

/* ── GET /api/auth/me ── */
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id)
  res.json({ status: 'success', user })
}

/* ── POST /api/auth/refresh ── */
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) throw new AppError('Refresh token required', 400)

  const decoded = verifyRefreshToken(refreshToken)
  const user = await User.findById(decoded.id)
  if (!user || !user.isActive) throw new AppError('Invalid refresh token', 401)

  const token = signToken({ id: user._id, email: user.email, role: user.role, tenantId: user.tenantId })
  res.json({ status: 'success', token })
}

/* ── PATCH /api/auth/change-password ── */
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) throw new AppError('Both passwords required', 400)

  const user = await User.findById(req.user._id).select('+password')
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 401)
  }

  user.password = newPassword
  await user.save()

  res.json({ status: 'success', message: 'Password changed successfully' })
}
