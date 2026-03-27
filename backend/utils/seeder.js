require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')
const User     = require('../models/User.model')
const Product  = require('../models/Product.model')
const { Sale, Purchase } = require('../models/Transaction.model')

const PRODUCTS = [
  { name: 'Samsung Galaxy S24',    sku: 'SAM-S24-BLK',  category: 'Electronics', price: 79999,  costPrice: 68000,  stock: 15, unit: 'pcs', gst: 18, supplier: 'Samsung India',     minStock: 5,  image: '📱' },
  { name: 'Sony WH-1000XM5',       sku: 'SNY-WH5-BLK',  category: 'Electronics', price: 29990,  costPrice: 24000,  stock: 8,  unit: 'pcs', gst: 18, supplier: 'Sony India',        minStock: 3,  image: '🎧' },
  { name: 'Apple MacBook Air M3',  sku: 'APL-MBA-M3',   category: 'Laptops',     price: 114900, costPrice: 98000,  stock: 4,  unit: 'pcs', gst: 18, supplier: 'Apple Distributor', minStock: 2,  image: '💻' },
  { name: 'Logitech MX Master 3',  sku: 'LOG-MX3-BLK',  category: 'Accessories', price: 9995,   costPrice: 7500,   stock: 22, unit: 'pcs', gst: 18, supplier: 'Logitech India',    minStock: 5,  image: '🖱️' },
  { name: 'Dell 27" 4K Monitor',   sku: 'DEL-U27-4K',   category: 'Monitors',    price: 52990,  costPrice: 44000,  stock: 3,  unit: 'pcs', gst: 18, supplier: 'Dell Technologies', minStock: 2,  image: '🖥️' },
  { name: 'Mechanical Keyboard RGB',sku: 'MEC-KB-RGB',   category: 'Accessories', price: 4999,   costPrice: 3200,   stock: 35, unit: 'pcs', gst: 18, supplier: 'Local Vendor',      minStock: 10, image: '⌨️' },
  { name: 'USB-C Hub 7-in-1',      sku: 'USB-HB-7IN',   category: 'Accessories', price: 2499,   costPrice: 1600,   stock: 2,  unit: 'pcs', gst: 18, supplier: 'Generic Imports',   minStock: 5,  image: '🔌' },
  { name: 'Wireless Charger 15W',  sku: 'WRL-CHG-15W',  category: 'Accessories', price: 1999,   costPrice: 1200,   stock: 18, unit: 'pcs', gst: 18, supplier: 'Generic Imports',   minStock: 5,  image: '⚡' },
]

const USERS = [
  { name: 'Admin User',  email: 'admin@billflow.in',  password: 'admin@123',  role: 'admin' },
  { name: 'Staff User',  email: 'staff@billflow.in',  password: 'staff@123',  role: 'staff' },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    /* Clear existing data */
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Sale.deleteMany({}),
      Purchase.deleteMany({}),
    ])
    console.log('🗑️  Cleared existing data')

    /* Create users */
    const createdUsers = await User.create(USERS)
    console.log(`👤 Created ${createdUsers.length} users`)

    const admin = createdUsers.find(u => u.role === 'admin')

    /* Create products */
    const products = await Product.create(
      PRODUCTS.map(p => ({ ...p, tenantId: 'default', createdBy: admin._id }))
    )
    console.log(`📦 Created ${products.length} products`)

    /* Create sample purchase */
    await Purchase.create({
      tenantId: 'default',
      invoiceNo: 'PUR-0001',
      supplier: 'Samsung India',
      date: new Date('2025-03-10'),
      products: [{
        productId: products[0]._id,
        name: products[0].name,
        qty: 5, price: 68000,
        gst: 18, lineTotal: 340000,
        basePrice: 288136, gstAmt: 51864
      }],
      subtotal: 288136,
      gstAmt: 51864,
      total: 340000,
      status: 'received',
      paymentStatus: 'paid',
      createdBy: admin._id,
    })

    /* Create sample sale */
    await Sale.create({
      tenantId: 'default',
      invoiceNo: 'INV-0001',
      date: new Date('2025-03-20'),
      customer: { name: 'Rahul Sharma', phone: '9876543210', gst: '27AADCB2230M1Z3' },
      products: [{
        productId: products[0]._id,
        name: products[0].name,
        qty: 1, price: 79999,
        gst: 18, lineTotal: 79999,
        basePrice: 67796, gstAmt: 12203
      }],
      subtotal: 67796,
      gstAmt: 12203,
      cgst: 6101.5, sgst: 6101.5,
      total: 79999,
      paymentMode: 'UPI',
      status: 'paid',
      createdBy: admin._id,
    })

    console.log('📄 Created sample transactions')
    console.log('\n✅ Seeding complete!')
    console.log('\n📋 Login credentials:')
    console.log('   Admin → admin@billflow.in / admin@123')
    console.log('   Staff → staff@billflow.in / staff@123')

    process.exit(0)
  } catch (err) {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  }
}

seed()
