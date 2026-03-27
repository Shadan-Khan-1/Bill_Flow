const router = require('express').Router()
const ctrl   = require('../controllers/purchase.controller')
const { authenticate, adminOnly } = require('../middleware/auth.middleware')
const { validate, schemas }       = require('../middleware/validate.middleware')

router.use(authenticate)

router.get ('/',           ctrl.getAll)
router.get ('/:id',        ctrl.getOne)
router.post('/',           validate(schemas.purchase), ctrl.create)
router.put ('/:id',        ctrl.update)
router.patch('/:id/mark-paid', ctrl.markPaid)
router.delete('/:id',     adminOnly, ctrl.delete)

module.exports = router
