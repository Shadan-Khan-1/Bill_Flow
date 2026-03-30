const router = require('express').Router()
const ctrl = require('../controllers/product.controller')
const { authenticate, adminOnly } = require('../middleware/auth.middleware')
const { validate, schemas } = require('../middleware/validate.middleware')

router.use(authenticate)

router.get('/', ctrl.getAll)
router.get('/low-stock', ctrl.getLowStock)
router.get('/categories', ctrl.getCategories)
router.get('/:id', ctrl.getOne)
router.post('/', adminOnly, validate(schemas.product), ctrl.create)
router.put('/:id', adminOnly, validate(schemas.product), ctrl.update)
router.delete('/:id', adminOnly, ctrl.delete)
router.patch('/:id/stock', validate(schemas.updateStock), ctrl.updateStock)

module.exports = router
