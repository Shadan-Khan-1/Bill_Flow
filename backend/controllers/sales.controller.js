const mongoose = require('mongoose')
const { Sale } = require('../models/Transaction.model')
const Product = require('../models/Product.model')
const { AppError } = require('../middleware/errorHandler')
const { buildInvoiceNo } = require('../utils/gst')
const { audit, ACTIONS } = require('../utils/auditLog')

/* ─── simple total: price × qty, no GST ─── */
const calcSimpleTotal = (products) =>
    products.reduce((sum, item) => sum + (+item.price || 0) * (+item.qty || 0), 0)

/* ── GET /api/sales ── */
exports.getAll = async (req, res) => {
    const {
        page = 1, limit = 50,
        search, status,
        from, to,
        sortBy = 'date', order = 'desc'
    } = req.query

    const filter = { tenantId: req.tenantId }

    if (status) filter.status = status

    if (search) {
        filter.$or = [
            { 'customer.name': { $regex: search, $options: 'i' } },
            { 'customer.phone': { $regex: search, $options: 'i' } },
            { invoiceNo: { $regex: search, $options: 'i' } },
        ]
    }

    if (from || to) {
        filter.date = {}
        if (from) filter.date.$gte = new Date(from)
        if (to) filter.date.$lte = new Date(new Date(to).setHours(23, 59, 59))
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
        page: parseInt(page),
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
        const {
            customer,           // { name, phone }
            products,           // [{ productId, name, qty, price }]
            date,
            paymentMode = 'Cash',
            notes,
            status,
        } = req.body

        /* ── Validate required fields ── */
        if (!customer?.name?.trim()) {
            throw new AppError('Customer name is required', 400)
        }
        if (!Array.isArray(products) || products.length === 0) {
            throw new AppError('At least one product is required', 400)
        }

        /* ── Validate products & deduct stock ── */
        const savedItems = []

        for (const item of products) {
            if (!item.productId) throw new AppError('productId is required for each item', 400)
            if (!item.qty || +item.qty < 1) throw new AppError(`Invalid quantity for '${item.name}'`, 400)

            const prod = await Product.findOne({
                _id: item.productId,
                tenantId: req.tenantId,
                isActive: true,
            }).session(session)

            if (!prod) {
                throw new AppError(`Product '${item.name || item.productId}' not found or inactive`, 400)
            }
            if (prod.stock < +item.qty) {
                throw new AppError(
                    `Insufficient stock for '${prod.name}'. Available: ${prod.stock}, requested: ${item.qty}`,
                    400
                )
            }

            prod.stock -= +item.qty
            await prod.save({ session })

            savedItems.push({
                productId: prod._id,
                name: prod.name,
                qty: +item.qty,
                price: +item.price || +prod.price || 0,
                lineTotal: (+item.price || +prod.price || 0) * +item.qty,
            })
        }

        /* ── Calculate total (no GST) ── */
        const total = calcSimpleTotal(savedItems)

        /* ── Auto invoice number ── */
        const invoiceNo = await buildInvoiceNo(Sale, 'INV', req.tenantId)

        /* ── Create sale ── */
        const sale = await Sale.create([{
            tenantId: req.tenantId,
            invoiceNo,
            date: date || new Date(),
            customer: { name: customer.name.trim(), phone: customer.phone?.trim() || '' },
            products: savedItems,
            subtotal: total,
            // gstAmt: 0,
            // cgst: 0,
            // sgst: 0,
            // igst: 0,
            // discount: 0,
            total,
            paymentMode,
            status: status || 'paid',
            notes: notes || '',
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

    /* Restore stock for each product */
    for (const item of sale.products) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } })
    }

    await sale.deleteOne()
    audit(ACTIONS.DELETE_SALE, 'Sale', sale._id, req)

    res.json({ status: 'success', message: 'Sale deleted and stock restored' })
}