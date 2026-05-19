const express = require('express');
const reportController = require('../controllers/report.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');
const { ROLES } = require('../constants/roles');
const {
  createReportSchema,
  updateStatusSchema,
  listReportsQuerySchema,
  nearbyQuerySchema,
  reportIdParamSchema,
} = require('../validators/report.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', validate(listReportsQuerySchema, 'query'), reportController.listReports);
router.get('/analytics', authorize(ROLES.ADMIN), reportController.getAnalytics);
router.get('/nearby', validate(nearbyQuerySchema, 'query'), reportController.getNearby);
router.post('/', validate(createReportSchema), reportController.createReport);
router.get('/:id', validate(reportIdParamSchema, 'params'), reportController.getReport);
router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN),
  validate(reportIdParamSchema, 'params'),
  validate(updateStatusSchema),
  reportController.updateStatus,
);
router.post(
  '/:id/resolve',
  authorize(ROLES.ADMIN),
  validate(reportIdParamSchema, 'params'),
  reportController.resolveReport,
);

module.exports = router;
