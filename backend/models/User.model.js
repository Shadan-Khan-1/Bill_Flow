const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  tenantId: { type: String, default: 'default', index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  avatar: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

/* ─── Hash password before save ─── */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  this.password = await bcrypt.hash(this.password, rounds)
  next()
})

/* ─── Compare password method ─── */
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password)
}

/* ─── Remove password from JSON output ─── */
userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)
