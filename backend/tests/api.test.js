/**
 * BillFlow API Tests
 * Run: npm test
 * Requires: jest, supertest  → npm i -D jest supertest
 */

const request  = require('supertest')
const mongoose = require('mongoose')
const app      = require('../server')
const User     = require('../models/User.model')
const Product  = require('../models/Product.model')

let adminToken  = ''
let staffToken  = ''
let productId   = ''

beforeAll(async () => {
  // Connect to test DB
  await mongoose.connect(process.env.MONGO_URI)
  // Clear test data
  await Promise.all([User.deleteMany({}), Product.deleteMany({})])
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
})

/* ───────────────────────────────────────────────────── */
describe('AUTH', () => {

  test('POST /api/auth/register → creates admin user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Admin', email: 'admin@test.com', password: 'Admin@1234', role: 'admin' })
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('token')
    adminToken = res.body.token
  })

  test('POST /api/auth/register → creates staff user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Staff', email: 'staff@test.com', password: 'Staff@1234', role: 'staff' })
    expect(res.status).toBe(201)
    staffToken = res.body.token
  })

  test('POST /api/auth/login → valid credentials return token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@1234' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body.user.role).toBe('admin')
  })

  test('POST /api/auth/login → wrong password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'WrongPass' })
    expect(res.status).toBe(401)
  })

  test('GET /api/auth/me → returns current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('admin@test.com')
  })

  test('GET /api/auth/me → rejects request without token', async () => {
    const res = await request(app).get('/api/auth/me')
    expect(res.status).toBe(401)
  })
})

/* ───────────────────────────────────────────────────── */
describe('PRODUCTS', () => {

  const productPayload = {
    name: 'Test Product', sku: 'TST-001', category: 'Electronics',
    price: 9999, costPrice: 7000, stock: 10, gst: 18, unit: 'pcs',
    supplier: 'Test Supplier', minStock: 3, image: '📦'
  }

  test('POST /api/products → admin can create product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productPayload)
    expect(res.status).toBe(201)
    expect(res.body.product.name).toBe('Test Product')
    expect(res.body.product.sku).toBe('TST-001')
    productId = res.body.product._id
  })

  test('POST /api/products → staff cannot create product (403)', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ ...productPayload, sku: 'TST-002' })
    expect(res.status).toBe(403)
  })

  test('POST /api/products → duplicate SKU returns 409', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(productPayload)
    expect(res.status).toBe(409)
  })

  test('GET /api/products → returns list of products', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.products).toHaveLength(1)
    expect(res.body.total).toBe(1)
  })

  test('GET /api/products/:id → returns single product', async () => {
    const res = await request(app)
      .get(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.product._id).toBe(productId)
  })

  test('PUT /api/products/:id → admin can update product', async () => {
    const res = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ...productPayload, price: 11999 })
    expect(res.status).toBe(200)
    expect(res.body.product.price).toBe(11999)
  })

  test('PATCH /api/products/:id/stock → adjusts stock', async () => {
    const res = await request(app)
      .patch(`/api/products/${productId}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ qty: 5, reason: 'New stock received' })
    expect(res.status).toBe(200)
    expect(res.body.adjustment.after).toBe(15)
  })

  test('GET /api/products/low-stock → returns empty when stock ok', async () => {
    const res = await request(app)
      .get('/api/products/low-stock')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    // stock=15, minStock=3, so not low
    expect(res.body.products).toHaveLength(0)
  })

  test('DELETE /api/products/:id → soft deletes product', async () => {
    const res = await request(app)
      .delete(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)

    // Confirm product no longer returned in list
    const list = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(list.body.products).toHaveLength(0)
  })
})

/* ───────────────────────────────────────────────────── */
describe('RATE LIMITING', () => {
  test('POST /api/auth/login → rate limited after many attempts', async () => {
    const attempts = Array(12).fill(null).map(() =>
      request(app).post('/api/auth/login').send({ email: 'x@x.com', password: 'wrong' })
    )
    const results = await Promise.all(attempts)
    const tooMany = results.some(r => r.status === 429)
    expect(tooMany).toBe(true)
  }, 15000)
})
