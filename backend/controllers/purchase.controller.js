const mongoose        = require('mongoose')
const { Purchase }    = require('../models/Transaction.model')
const Product         = require('../models/Product.model')
const { AppError }    = require('../middleware/errorHandler')
const { calcTotals, buildInvoiceNo } = require('../utils/gst')
const { audit, ACTIONS } = require('../utils/auditLog')

/* ── GET /api/purchases ── */
exports.getAll = async (req, res) => {
  const { page = 1, limit = 20, search, status, paymentStatus, from, to } = req.query
  const filter = { tenantId: req.tenantId }

  if (status)        filter.status        = status
  if (paymentStatus) filter.paymentStatus = paymentStatus
  if (search)        filter.supplier      = { $regex: search, $options: 'i' }
  if (from || to) {
    filter.date = {}
    if (from) filter.date.$gte = new Date(from)
    if (to)   filter.date.$lte = new Date(new Date(to).setHours(23, 59, 59))
  }

  const skip = (parseInt(page) - 1) * parseInt(limit)

  const [purchases, total] = await Promise.all([
    Purchase.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Purchase.countDocuments(filter),
  ])

  res.json({
    status: 'success',
    results: purchases.length,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    purchases,
  })
}

/* ── GET /api/purchases/:id ── */
exports.getOne = async (req, res) => {
  const purchase = await Purchase.findOne({ _id: req.params.id, tenantId: req.tenantId })
  if (!purchase) throw new AppError('Purchase not found', 404)
  res.json({ status: 'success', purchase })
}

/* ── POST /api/purchases ── */
exports.create = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { invoiceNo, supplierInvoice, supplier, supplierGstin, products, paymentStatus, notes, date } = req.body

    /* ── Check duplicate purchase invoice ── */
    const dup = await Purchase.findOne({ tenantId: req.tenantId, invoiceNo }).session(session)
    if (dup) throw new AppError(`Purchase invoice '${invoiceNo}' already exists`, 409)

    /* ── Calculate totals ── */
    const { items, subtotal, gstAmt, total } = calcTotals(products)

    /* ── Increment stock for each product ── */
    for (const item of items) {
      const prod = await Product.findOne({
        _id: item.productId, tenantId: req.tenantId
      }).session(session)

      if (!prod) throw new AppError(`Product '${item.name}' not found`, 400)

      prod.stock += Number(item.qty)
      if (item.price < prod.costPrice || prod.costPrice === 0) {
        prod.costPrice = Number(item.price)    // update cost price from latest purchase
      }
      await prod.save({ session })
    }

    const purchase = await Purchase.create([{
      tenantId: req.tenantId,
      invoiceNo,
      supplierInvoice,
      date: date || new Date(),
      supplier,
      supplierGstin,
      products: items,
      subtotal,
      gstAmt,
      total,
      status: 'received',
      paymentStatus: paymentStatus || 'pending',
      notes,
      createdBy: req.user._id,
    }], { session })

    await session.commitTransaction()
    audit(ACTIONS.CREATE_PURCHASE, 'Purchase', purchase[0]._id, req)

    res.status(201).json({ status: 'success', purchase: purchase[0] })

  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }
}

/* ── PATCH /api/purchases/:id/mark-paid ── */
exports.markPaid = async (req, res) => {
  const purchase = await Purchase.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    { paymentStatus: 'paid' },
    { new: true }
  )
  if (!purchase) throw new AppError('Purchase not found', 404)
  audit(ACTIONS.UPDATE_PURCHASE, 'Purchase', purchase._id, req, { paymentStatus: 'paid' })

  res.json({ status: 'success', purchase })
}

/* ── PUT /api/purchases/:id ── */
exports.update = async (req, res) => {
  const allowed = ['paymentStatus', 'status', 'notes']
  const updates = {}
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })

  const purchase = await Purchase.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    updates,
    { new: true }
  )
  if (!purchase) throw new AppError('Purchase not found', 404)
  res.json({ status: 'success', purchase })
}

/* ── DELETE /api/purchases/:id ── */
exports.delete = async (req, res) => {
  const purchase = await Purchase.findOne({ _id: req.params.id, tenantId: req.tenantId })
  if (!purchase) throw new AppError('Purchase not found', 404)

  /* Reverse stock */
  for (const item of purchase.products) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } })
  }

  await purchase.deleteOne()
  audit(ACTIONS.DELETE_PURCHASE, 'Purchase', purchase._id, req)

  res.json({ status: 'success', message: 'Purchase deleted and stock reversed' })
}
