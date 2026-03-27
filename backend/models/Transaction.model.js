const mongoose = require('mongoose')

/* ─── Shared line-item sub-schema ─── */
const lineItemSchema = new mongoose.Schema({
  productId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:       { type: String, required: true },
  sku:        { type: String },
  qty:        { type: Number, required: true, min: 1 },
  price:      { type: Number, required: true, min: 0 },  // unit price incl. GST
  gst:        { type: Number, default: 18 },
  basePrice:  { type: Number },  // calculated: price / (1 + gst/100)
  gstAmt:     { type: Number },  // calculated
  lineTotal:  { type: Number },  // qty × price
}, { _id: false })

/* ─────────────── SALE MODEL ─────────────── */
const saleSchema = new mongoose.Schema({
  tenantId:  { type: String, default: 'default', index: true },
  invoiceNo: { type: String, required: true, unique: true },
  date:      { type: Date, default: Date.now },

  customer: {
    name:  { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    gst:   { type: String },     // customer GSTIN (B2B)
    address: { type: String },
  },

  products:  [lineItemSchema],

  subtotal:  { type: Number, required: true },  // excl. GST
  cgst:      { type: Number, default: 0 },
  sgst:      { type: Number, default: 0 },
  igst:      { type: Number, default: 0 },
  gstAmt:    { type: Number, required: true },
  discount:  { type: Number, default: 0 },
  total:     { type: Number, required: true },

  paymentMode: {
    type: String,
    enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Credit'],
    default: 'Cash'
  },
  status:       { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'paid' },
  notes:        { type: String },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

saleSchema.index({ tenantId: 1, date: -1 })
saleSchema.index({ tenantId: 1, 'customer.name': 'text' })

/* ─────────────── PURCHASE MODEL ─────────────── */
const purchaseSchema = new mongoose.Schema({
  tenantId:      { type: String, default: 'default', index: true },
  invoiceNo:     { type: String, required: true },
  supplierInvoice: { type: String },
  date:          { type: Date, default: Date.now },
  supplier:      { type: String, required: true },
  supplierGstin: { type: String },

  products:  [lineItemSchema],

  subtotal:  { type: Number, required: true },
  gstAmt:    { type: Number, required: true },
  total:     { type: Number, required: true },

  status:        { type: String, enum: ['pending', 'received', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'partial'],       default: 'pending' },
  notes:         { type: String },
  createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

purchaseSchema.index({ tenantId: 1, date: -1 })
purchaseSchema.index({ tenantId: 1, invoiceNo: 1 }, { unique: true })

/* ─────────────── AUDIT LOG MODEL ─────────────── */
const auditLogSchema = new mongoose.Schema({
  tenantId:  { type: String, default: 'default' },
  action:    { type: String, required: true },   // e.g. 'CREATE_SALE'
  entity:    { type: String, required: true },   // e.g. 'Sale'
  entityId:  { type: mongoose.Schema.Types.ObjectId },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName:  { type: String },
  ip:        { type: String },
  changes:   { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now, expires: '90d' }  // TTL: 90 days
})

auditLogSchema.index({ tenantId: 1, createdAt: -1 })

module.exports = {
  Sale:     mongoose.model('Sale',     saleSchema),
  Purchase: mongoose.model('Purchase', purchaseSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
}
