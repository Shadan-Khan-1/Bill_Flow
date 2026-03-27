const router  = require('express').Router()
const ctrl    = require('../controllers/report.controller')
const { authenticate } = require('../middleware/auth.middleware')
const rateLimiter      = require('../middleware/rateLimiter')

router.use(authenticate)
router.use(rateLimiter.report)

router.get('/summary',              ctrl.getSummary)
router.get('/profit-loss',          ctrl.getProfitLoss)
router.get('/gst',                  ctrl.getGSTReport)
router.get('/export/sales',         ctrl.exportSalesExcel)
router.get('/export/purchases',     ctrl.exportPurchasesExcel)

module.exports = router
