const OrderValidateSchema = require('../../models/validate/ValidateOrder.model');

class ValidationRepository {

    getValidateionDetails = async (enterpriseUuid, legalEntityUuid, orderStatus, roleCode) => {
        return await OrderValidateSchema.findOne({
            where: {
                enterpriseUuid,
                orderStatus,
                roleCode
            }
        })
    }


}

module.exports = ValidationRepository;