const mongoose        = require('mongoose')
const { Sale }        = require('../models/Transaction.model')
const Product         = require('../models/Product.model')
const { AppError }    = require('../middleware/errorHandler')
const { calcTotals, buildInvoiceNo } = require('../utils/gst')
const { audit, ACTIONS } = require('../utils/auditLog')

/* ── GET /api/sales ── */
exports.getAll = async (req, res) => {
  const { page = 1, limit = 20, search, status, from, to, sortBy = 'date', order = 'desc' } = req.query
  const filter = { tenantId: req.tenantId }

  if (status)  filter.status = status
  if (search)  filter['customer.name'] = { $regex: search, $options: 'i' }
  if (from || to) {
    filter.date = {}
    if (from) filter.date.$gte = new Date(from)
    if (to)   filter.date.$lte = new Date(new Date(to).setHours(23, 59, 59))
  }

  const skip = (parseInt(page) - 1) * parseInt(limit)

  const [sales, total] = await Promise.all([
    Sale.find(filter)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Sale.countDocuments(filter),
  ])

  res.json({
    status: 'success',
    results: sales.length,
    total,
    page:       parseInt(page),
    totalPages: Math.ceil(total / parseInt(limit)),
    sales,
  })
}

/* ── GET /api/sales/:id ── */
exports.getOne = async (req, res) => {
  const sale = await Sale.findOne({ _id: req.params.id, tenantId: req.tenantId })
  if (!sale) throw new AppError('Sale not found', 404)
  res.json({ status: 'success', sale })
}

/* ── POST /api/sales ── */
exports.create = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const { customer, products, paymentMode, discount = 0, notes, date, status } = req.body

    /* ── Validate & deduct stock ── */
    for (const item of products) {
      const prod = await Product.findOne({
        _id: item.productId, tenantId: req.tenantId, isActive: true
      }).session(session)

      if (!prod) throw new AppError(`Product '${item.name}' not found or inactive`, 400)
      if (prod.stock < item.qty) {
        throw new AppError(`Insufficient stock for '${prod.name}'. Available: ${prod.stock}`, 400)
      }

      prod.stock -= item.qty
      await prod.save({ session })
    }

    /* ── GST calculations ── */
    const { items, subtotal, gstAmt, cgst, sgst, igst, total } = calcTotals(products)

    /* ── Auto invoice number ── */
    const invoiceNo = await buildInvoiceNo(Sale, 'INV', req.tenantId)

    const sale = await Sale.create([{
      tenantId: req.tenantId,
      invoiceNo,
      date: date || new Date(),
      customer,
      products: items,
      subtotal,
      gstAmt, cgst, sgst, igst,
      discount,
      total: total - discount,
      paymentMode,
      status: status || 'paid',
      notes,
      createdBy: req.user._id,
    }], { session })

    await session.commitTransaction()
    audit(ACTIONS.CREATE_SALE, 'Sale', sale[0]._id, req)

    res.status(201).json({ status: 'success', sale: sale[0] })

  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }
}

/* ── PUT /api/sales/:id ── */
exports.update = async (req, res) => {
  const allowed = ['status', 'notes', 'paymentMode']
  const updates = {}
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k] })

  const sale = await Sale.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    updates,
    { new: true, runValidators: true }
  )
  if (!sale) throw new AppError('Sale not found', 404)
  audit(ACTIONS.UPDATE_SALE, 'Sale', sale._id, req, updates)

  res.json({ status: 'success', sale })
}

/* ── DELETE /api/sales/:id ── */
exports.delete = async (req, res) => {
  const sale = await Sale.findOne({ _id: req.params.id, tenantId: req.tenantId })
  if (!sale) throw new AppError('Sale not found', 404)

  /* Restore stock */
  for (const item of sale.products) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } })
  }

  await sale.deleteOne()
  audit(ACTIONS.DELETE_SALE, 'Sale', sale._id, req)

  res.json({ status: 'success', message: 'Sale deleted and stock restored' })
}
