const Product          = require('../models/Product.model')
const { AppError }     = require('../middleware/errorHandler')
const { audit, ACTIONS } = require('../utils/auditLog')

/* ── Helpers ── */
const buildFilter = (tenantId, query) => {
  const filter = { tenantId, isActive: true }

  if (query.search) {
    filter.$or = [
      { name:     { $regex: query.search, $options: 'i' } },
      { sku:      { $regex: query.search, $options: 'i' } },
      { supplier: { $regex: query.search, $options: 'i' } },
    ]
  }
  if (query.category) filter.category = query.category
  if (query.supplier)  filter.supplier  = { $regex: query.supplier, $options: 'i' }
  if (query.lowStock === 'true') filter.$expr = { $lte: ['$stock', '$minStock'] }

  return filter
}

/* ── GET /api/products ── */
exports.getAll = async (req, res) => {
  const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query
  const filter = buildFilter(req.tenantId, req.query)
  const skip   = (parseInt(page) - 1) * parseInt(limit)

  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean({ virtuals: true }),
    Product.countDocuments(filter),
  ])

  res.json({
    status: 'success',
    results: products.length,
    total,
    page:       parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    products,
  })
}

/* ── GET /api/products/low-stock ── */
exports.getLowStock = async (req, res) => {
  const products = await Product.find({
    tenantId: req.tenantId,
    isActive: true,
    $expr: { $lte: ['$stock', '$minStock'] },
  }).lean({ virtuals: true })

  res.json({ status: 'success', results: products.length, products })
}

/* ── GET /api/products/categories ── */
exports.getCategories = async (req, res) => {
  const categories = await Product.distinct('category', {
    tenantId: req.tenantId, isActive: true
  })
  res.json({ status: 'success', categories })
}

/* ── GET /api/products/:id ── */
exports.getOne = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .lean({ virtuals: true })
  if (!product) throw new AppError('Product not found', 404)
  res.json({ status: 'success', product })
}

/* ── POST /api/products ── */
exports.create = async (req, res) => {
  const exists = await Product.findOne({ tenantId: req.tenantId, sku: req.body.sku.toUpperCase() })
  if (exists) throw new AppError(`SKU '${req.body.sku}' already exists`, 409)

  const product = await Product.create({ ...req.body, tenantId: req.tenantId, createdBy: req.user._id })
  audit(ACTIONS.CREATE_PRODUCT, 'Product', product._id, req)

  res.status(201).json({ status: 'success', product })
}

/* ── PUT /api/products/:id ── */
exports.update = async (req, res) => {
  if (req.body.sku) {
    const duplicate = await Product.findOne({
      tenantId: req.tenantId,
      sku: req.body.sku.toUpperCase(),
      _id: { $ne: req.params.id }
    })
    if (duplicate) throw new AppError(`SKU '${req.body.sku}' already in use`, 409)
  }

  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    req.body,
    { new: true, runValidators: true }
  ).lean({ virtuals: true })

  if (!product) throw new AppError('Product not found', 404)
  audit(ACTIONS.UPDATE_PRODUCT, 'Product', product._id, req, req.body)

  res.json({ status: 'success', product })
}

/* ── DELETE /api/products/:id (soft-delete) ── */
exports.delete = async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    { isActive: false },
    { new: true }
  )
  if (!product) throw new AppError('Product not found', 404)
  audit(ACTIONS.DELETE_PRODUCT, 'Product', product._id, req)

  res.json({ status: 'success', message: 'Product deleted' })
}

/* ── PATCH /api/products/:id/stock ── */
exports.updateStock = async (req, res) => {
  const { qty, reason } = req.body
  const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId })
  if (!product) throw new AppError('Product not found', 404)

  const before    = product.stock
  product.stock   = Math.max(0, product.stock + Number(qty))
  await product.save()

  audit(ACTIONS.ADJUST_STOCK, 'Product', product._id, req, {
    before, after: product.stock, adjustment: qty, reason
  })

  res.json({ status: 'success', product, adjustment: { before, after: product.stock, qty } })
}
