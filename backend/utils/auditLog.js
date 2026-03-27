const { AuditLog } = require('../models/Transaction.model')
const logger       = require('./logger')

/**
 * Record an audit event.
 * Fire-and-forget — never blocks the main request.
 */
const audit = (action, entity, entityId, req, changes = null) => {
  const log = new AuditLog({
    tenantId: req?.tenantId || 'default',
    action,
    entity,
    entityId,
    userId:   req?.user?._id,
    userName: req?.user?.name,
    ip:       req?.ip || req?.connection?.remoteAddress,
    changes,
  })

  log.save().catch(err =>
    logger.error('Audit log save failed:', err.message)
  )
}

const ACTIONS = {
  // Auth
  LOGIN:           'LOGIN',
  LOGOUT:          'LOGOUT',
  // Products
  CREATE_PRODUCT:  'CREATE_PRODUCT',
  UPDATE_PRODUCT:  'UPDATE_PRODUCT',
  DELETE_PRODUCT:  'DELETE_PRODUCT',
  ADJUST_STOCK:    'ADJUST_STOCK',
  // Sales
  CREATE_SALE:     'CREATE_SALE',
  UPDATE_SALE:     'UPDATE_SALE',
  DELETE_SALE:     'DELETE_SALE',
  // Purchases
  CREATE_PURCHASE: 'CREATE_PURCHASE',
  UPDATE_PURCHASE: 'UPDATE_PURCHASE',
  DELETE_PURCHASE: 'DELETE_PURCHASE',
  // Users
  CREATE_USER:     'CREATE_USER',
  UPDATE_USER:     'UPDATE_USER',
  DELETE_USER:     'DELETE_USER',
}

module.exports = { audit, ACTIONS }
