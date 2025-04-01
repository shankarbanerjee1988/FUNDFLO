
// const { sequelize, Op } = require('../../../config/db/db');

// const OrderValidateSchema = require("../../models/mapper/OrderValidateSchema.model");

// const moment = require("moment");
// const { literal } = require("sequelize");

// class OrderValidateSchemaRepository {

//     getValidatorByStatusRole = async (enterpriseUuid, orderStatus,roleCode,customRoleCode) => {
//         return await OrderValidateSchema.
//         findOne({
//             where: {
//                 // enterpriseUuid: enterpriseUuid,
//                 orderStatus : orderStatus,
//                 // ...(roleCode ? { roleCode: roleCode } : {}),
//                 // ...(customRoleCode ? { customRoleCode: customRoleCode } : {})

//             },
//             raw : true
//         })
//     }



// }

// module.exports = OrderValidateSchemaRepository;