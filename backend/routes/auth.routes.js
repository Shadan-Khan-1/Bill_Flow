const router = require('express').Router()
const ctrl = require('../controllers/auth.controller')
const { authenticate } = require('../middleware/auth.middleware')
const { validate, schemas } = require('../middleware/validate.middleware')
const rateLimiter = require('../middleware/rateLimiter')

router.post('/register', validate(schemas.register), ctrl.register)
router.post('/login', rateLimiter.auth, validate(schemas.login), ctrl.login)
router.post('/refresh', ctrl.refresh)
router.get('/me', authenticate, ctrl.getMe)
router.patch('/change-password', authenticate, ctrl.changePassword)

module.exports = router
