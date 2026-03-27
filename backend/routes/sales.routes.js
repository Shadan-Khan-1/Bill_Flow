const router   = require('express').Router()
const ctrl     = require('../controllers/sales.controller')
const invoiceCtrl = require('../controllers/invoice.controller')
const { authenticate, adminOnly } = require('../middleware/auth.middleware')
const { validate, schemas }       = require('../middleware/validate.middleware')

router.use(authenticate)

router.get ('/',          ctrl.getAll)
router.get ('/:id/pdf',   invoiceCtrl.downloadInvoicePDF)   // ← PDF download
router.get ('/:id',       ctrl.getOne)
router.post('/',          validate(schemas.sale), ctrl.create)
router.put ('/:id',       ctrl.update)
router.delete('/:id',     adminOnly, ctrl.delete)

module.exports = router
