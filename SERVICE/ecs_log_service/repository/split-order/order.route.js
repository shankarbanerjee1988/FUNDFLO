const express = require('express');
const router = express.Router();

const { validateToken } = require('../../middlewares/validateToken');
const { validateTpReq } = require('../../middlewares/validateTpReq');

const { validateAuth } = require('../middlewares/validateAuth');
const { tagsHandler } = require('../../handlers/tags.handler');
const { listResponseHandler } = require('../../handlers/list.handler');


const IndetExternalDataFeed = require('./indent.external.datafeed');
const indentExternalDataFeed = new IndetExternalDataFeed();

const IndentExternalController = require('./indent.external.controller');
const indentExternalController = new IndentExternalController();

const IndentInternalController = require('./indent.internal.controller');
const indentInternalController = new IndentInternalController();

const IndentOtpController = require('./otp/indent.otp.controller');
const indentOtpController = new IndentOtpController();

const ApprovalConfigController = require('./approval-config/approval-config.controller');
const approvalConfigController = new ApprovalConfigController();

router.route('/so/sync/call').post(validateToken, indentExternalController.callSoSync);

router.route('/so/sync/receive').post(validateAuth, indentExternalDataFeed.feedMultipleData);

router.route('/add/sales').post(validateTpReq, indentExternalController.addSalesVerticalData );

router.route('/create').post(validateTpReq, indentExternalController.createOrder );

router.route('/rdd/value').get(validateToken, indentInternalController.getRddValue );


// Exculsiv Product CRUD Operation
router.route('/excluse/products/all').post(validateToken, indentInternalController.getAllExclusiveProductsList ,listResponseHandler);
router.route('/excluse/products/create').post(validateToken, indentInternalController.createExclusiveProduct );
router.route('/excluse/products/update/:id').post(validateToken, indentInternalController.updateExclusiveProduct );
router.route('/excluse/products/delete/:id').post(validateToken, indentInternalController.deleteExclusiveProduct );


router.route('/report/filter/:type').post(validateToken, tagsHandler, indentInternalController.getReportFilterData );
router.route('/report').post(validateToken, indentInternalController.getReportData );

router.route('/otp/generate/:indentUuid').post( validateToken, tagsHandler, indentOtpController.generateOtp );
router.route('/otp/validate/:indentUuid').post( validateToken, tagsHandler, indentOtpController.validateOtp );
router.route('/otp/reject/:indentUuid').post( validateToken, tagsHandler, indentOtpController.rejectOtp );

router.route('/approval/config/all').post( validateToken, tagsHandler, approvalConfigController.getIndentApprovalConfig );
router.route('/approval/config/upsert').post( validateToken, tagsHandler, approvalConfigController.upsertIndentApprovalConfig );


module.exports = router;