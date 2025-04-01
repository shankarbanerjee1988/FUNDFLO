const FormTemplate = require('../../models/fundflo_oms_template_enterprise/FormTemplate.model');
const FormFields = require('../../models/fundflo_oms_template_enterprise/FormFields.model');
const HideFormFields = require('../../models/fundflo_oms_template_enterprise/HideFormFields.model');

const OrderTemplate = require('../../models/fundflo_oms_template/OrderTemplate.model');
const OrderTemplateItem = require('../../models/fundflo_oms_template/OrderTemplateItems.model');

const { Sequelize } = require('sequelize');
const { Op } = require('../../../config/db/db');

class TemplateRepository {

    getAllFromTemplatesGeneric = async (enterpriseUuid) => {
        return await FormTemplate.findAndCountAll({
            where: {
                enterpriseUuid
            },
            raw: true
        });
    }

    getTemplateDataWithFields = async (enterpriseUuid, hiddenFields, formCode) => {
        let data = await FormTemplate.findAndCountAll({
            where: {
                enterpriseUuid,
                formCode
            },
            include: [
                {
                    model: FormFields,
                    association: FormTemplate.hasMany(FormFields, { foreignKey: 'formTemplateUuid', sourceKey: 'id' }),
                    where: {
                        id: {
                            [Op.notIn]: hiddenFields
                        }
                    }
                }
            ]
        });
        return data;
    }

    getHiddenFieldsGeneric = async (whereObj, transaction) => {
        let data = await HideFormFields.findOne({
            where: whereObj,
            raw: true,
            ...(transaction ? { transaction } : {})
        });
        return data;
    }

    createTemplate = async (createObj, transaction) => {
        return await FormTemplate.create(createObj, {
            ...(transaction ? { transaction } : {}),
            returning: true
        })
    }

    updateTemplateGeneric = async (whereObj, updateObj, transaction) => {
        if (!whereObj) throw new Error(`whereObj is mandatory`);
        return await FormTemplate.update(updateObj, {
            where: whereObj,
            ...(transaction ? { transaction } : {}),
            returning: true
        })
    }

    getOrderTemplate = async (enterpriseUuid) => {
        return await OrderTemplate.findAndCountAll({
            include: [
                {
                    model: OrderTemplateItem,
                    association: OrderTemplate.hasMany(OrderTemplateItem, { foreignKey: 'sectionCode', sourceKey: 'sectionCode' })
                }
            ],
        })
    }

    createFormFieldGeneric = async (createObj, transaction) => {
        return await FormFields.create(createObj, {
            ...(transaction ? { transaction } : {}),
            returning: true
        })
    }

    updateFormFieldGeneric = async (whereObj, updateObj, transaction) => {
        if (!whereObj) throw new Error(`whereObj is mandatory`);
        return await FormFields.update(updateObj, {
            where: whereObj,
            ...(transaction ? { transaction } : {}),
            returning: true
        })
    }

    createHideFieldGeneric = async (createObj, transaction) => {
        return await HideFormFields.create(createObj, {
            ...(transaction ? { transaction } : {}),
            returning: true
        })
    }

    updateHideFieldGeneric = async (whereObj, updateObj, transaction) => {
        if (!whereObj) throw new Error(`whereObj is mandatory`);
        return await HideFormFields.update(updateObj, {
            where: whereObj,
            ...(transaction ? { transaction } : {}),
            returning: true
        })
    }

    deleteHideFieldGeneric = async (whereObj, transaction) => {
        if (!whereObj) throw new Error(`whereObj is mandatory`);
        return await HideFormFields.destroy({
            where: whereObj,
            ...(transaction ? { transaction } : {})
        });
    }

}

module.exports = TemplateRepository;