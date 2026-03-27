const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  tenantId:    { type: String, default: 'default', index: true },
  name:        { type: String, required: true, trim: true, maxlength: 200 },
  sku:         { type: String, required: true, trim: true, uppercase: true },
  description: { type: String, maxlength: 1000 },
  category:    { type: String, required: true, trim: true },
  image:       { type: String, default: '📦' },
  unit:        { type: String, default: 'pcs' },

  price:       { type: Number, required: true, min: 0 },   // selling price (incl. GST)
  costPrice:   { type: Number, required: true, min: 0 },   // purchase cost price
  gst:         { type: Number, enum: [0, 5, 12, 18, 28], default: 18 },

  stock:       { type: Number, default: 0, min: 0 },
  minStock:    { type: Number, default: 5, min: 0 },
  supplier:    { type: String, trim: true },

  isActive:    { type: Boolean, default: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
  toJSON: { virtuals: true }
})

/* ─── Indexes ─── */
productSchema.index({ tenantId: 1, sku: 1 }, { unique: true })
productSchema.index({ tenantId: 1, category: 1 })
productSchema.index({ tenantId: 1, name: 'text', sku: 'text' })  // text search

/* ─── Virtuals ─── */
productSchema.virtual('margin').get(function () {
  if (!this.costPrice) return 0
  return Math.round(((this.price - this.costPrice) / this.costPrice) * 100)
})

productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.minStock
})

productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0)              return 'out_of_stock'
  if (this.stock <= this.minStock)   return 'low_stock'
  return 'in_stock'
})

module.exports = mongoose.model('Product', productSchema)
