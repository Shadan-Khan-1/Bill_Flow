const Joi = require('joi')
const { AppError } = require('./errorHandler')

/* ─── Generic validate factory ─── */
const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  })

  if (error) {
    const messages = error.details.map(d => d.message.replace(/['"]/g, ''))
    return next(new AppError(messages.join('. '), 422))
  }

  req[source] = value
  next()
}

/* ─── Auth schemas ─── */
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('admin', 'staff').default('staff'),
})

/* ─── Product schemas ─── */
const productSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  sku: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(1000).allow(''),
  category: Joi.string().required(),
  image: Joi.string().max(10).default('📦'),
  unit: Joi.string().default('pcs'),
  price: Joi.number().min(0).required(),
  costPrice: Joi.number().min(0).default(0),
  gst: Joi.number().valid(0, 5, 12, 18, 28).default(18),
  stock: Joi.number().min(0).default(0),
  minStock: Joi.number().min(0).default(5),
  supplier: Joi.string().allow(''),
  isActive: Joi.boolean().default(true),
})

const updateStockSchema = Joi.object({
  qty: Joi.number().required(),
  reason: Joi.string().max(200).allow(''),
})

/* ─── Line item sub-schema (reused in sale & purchase) ─── */
const lineItemSchema = Joi.object({
  productId: Joi.string().required(),
  name: Joi.string().required(),
  sku: Joi.string().allow(''),
  qty: Joi.number().min(1).required(),
  price: Joi.number().min(0).required(),
  gst: Joi.number().valid(0, 5, 12, 18, 28).default(18),
})

/* ─── Sale schema ─── */
const saleSchema = Joi.object({
  date: Joi.date().default(() => new Date()),
  customer: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().allow(''),
    email: Joi.string().email().allow(''),
    gst: Joi.string().allow(''),
    address: Joi.string().allow(''),
  }).required(),
  products: Joi.array().items(lineItemSchema).min(1).required(),
  paymentMode: Joi.string().valid('Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Credit').default('Cash'),
  discount: Joi.number().min(0).default(0),
  notes: Joi.string().max(500).allow(''),
  status: Joi.string().valid('paid', 'pending').default('paid'),
})

/* ─── Purchase schema ─── */
const purchaseSchema = Joi.object({
  invoiceNo: Joi.string().required(),
  supplierInvoice: Joi.string().allow(''),
  date: Joi.date().default(() => new Date()),
  supplier: Joi.string().required(),
  supplierGstin: Joi.string().allow(''),
  products: Joi.array().items(lineItemSchema).min(1).required(),
  paymentStatus: Joi.string().valid('pending', 'paid', 'partial').default('pending'),
  notes: Joi.string().max(500).allow(''),
})

/* ─── Query param schemas ─── */
const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  search: Joi.string().allow(''),
  sortBy: Joi.string().allow(''),
  order: Joi.string().valid('asc', 'desc').default('desc'),
})

const dateRangeSchema = Joi.object({
  from: Joi.date(),
  to: Joi.date(),
  period: Joi.string().valid('today', 'week', 'month', 'quarter', 'year'),
})

module.exports = {
  validate,
  schemas: {
    login: loginSchema,
    register: registerSchema,
    product: productSchema,
    updateStock: updateStockSchema,
    sale: saleSchema,
    purchase: purchaseSchema,
    pagination: paginationSchema,
    dateRange: dateRangeSchema,
  }
}
