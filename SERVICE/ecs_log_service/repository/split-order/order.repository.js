const Users = require("../../V1/admin/models/fundfloAdmin/Users");
const LegalEntity = require("../../V1/admin/models/fundfloAdmin/LegalEntity");
const Division = require("../../V1/admin/models/fundfloAdmin/Division");
const Plant = require("../../V1/admin/models/fundfloAdmin/Plant");
const SalesOffice = require("../../V1/admin/models/fundfloAdmin/SalesOffice");
const SalesGroup = require("../../V1/admin/models/fundfloAdmin/SalesGroup");
const Indent = require("../../V1/misc/indent/models/fundfloIndent/Indent.model");
const ProductMaster = require("../../V1/admin/models/fundfloMaster/ProductMaster");
const IndentTemplate = require("../../V1/misc/indent/models/fundfloIndent/IndentTemplate.model");
const ProductPriceConfig = require("../config/models/ProductPriceConfig");
const IndentTaxDiscountConfig = require("../../V1/misc/indent/models/fundfloIndent/IndentTaxDiscountConfig.model");
const IndentItemDiscount = require("../../V1/misc/indent/models/fundfloIndent/IndentItemDiscounts.model");
const IndentItemCharges = require("../../V1/misc/indent/models/fundfloIndent/IndentItemCharges");
const IndentItemCalculation = require("./models/indentItemCalculation.model");
const FailedSalesOrderLogs = require("./models/failedSalesOrderLogs.model");
const IndentItems = require("../../V1/misc/indent/models/fundfloIndent/IndentItems.model");
const UsersEnterpriseConfig = require("../../V1/admin/models/fundfloAdmin/UsersEnterpriseConfig");
const State = require("../../V1/admin/models/fundfloAdmin/states");
const SalesData = require('./models/sales_data');
const RddValue = require('./models/RddValue');
const ExclusiveProducts = require('./models/exclusiveProducts');
const SalesOrderInvoiceMapping = require("../../V1/misc/indent/models/fundfloIndent/SalesOrderInvoiceMapping.model");
const OperationalRelationships = require('../../V1/admin/business/models/fundfloMapping/OperationalRelationships');
const Document = require('./../../V1/AR/models/fundfloArDocument/Documents');
const SyncLogs = require('../../V1/AR/models/fundfloSync/SyncLogs');

const { logger } = require('../../config/logger');
const { sequelize, Op } = require('../../config/db/db');
const moment = require("moment");
const { literal } = require("sequelize");
const ExcludedDiscount = require("./models/excludedDiscount");

class IndentRepository {

    getItemDetails = async (enterpriseUuid, itemCode, qualityCode = null, plant = null, division = null, dcCode = null) => {
        return await ProductMaster.findOne({
            attributes: [
                ['material', 'itemCode'],
                ['material_desc', 'itemDesc'],
                ['material_group', 'itemGroup'],
                ["brand_and_product", 'productCode'],
                ["brand_and_product_desc", 'productDesc'],
                ['vertical_division', 'brandCode'],
                ['vertical_division_desc', 'brandDesc'],
                ['category', 'categoryCode'],
                ['category_desc', 'categoryDesc'],
                ['grade_display', 'gradeDisplay'],
                ['design', 'design'],
                ['design_desc', 'designDesc'],
                ['top_design', 'topDesign'],
                ['bottom_design', 'bottomDesign'],
                ['designes_desc', 'designesDesc'],
                ['design_no', 'designNo'],
                ['design_no_desc', 'designNoDesc'],
                ['finish', 'finish'],
                ['finish_desc', 'finishDesc'],
                ['grade', 'grade'],
                ['grade_desc', 'gradeDesc'],
                'netWeight',
                'grossWeight',
                'weightUnit',
                ['material_size', 'size'],
                ['material_thickness', 'thickness'],
                ['denominator', 'denominator'],
                ['counter', 'numerator'],
                ['material_desc_display', 'materialDescDisplay'],
                ["material_size_code", "materialSizeCode"],
                ["sale_unit", "saleUnit"],

            ],
            where: {
                ...(qualityCode ? { grade: qualityCode } : {}),
                ...(plant ? { plantUuid: plant } : {}),
                ...(division ? { divisionUuid: division } : {}),
                ...(dcCode ? { dc: dcCode } : {}),
                enterpriseUuid: enterpriseUuid,
                material: itemCode,
                display: true
            },
            raw: true
        })
    }

    getItemDetailsByTradingMaterialCode = async (enterpriseUuid, itemCode, qualityCode = null, plant = null, division = null, dcCode = null) => {
        return await ProductMaster.findOne({
            attributes: [
                ['material', 'itemCode'],
                ['material_desc', 'itemDesc'],
                ['material_group', 'itemGroup'],
                ["brand_and_product", 'productCode'],
                ["brand_and_product_desc", 'productDesc'],
                ['vertical_division', 'brandCode'],
                ['vertical_division_desc', 'brandDesc'],
                ['category', 'categoryCode'],
                ['category_desc', 'categoryDesc'],
                ['grade_display', 'gradeDisplay'],
                ['design', 'design'],
                ['design_desc', 'designDesc'],
                ['top_design', 'topDesign'],
                ['bottom_design', 'bottomDesign'],
                ['designes_desc', 'designesDesc'],
                ['design_no', 'designNo'],
                ['design_no_desc', 'designNoDesc'],
                ['finish', 'finish'],
                ['finish_desc', 'finishDesc'],
                ['grade', 'grade'],
                ['grade_desc', 'gradeDesc'],
                'netWeight',
                'grossWeight',
                'weightUnit',
                ['material_size', 'size'],
                ['material_thickness', 'thickness'],
                ['denominator', 'denominator'],
                ['counter', 'numerator'],
                ['material_desc_display', 'materialDescDisplay'],
                ["material_size_code", "materialSizeCode"],
                ["sale_unit", "saleUnit"],

            ],
            where: {
                ...(qualityCode ? { grade: qualityCode } : {}),
                ...(plant ? { plantUuid: plant } : {}),
                ...(division ? { divisionUuid: division } : {}),
                ...(dcCode ? { dc: dcCode } : {}),
                enterpriseUuid: enterpriseUuid,
                tradingMaterialCode: itemCode,
                display: true
            },
            raw: true
        })
    }

    getPaymentTermsComments = async (enterpriseUuid, userUuid, division) => {
        return await OperationalRelationships.findOne({
            attributes: [
                ['additional_plain_text_data', 'additionalPlainTextData']
            ],
            where: {
                enterpriseUuid: enterpriseUuid,
                userUuid: userUuid,
                division : division
            },
            raw : true
        })
    }


    findIndentDetailsByUniqueId = async (enterpriseUuid, ffIndentNo, soNumber) => {
        return Indent.findOne({
            attributes: [
                ...(Object.keys(Indent.getAttributes())),
            ],
            where: {
                enterpriseUuid: enterpriseUuid,
                [Op.or]: {
                    ffIndentNo: ffIndentNo,
                    ...(soNumber ? { soNumber: soNumber } : {})
                }
            },
            raw: true
        });
    }

    findPlantDetailsByCode = async (enterpriseUuid, plantCode) => {
        return await Plant.findOne({
            attributes: [
                'id',
                'plantCode',
                'plantDescription',
                'plantType',
                ['column1', 'incoTermLocation']
            ],
            where: {
                enterpriseUuid: enterpriseUuid,
                plantCode: plantCode
            },
            raw: true
        })
    }

    findSalesOfficDetailsByCode = async (enterpriseUuid, salesOffice) => {
        return await SalesOffice.findOne({
            attributes: [
                'id',
                'salesOfficeCode',
                'salesOfficeDescription',
            ],
            where: {
                enterpriseUuid: enterpriseUuid,
                salesOfficeCode: salesOffice
            },
            raw: true
        })
    }

    findSalesGroupDetailsByCode = async (enterpriseUuid, salesGroup) => {
        return await SalesGroup.findOne({
            attributes: [
                'id',
                'salesGroupCode',
                'salesGroupDescription',
            ],
            where: {
                enterpriseUuid: enterpriseUuid,
                salesGroupCode: salesGroup
            },
            raw: true
        })
    }

    findDivisionDetailsByCode = async (enterpriseUuid, divisionCode) => {
        return await Division.findOne({
            attributes: [
                'id',
                'divisionCode',
                'divisionDescription',
            ],
            where: {
                enterpriseUuid: enterpriseUuid,
                divisionCode: divisionCode
            },
            raw: true
        })
    }

    findLegalEnityDetailsByCode = async (enterpriseUuid, companycode) => {
        return await LegalEntity.findOne({
            attributes: [
                'id',
                'entityCode',
                'entityName'
            ],
            where: {
                enterpriseUuid: enterpriseUuid,
                entityCode: companycode
            },
            raw: true
        })
    }

    findUserDetailsUserCode = async (enterpriseUuid, userCode) => {
        return await Users.findOne({
            attributes: [
                'id',
                'legalEntityUuid',
                'userFullname',
                'userMobile',
                'userCode'
            ],
            where: {
                enterpriseUuid: enterpriseUuid,
                userCode: userCode
            },
            raw: true
        })
    }

    getIndentTemplate = async (enterpriseUuid, legalEntityUuid) => {
        return await IndentTemplate.findOne({
            where: {
                enterpriseUuid: enterpriseUuid,
                legalEntityUuid: legalEntityUuid,
                isActive: true
            },
            raw: true
        })
    }

    getEnterpriseConfig = async (enterpriseUuid, legalEntityUuid, orderType) => {
        return await ProductPriceConfig.findOne({
            where: {
                enterpriseUuid: enterpriseUuid,
                legalEntityUuid: legalEntityUuid,
                orderType: orderType
            },
            raw: true
        })
    }

    getTaxDiscountJson = async (enterpriseUuid, legalEntityUuid, orderType, configType) => {
        return await IndentTaxDiscountConfig.findAll({
            where: {
                enterpriseUuid: enterpriseUuid,
                legalEntityUuid: legalEntityUuid,
                orderType: orderType,
                configType: configType
            },
            order: [['seq_no', 'asc']],
            raw: true
        })
    }

    getTCSPercentageByUser = async (enterpriseUuid, legalEntityUuid, userUuid) => {
        return await sequelize.query(`SELECT tcs_amount,tcs_percentage,uec.has_tcs FROM fundflo_master.tcs_tax  tcs
        left join fundflo_admin.user_enterprise_config uec on uec.tcs_code::text = tcs.tcs_code::text 
        WHERE enterprise_uuid=$enterpriseUuid and legal_entity_uuid=$legalEntityUuid 
        and uec.user_uuid=$userUuid and tcs.tcs_code=0 LIMIT 1`,
            {
                bind: {
                    enterpriseUuid,
                    legalEntityUuid,
                    userUuid
                }
            });
    }

    findIndentBySoNumber = async (enterpriseUuid, soNumber) => {
        return await Indent.findOne({
            attributes: [
                'soNumber',
                'ffIndentNo'
            ],
            where: {
                enterpriseUuid: enterpriseUuid,
                soNumber: soNumber
            }
        })
    }

    createFailedSalesOrderLog = async (logObject) => {
        try {
            await FailedSalesOrderLogs.create(logObject, {
                returning: ['id']
            });
        } catch (err) {
            logger.customError('createFailedSalesOrderLog', `${JSON.stringify(err?.message)}`)
        }
    }

    getStateCustomeCode = async (enterpriseUuid, legalEntityUuid, userCode) => {
        const user = await Users.findOne({
            attributes: [
                'id'
            ],
            where: {
                enterpriseUuid: enterpriseUuid,
                userCode: userCode
            },
            raw: true
        });
        return await UsersEnterpriseConfig.findOne({
            attributes: [
                [sequelize.col('"State".custom_wise_seqno'), 'stateCustomCode']
            ],
            include: [{
                attributes: [],
                model: State,
                required: false,
                association: UsersEnterpriseConfig.belongsTo(State, { foreignKey: 'state_code', targetKey: 'stateCode' })
            }],
            where: {
                userUuid: user?.id
            },
            raw: true
        });
    }

    async getAllIndentItems(indentId) {
        return await IndentItems.findAll({
            attributes: [
                'indentId',
                'itemCode',
                'rate',
                'quantity',
                'pcs',
                'itemAmount',
                'categoryCode',
                'categoryDesc',
                'brandDesc',
                'itemDesc',
                'productDesc',
                'size',
                'thickness',
                'otherInfo',
                'rateOn',
                'billingInfo',
                'itemWeight'
            ],
            where: {
                indentId
            },
            raw: true
        });
    }

    createNewSalesOrder = async (indentObj) => {
        const indentTransaction = await sequelize.transaction();
        let indent = indentObj;
        try {
            const indentInfo = await Indent.create(
                indent, {
                transaction: indentTransaction,
                returning: ['id']
            });

            const indentId = indentInfo.id;
            const indentStatus = indentInfo?.dataValues?.indentStatus;
            const soNumber = indentInfo?.dataValues?.soNumber;

            if (indent.items && indent.items.length) {
                for (let item of indent.items) {
                    const { IndentItemDiscounts: discounts, IndentItemCharges: charges, IndentItemCalculation: itemCalculation, ...indentItem } = item;
                    indentItem.indentId = indentId;
                    indentItem.createdDate = moment().local();
                    const indentItemInfo = await IndentItems.create(indentItem, { transaction: indentTransaction });
                    if (discounts && discounts.length) {
                        for (let discount of discounts) {
                            discount.indentItemId = indentItemInfo.id;
                        }
                        await IndentItemDiscount.bulkCreate(discounts, { transaction: indentTransaction });
                    }

                    if (charges && charges.length) {
                        for (let charge of charges) {
                            charge.indentItemId = indentItemInfo.id;
                        }
                        await IndentItemCharges.bulkCreate(charges, { transaction: indentTransaction });
                    }

                    if (itemCalculation && itemCalculation.length) {
                        for (let calculation of itemCalculation) {
                            calculation.indentItemUuid = indentItemInfo.id;
                            calculation.createdDate = moment().local();
                        }
                        await IndentItemCalculation.bulkCreate(itemCalculation, { transaction: indentTransaction });
                    }
                }
            }

            await indentTransaction.commit();
            return { indentId, soNumber, indentStatus };
        } catch (error) {
            logger.customError('IndentRepository', 'createIndent', error.message);
            await indentTransaction.rollback();
            throw error;
        }
    }

    async updateSalesOrderGreenply(indent, items, indentItemsRemoved) {
        const indentTransaction = await sequelize.transaction();
        try {
            const indentInfo = await Indent.findOne({
                attributes: [
                    'modifyTracker',
                    'modifiedData',
                    'indentStatus',
                    'soNumber',
                    'id',
                    'thirdPartyId',
                    'orderType',
                    'thirdPartyIndentNo',
                    'indentDate',
                    'ffIndentNo',
                ],
                where: {
                    id: indent.id
                },
                raw: true
            });
            let indentUpdate;
            if (indentInfo) {
                indentUpdate = await Indent.update({
                    isAdvance: indent.isAdvance,
                    paymentTerms: indent.paymentTerms,
                    paytCode: indent.paytCode,
                    totalPcs: indent.totalPcs,
                    totalQuantity: indent.totalQuantity,
                    totalWeight: indent.totalWeight,
                    weightUnit: indent.weightUnit,
                    brandDesc: indent.brandDesc,
                    productDesc: indent.productDesc,
                    itemDesc: indent.itemDesc,
                    itemCodes: indent.itemCodes,
                    indentStatus: indent.indentStatus,
                    indentBaseAmount: indent.indentBaseAmount,
                    indentFinalAmount: indent.indentFinalAmount,
                    roundOff: indent.roundOff,
                    totalGST: indent.totalGST,
                    gstPercentage: indent.gstPercentage,
                    totalTcs: indent.totalTcs,
                    tcsPercentage: indent.tcsPercentage,
                    totalDiscount: indent.totalDiscount,
                    indentAddress: indent.indentAddress,
                    remarks1: indent.remarks1,
                    remarks: indent.remarks,
                    freight: indent.freight,
                    dcCode: indent.dcCode,
                    requestedDeliveryDate: indent.requestedDeliveryDate,
                    updatedDate: moment().local(),
                    truckSize: indent.truckSize,
                    billingInfo: indent.billingInfo,
                    division: indent.division,
                    plant: indent.plant,
                    additionalInfo: indent.additionalInfo,
                    soNumber: indent.soNumber,
                    expectedDeliveryDate: indent.expectedDeliveryDate,
                    sgUuid: indent.sgUuid,
                    soUuid: indent.soUuid
                },
                    {
                        where: {
                            id: indent.id,
                            enterpriseUuid: indent.enterpriseUuid
                        },
                        returning: true,
                        transaction: indentTransaction
                    });

                if (indentUpdate) {
                    if (items && items.length) {
                        for (const item of items) {
                            const isxistingItem = await IndentItems.findOne({
                                attributes: [
                                    'id'
                                ],
                                where: {
                                    indentId: indent.id,
                                    itemCode: item.itemCode
                                },
                                raw: true
                            })

                            if (isxistingItem) {
                                const indentItemInfo = await IndentItems.update({
                                    rate: item.rate,
                                    quantity: item.quantity,
                                    pcs: item.pcs,
                                    categoryCode: item.categoryCode,
                                    categoryDesc: item.categoryDesc,
                                    itemAmount: item.itemAmount,
                                    discountAmount: item.discountAmount,
                                    gstAmount: item.gstAmount,
                                    gstPercentage: item.gstPercentage,
                                    tcsAmount: item.tcsAmount,
                                    tcsPercentage: item.tcsPercentage,
                                    itemWeight: item.itemWeight,
                                    billingInfo: item?.billingInfo,
                                    otherInfo: item?.otherInfo,
                                    updatedDate: moment().local()
                                }, {
                                    where: {
                                        id: isxistingItem.id,
                                    },
                                    returning: true,
                                    transaction: indentTransaction
                                });
                                if (item.IndentItemDiscounts) {
                                    for (let discount of item.IndentItemDiscounts) {
                                        discount.indentItemId = indentItemInfo[1][0].id
                                    }
                                    await IndentItemDiscount.destroy({
                                        where: {
                                            indentItemId: indentItemInfo[1][0].id
                                        }
                                    });
                                    await IndentItemDiscount.bulkCreate(item.IndentItemDiscounts, { transaction: indentTransaction });
                                }

                                if (item.IndentItemCharges) {
                                    for (let charges of item.IndentItemCharges) {
                                        charges.indentItemId = indentItemInfo[1][0].id
                                    }
                                    await IndentItemCharges.destroy({
                                        where: {
                                            indentItemId: indentItemInfo[1][0].id
                                        }
                                    });
                                    await IndentItemCharges.bulkCreate(item.IndentItemCharges, { transaction: indentTransaction });
                                }


                                if (item.IndentItemCalculation) {
                                    for (let itemCalculation of item.IndentItemCalculation) {
                                        itemCalculation.indentItemUuid = indentItemInfo[1][0].id;
                                        itemCalculation.createdDate = moment().local();
                                    }
                                    await IndentItemCalculation.destroy({
                                        where: {
                                            indentItemUuid: indentItemInfo[1][0].id
                                        }
                                    });
                                    await IndentItemCalculation.bulkCreate(item.IndentItemCalculation, { transaction: indentTransaction });
                                }
                            } else {
                                const { IndentItemDiscounts: discounts, IndentItemCharges: charges, IndentItemCalculation: itemCalculation, ...indentItem } = item;
                                indentItem.indentId = indent.id;
                                indentItem.createdDate = moment().local();
                                const itemInfo = await IndentItems.create(indentItem, { transaction: indentTransaction })
                                if (discounts && discounts.length) {
                                    for (let discount of discounts) {
                                        discount.indentItemId = itemInfo.id;
                                    }
                                    await IndentItemDiscount.bulkCreate(discounts, { transaction: indentTransaction });
                                }

                                if (charges && charges.length) {
                                    for (let charge of charges) {
                                        charge.indentItemId = itemInfo.id;
                                    }
                                    await IndentItemCharges.bulkCreate(charges, { transaction: indentTransaction });
                                }



                                if (itemCalculation && itemCalculation.length) {
                                    for (let calculation of itemCalculation) {
                                        calculation.indentItemUuid = itemInfo.id;
                                        calculation.createdDate = moment().local();
                                    }
                                    await IndentItemCalculation.bulkCreate(itemCalculation, { transaction: indentTransaction });
                                }
                            }
                        }
                    } else {
                        throw new Error('Atleast one line item needs to be present in an indent')
                    }

                    if (indentItemsRemoved && indentItemsRemoved.length) {
                        for (let item of indentItemsRemoved) {
                            const indentItemToDelete = await IndentItems.findOne({
                                attributes: [
                                    'id'
                                ],
                                where: {
                                    itemCode: item.itemCode,
                                    indentId: indent.id
                                },
                                raw: true
                            });
                            if (indentItemToDelete) {
                                await IndentItemCharges.destroy({
                                    where: {
                                        indentItemId: indentItemToDelete.id
                                    }
                                });
                                await IndentItemDiscount.destroy({
                                    where: {
                                        indentItemId: indentItemToDelete.id
                                    }
                                });
                                await IndentItemCalculation.destroy({
                                    where: {
                                        indentItemUuid: indentItemToDelete.id
                                    }
                                });
                                await IndentItems.destroy({
                                    where: {
                                        id: indentItemToDelete.id,
                                    },
                                    transaction: indentTransaction
                                });
                            }
                        }
                    }
                }

                await indentTransaction.commit();

                const indentId = indentUpdate[1][0].dataValues.id;
                const indentStatus = indentUpdate[1][0].dataValues.indentStatus;
                const soNumber = indentUpdate[1][0].dataValues.soNumber;

                return { indentId, indentStatus, soNumber };
            } else {
                throw new Error(`Indent not found : ${indent.indentId}`);
            }
        } catch (error) {
            logger.customError('IndentRepository', 'updateIndent', error.message);
            await indentTransaction.rollback();
            throw error;
        }
    }

    async updateSalesOrderKajaria(indent, items, indentItemsRemoved) {
        const indentTransaction = await sequelize.transaction();
        try {
            const indentInfo = await Indent.findOne({
                attributes: [
                    'modifyTracker',
                    'modifiedData',
                    'indentStatus',
                    'soNumber',
                    'id',
                    'thirdPartyId',
                    'orderType',
                    'thirdPartyIndentNo',
                    'indentDate',
                    'ffIndentNo',
                ],
                where: {
                    id: indent.id
                },
                raw: true
            });
            let indentUpdate;
            if (indentInfo) {
                indentUpdate = await Indent.update({
                    isAdvance: indent.isAdvance,
                    paymentTerms: indent.paymentTerms,
                    paytCode: indent.paytCode,
                    totalPcs: indent.totalPcs,
                    totalQuantity: indent.totalQuantity,
                    totalWeight: indent.totalWeight,
                    weightUnit: indent.weightUnit,
                    brandDesc: indent.brandDesc,
                    productDesc: indent.productDesc,
                    itemDesc: indent.itemDesc,
                    itemCodes: indent.itemCodes,
                    indentStatus: indent.indentStatus,
                    indentBaseAmount: indent.indentBaseAmount,
                    indentFinalAmount: indent.indentFinalAmount,
                    roundOff: indent.roundOff,
                    totalGST: indent.totalGST,
                    gstPercentage: indent.gstPercentage,
                    totalTcs: indent.totalTcs,
                    tcsPercentage: indent.tcsPercentage,
                    totalDiscount: indent.totalDiscount,
                    indentAddress: indent.indentAddress,
                    remarks1: indent.remarks1,
                    remarks: indent.remarks,
                    freight: indent.freight,
                    dcCode: indent.dcCode,
                    requestedDeliveryDate: indent.requestedDeliveryDate,
                    updatedDate: moment().local(),
                    truckSize: indent.truckSize,
                    billingInfo: indent.billingInfo,
                    division: indent.division,
                    plant: indent.plant,
                    additionalInfo: indent.additionalInfo,
                    soNumber: indent.soNumber,
                    expectedDeliveryDate: indent.expectedDeliveryDate,
                    sgUuid: indent.sgUuid,
                    soUuid: indent.soUuid
                },
                    {
                        where: {
                            id: indent.id,
                            enterpriseUuid: indent.enterpriseUuid
                        },
                        returning: true,
                        transaction: indentTransaction
                    });

                if (indentUpdate) {
                    if (items && items.length) {
                        for (const item of items) {
                            const isxistingItem = await IndentItems.findOne({
                                attributes: [
                                    'id'
                                ],
                                where: {
                                    indentId: indent.id,
                                    itemCode: item.itemCode,
                                    otherInfo: {
                                        qualityCode: item.otherInfo.qualityCode,
                                    }
                                },
                                raw: true
                            })

                            if (isxistingItem) {
                                const indentItemInfo = await IndentItems.update({
                                    rate: item.rate,
                                    quantity: item.quantity,
                                    pcs: item.pcs,
                                    categoryCode: item.categoryCode,
                                    categoryDesc: item.categoryDesc,
                                    itemAmount: item.itemAmount,
                                    discountAmount: item.discountAmount,
                                    gstAmount: item.gstAmount,
                                    gstPercentage: item.gstPercentage,
                                    tcsAmount: item.tcsAmount,
                                    tcsPercentage: item.tcsPercentage,
                                    itemWeight: item.itemWeight,
                                    billingInfo: item?.billingInfo,
                                    otherInfo: item?.otherInfo,
                                    updatedDate: moment().local()
                                }, {
                                    where: {
                                        id: isxistingItem.id,
                                    },
                                    returning: true,
                                    transaction: indentTransaction
                                });
                                if (item.IndentItemDiscounts) {
                                    for (let discount of item.IndentItemDiscounts) {
                                        discount.indentItemId = indentItemInfo[1][0].id
                                    }
                                    await IndentItemDiscount.destroy({
                                        where: {
                                            indentItemId: indentItemInfo[1][0].id
                                        }
                                    });
                                    await IndentItemDiscount.bulkCreate(item.IndentItemDiscounts, { transaction: indentTransaction });
                                }

                                if (item.IndentItemCharges) {
                                    for (let charges of item.IndentItemCharges) {
                                        charges.indentItemId = indentItemInfo[1][0].id
                                    }
                                    await IndentItemCharges.destroy({
                                        where: {
                                            indentItemId: indentItemInfo[1][0].id
                                        }
                                    });
                                    await IndentItemCharges.bulkCreate(item.IndentItemCharges, { transaction: indentTransaction });
                                }


                                if (item.IndentItemCalculation) {
                                    for (let itemCalculation of item.IndentItemCalculation) {
                                        itemCalculation.indentItemUuid = indentItemInfo[1][0].id;
                                        itemCalculation.createdDate = moment().local();
                                    }
                                    await IndentItemCalculation.destroy({
                                        where: {
                                            indentItemUuid: indentItemInfo[1][0].id
                                        }
                                    });
                                    await IndentItemCalculation.bulkCreate(item.IndentItemCalculation, { transaction: indentTransaction });
                                }
                            } else {
                                const { IndentItemDiscounts: discounts, IndentItemCharges: charges, IndentItemCalculation: itemCalculation, ...indentItem } = item;
                                indentItem.indentId = indent.id;
                                indentItem.createdDate = moment().local();
                                const itemInfo = await IndentItems.create(indentItem, { transaction: indentTransaction })
                                if (discounts && discounts.length) {
                                    for (let discount of discounts) {
                                        discount.indentItemId = itemInfo.id;
                                    }
                                    await IndentItemDiscount.bulkCreate(discounts, { transaction: indentTransaction });
                                }

                                if (charges && charges.length) {
                                    for (let charge of charges) {
                                        charge.indentItemId = itemInfo.id;
                                    }
                                    await IndentItemCharges.bulkCreate(charges, { transaction: indentTransaction });
                                }



                                if (itemCalculation && itemCalculation.length) {
                                    for (let calculation of itemCalculation) {
                                        calculation.indentItemUuid = itemInfo.id;
                                        calculation.createdDate = moment().local();
                                    }
                                    await IndentItemCalculation.bulkCreate(itemCalculation, { transaction: indentTransaction });
                                }
                            }
                        }
                    } else if (indent.indentStatus == 'SAP_DIRECT_DELETED' && items && !items.length) {
                        const itemsToDelete = await IndentItems.findAll({
                            attributes: [
                                'id'
                            ],
                            where: {
                                indentId: indent.id,
                            },
                            raw: true
                        });

                        for (let item of itemsToDelete) {
                            await IndentItemCharges.destroy({
                                where: {
                                    indentItemId: item.id
                                }
                            });
                            await IndentItemDiscount.destroy({
                                where: {
                                    indentItemId: item.id
                                }
                            });
                            await IndentItemCalculation.destroy({
                                where: {
                                    indentItemUuid: item.id
                                }
                            });
                            await IndentItems.destroy({
                                where: {
                                    id: item.id,
                                },
                                transaction: indentTransaction
                            });
                        }

                    } else {
                        throw new Error('Atleast one line item needs to be present in an indent')
                    }

                    if (indentItemsRemoved && indentItemsRemoved.length) {
                        for (let item of indentItemsRemoved) {
                            const indentItemToDelete = await IndentItems.findOne({
                                attributes: [
                                    'id'
                                ],
                                where: {
                                    itemCode: item.itemCode,
                                    indentId: indent.id,
                                    otherInfo: {
                                        qualityCode: item.otherInfo.qualityCode,
                                    }
                                },
                                raw: true
                            });
                            if (indentItemToDelete) {
                                await IndentItemCharges.destroy({
                                    where: {
                                        indentItemId: indentItemToDelete.id
                                    }
                                });
                                await IndentItemDiscount.destroy({
                                    where: {
                                        indentItemId: indentItemToDelete.id
                                    }
                                });
                                await IndentItemCalculation.destroy({
                                    where: {
                                        indentItemUuid: indentItemToDelete.id
                                    }
                                });
                                await IndentItems.destroy({
                                    where: {
                                        id: indentItemToDelete.id,
                                    },
                                    transaction: indentTransaction
                                });
                            }
                        }
                    }
                }

                await indentTransaction.commit();

                const indentId = indentUpdate[1][0].dataValues.id;
                const indentStatus = indentUpdate[1][0].dataValues.indentStatus;
                const soNumber = indentUpdate[1][0].dataValues.soNumber;

                return { indentId, indentStatus, soNumber };
            } else {
                throw new Error(`Indent not found : ${indent.indentId}`);
            }
        } catch (error) {
            logger.customError('IndentRepository', 'updateIndent', error.message);
            await indentTransaction.rollback();
            throw error;
        }
    }

    updateIndentSalesOrderDetails = async (enterpriseUuid, indentUuid, indentUpdateData) => {
        const indent = await Indent.update(indentUpdateData, {
            where: {
                enterpriseUuid: enterpriseUuid,
                id: indentUuid
            },
            returning: true
        });
        const indentId = indent[1][0]?.dataValues?.id;
        const indentStatus = indent[1][0]?.dataValues?.indentStatus;
        return { indentId, indentStatus, };
    }

    getInoviceDataFromSalesOrderInvoiceMappingTable = async (enterpriseUuid, soNumber) => {
        return await SalesOrderInvoiceMapping.findAll({
            where: {
                enterpriseUuid: enterpriseUuid,
                salesOrderNumber: soNumber
            },
            raw: true
        })
    }

    getInvoiceDetailsFromDocument = async (enterpriseUuid, soNumber) => {
        return await Document.findAll({
            attributes: [
                'docDate',
                'docType',
                'docCode',
                'soNumber'
            ],
            where: {
                enterpriseUuid: enterpriseUuid,
                soNumber: soNumber
            },
            raw: true
        })
    }

    addSales = async (enterpriseUuid, salesData) => {
        for (let row of salesData) {
            row.enterpriseUuid = enterpriseUuid;
            if (row?.legalEntityCode) row.legalEntityUuid = literal(`( select id from fundflo_admin.legal_entity where enterprise_uuid = '${enterpriseUuid}' and entity_code = '${row?.legalEntityCode}'  )`);
            if (row?.userCode) row.userUuid = literal(`(select id from fundflo_admin.users where enterprise_uuid = '${enterpriseUuid}' and user_code = '${row.userCode}' )`);
            if (row?.divisionCode) row.divisionUuid = literal(`(select id from fundflo_admin.division where enterprise_uuid = '${enterpriseUuid}' and division_code = '${row.divisionCode}' )`);

            let data = await SalesData.findOne({
                where: {
                    enterpriseUuid,
                    ...(row?.legalEntityCode ? { legalEntityCode: row?.legalEntityCode } : {}),
                    ...(row?.userCode ? { userCode: row?.userCode } : {}),
                    ...(row?.verticalDivisionDesc ? { verticalDivisionDesc: row?.verticalDivisionDesc } : {}),
                    ...(row?.brandAndProductDesc ? { brandAndProductDesc: row?.brandAndProductDesc } : {})
                },
                raw: true
            });
            if (data) {
                row.updatedDate = new Date();
                await SalesData.update(row, {
                    where: {
                        id: data.id
                    }
                });
            } else {
                row.createdDate = new Date();
                await SalesData.create(row);
            }
        }
    }

    addLastSync = async ( enterpriseUuid, updatedDate, moduleName, entityName, syncSource ) => {
        try {
            return await SyncLogs.create({
                enterpriseUuid,
                moduleName,
                entityName,
                syncStartTime: updatedDate,
                syncEndTime: updatedDate,
                syncStatus: 'SUCCESS',
                syncSource,
                isNotified: false,
                createdDate: new Date(),  
                updatedDate: new Date()
            })
        } catch (error) {
            console.log('IndentRepository', 'addLastSync', `error in creating sync data for sales vertical: ${error?.message}`);
        }

    }

    deleteAllSalesData = async (enterpriseUuid) => {
        await SalesData.destroy({
            where: {
                enterpriseUuid
            }
        })
    }

    getRddValue = async (enterpriseUuid, legalEntityUuid, fieldValue, fieldName) => {
        return await RddValue.findOne({
            raw: true,
            where: {
                enterpriseUuid,
                ...(legalEntityUuid ? { legalEntityUuid } : {}),
                ...((fieldValue != null && fieldValue != undefined) ? { fieldValue } : {}),
                ...((fieldName != null && fieldName != undefined) ? { fieldName } : {})
            }
        })
    }

    getStateDetails = async (enterpriseUuid, legalEntityUuid, userCode) => {
        let data = await sequelize.query(`
            select state_code from fundflo_admin.states s 
            where state_code in (
                select distinct(state_code) from fundflo_admin.user_enterprise_config uec 
                left join fundflo_admin.users u on u.id = uec.user_uuid 
                where u.enterprise_uuid = '${enterpriseUuid}' and u.legal_entity_uuid = '${legalEntityUuid}'
                and user_code = '${userCode}'
            )
        `);
        return data[0][0]?.state_code;
    }

    getUserDetails = async (enterpriseUuid, legalEntityUuid, userCode) => {
        let data = await sequelize.query(`
            select id from fundflo_admin.users 
            where enterprise_uuid = '${enterpriseUuid}' 
            and legal_entity_uuid = '${legalEntityUuid}' 
            and user_code = '${userCode}'
        `);
        return data[0][0]?.id;
    }

    getUserMappingData = async (userUuid) => {
        let data = await sequelize.query(`
            select array_agg( distinct(so.sales_office_code) ) as sales_office_code, 
            array_agg( distinct(sg.sales_group_code) ) as sales_group_code
            from fundflo_mapping.users_enterprise_tags uet
            left join fundflo_admin.sales_office so on  so.id = any(uet.sales_office) 
            left join fundflo_admin.sales_group sg on sg.id = ANY(uet.sales_group)
            where user_uuid = '${userUuid}'
        `);
        return data[0][0];
    }

    fetchExclusiveProducts = async (enterpriseUuid, legalEntityUuid, filterObject) => {
        let division = filterObject?.divisionCode;
        let plant = filterObject?.plantCode;
        let userCode = filterObject?.userCode;

        let user = await this.getUserDetails(enterpriseUuid, legalEntityUuid, userCode);
        let stateCode = await this.getStateDetails(enterpriseUuid, legalEntityUuid, userCode);
        let soCode = filterObject.soCode ?? (user ? (await this.getUserMappingData(user))?.sales_office_code[0] : null);
        let sgCode = filterObject.sgcode ?? (user ? (await this.getUserMappingData(user))?.sales_group_code[0] : null);

        let material = filterObject?.material;
        let materialSize = filterObject?.materialSize;
        let categoryDesc = filterObject?.categoryDesc;
        let gradeDesc = filterObject?.gradeDesc;
        let verticalDivisionDesc = filterObject?.verticalDivisionDesc;
        let brandAndProductDescDesc = filterObject?.brandAndProductDescDesc;
        let thicknessDesc = filterObject?.thicknessDesc;

        return await ExclusiveProducts.findAndCountAll({
            where: {
                ...(division ? {
                    divisionCode: { [Op.or]: [{ [Op.eq]: division }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                ...(plant ? {
                    plantCode: { [Op.or]: [{ [Op.eq]: plant }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                ...(stateCode ? {
                    ffStateCode: { [Op.or]: [{ [Op.eq]: stateCode }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                ...(user ? {
                    userCode: { [Op.or]: [{ [Op.eq]: userCode }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                ...(soCode ? {
                    salesOfficeCode: { [Op.or]: [{ [Op.eq]: soCode }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                ...(sgCode ? {
                    salesGroupCode: { [Op.or]: [{ [Op.eq]: sgCode }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                ...(material ? {
                    materialCheck: { [Op.or]: [{ [Op.eq]: material }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                ...(materialSize ? {
                    materialSizeCheck: { [Op.or]: [{ [Op.eq]: materialSize }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                ...(categoryDesc ? {
                    categoryDescCheck: { [Op.or]: [{ [Op.eq]: categoryDesc }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                ...(gradeDesc ? {
                    gradeDescCheck: { [Op.or]: [{ [Op.eq]: gradeDesc }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                ...(verticalDivisionDesc ? {
                    verticalDivisionDescCheck: { [Op.or]: [{ [Op.eq]: verticalDivisionDesc }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                ...(brandAndProductDescDesc ? {
                    brandAndProductDescCheck: { [Op.or]: [{ [Op.eq]: brandAndProductDescDesc }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                ...(thicknessDesc ? {
                    thicknessDescCheck: { [Op.or]: [{ [Op.eq]: thicknessDesc }, { [Op.eq]: null }, { [Op.eq]: '' }] }
                } : {}),
                enterpriseUuid,
                legalEntityUuid
            },
            raw: true,
            ...(filterObject.pageSize ? { limit: Number(pageSize) } : {}),
            ...(filterObject.pageNo ? { limit: Number(pageSize) * Number(pageNo) } : {})
        });

    }

    createExclusiveProducts = async (enterpriseUuid, legalEntityUuid, createObject) => {
        createObject.createdDate = new Date();
        createObject.enterpriseUuid = enterpriseUuid;
        createObject.legalEntityUuid = legalEntityUuid;
        createObject.enterpriseId = literal(`( select enterprise_id from fundflo_admin.enterprise where id = '${enterpriseUuid}' )`);
        return await ExclusiveProducts.create(createObject);
    }

    updateExclusiveProducts = async (enterpriseUuid, legalEntityUuid, id, updateObject) => {
        updateObject.updateDate = new Date();
        return await ExclusiveProducts.update(updateObject, {
            where: {
                id,
                enterpriseUuid,
                legalEntityUuid
            }
        })
    }

    deleteExclusiveProducts = async (enterpriseUuid, legalEntityUuid, id) => {
        return await ExclusiveProducts.destroy({
            where: {
                id,
                enterpriseUuid,
                legalEntityUuid
            }
        })
    }

    getReportFilters = async (enterpriseUuid, legalEntityUuid, type, tags, search) => {
        let createdFromArr = undefined, createdByArr = undefined;
        if (type == 'createdFrom') {
            createdFromArr = await sequelize.query(`(
                select distinct(created_from) as createdFrom from fundflo_indent.indents i where i.enterprise_uuid='${enterpriseUuid}'
            )`);
        }
        if (type == 'createdBy') {
            createdByArr = await sequelize.query(`
                select distinct(created_by_text) from fundflo_indent.indents i where i.enterprise_uuid='${enterpriseUuid}' and i.legal_entity_uuid='${legalEntityUuid}'
            `, {
                bind: {
                    enterpriseUuid,
                    legalEntityUuid,
                    users: tags.users,
                    search: `%${search}%`
                }
            });
        }

        return {
            createdBy: createdByArr ? createdByArr[0] : undefined,
            createdFrom: createdFromArr ? createdFromArr[0] : undefined
        }

    }

    generateReport = async (enterpriseUuid, legalEntityUuid, filterObj) => {
        let fromDate = filterObj?.fromDate;
        let toDate = filterObj?.toDate;
        let userUuids = filterObj?.userUuids;
        let stateCodes = filterObj?.stateCodes;
        let divisionUuids = filterObj?.divisionUuids;
        let createdByTexts = filterObj?.createdByTexts;
        let pageNo = filterObj?.pageNo;
        let pageSize = filterObj?.pageSize;

        if (!fromDate || !toDate) throw new Error(' fromDate and toDate is mandatory');


        let reportData = await sequelize.query(`
            select 
            lu.login_fullname,
            lu.login_mobile,
            u.user_code,
            u.user_type,
            lu.session_created_on as last_login,
            s.state_name,
            s.custom_wise_seqno as state_code, 
            d.division_code,
            (
                select  count(i.*) as indent_count from fundflo_indent.indents i
                where i.created_date::date between $fromDate and $toDate
                and lower(i.indent_status) not in ('draft')
                and i.enterprise_uuid = u.enterprise_uuid
                and i.division = d.id
                and i.user_uuid = u.id
                and i.created_by = u.id
            ) as total_indents_created_by_own,
            (
                select  count(i.*) as indent_count from fundflo_indent.indents i
                where i.created_date::date between $fromDate and $toDate
                and lower(i.indent_status) not in ('draft')
                and i.enterprise_uuid = u.enterprise_uuid
                and i.division = d.id
                and i.user_uuid = u.id
                and i.created_by != u.id
                ${createdByTexts.length > 0 ? ' and i.created_by_text = ANY($createdByTexts) ' : ''}
            ) as total_indents_created_by_others,
            (
                select  count(i.*) as indent_count from fundflo_indent.indents i
                where i.created_date::date between $fromDate and $toDate
                and lower(i.indent_status) not in ('draft')
                and i.enterprise_uuid = u.enterprise_uuid
                and i.division = d.id
                and i.user_uuid = u.id
                ${createdByTexts.length > 0 ? ' and i.created_by_text = ANY($createdByTexts) ' : ''}
            ) as total_indents
            from fundflo_admin.login_users lu
            left join fundflo_admin.users u on u.id = lu.user_uuid
            left join fundflo_admin.user_enterprise_config uec on uec.user_uuid = u.id
            left join fundflo_admin.states s  on s.state_code = uec.state_code
            left join
            ( 
                select 
                user_uuid, 
                division_uuid,
                sales_office_uuid,
                sales_group_uuid, 
                uet.additional_plain_text_data
                from fundflo_mapping.operational_relationships uet
                left join fundflo_mapping.objects_enterprise_tags oet on uet.division_uuid = oet.object_uuid
                left join fundflo_mapping.objects_enterprise_tags oet2 on uet.sales_office_uuid = oet2.object_uuid
                where user_uuid in 
                (
                    select id from fundflo_admin.users u
                    where user_type = 'distributor' and enterprise_uuid = $enterpriseUuid
                    ${userUuids.length > 0 ? ' and id = ANY($userUuids) ' : ''}
                )
            ) t on t.user_uuid = lu.user_uuid
            left join fundflo_admin.division d on d.id = t.division_uuid and d.enterprise_uuid=u.enterprise_uuid
            where u.enterprise_uuid = $enterpriseUuid
            and u.is_active=true and lu.is_active=true
            and u.user_type = 'distributor'
            ${userUuids.length > 0 ? ' and u.id = ANY($userUuids) ' : ''}
            ${stateCodes.length > 0 ? ' and s.custom_wise_seqno = ANY($stateCodes) ' : ''}
            ${divisionUuids.length > 0 ? ' and d.id = ANY($divisionUuids) ' : ''}
            order by total_indents_created_by_own desc,user_code desc,last_login desc
            ${pageSize ? ' limit $limit ' : ''}
            ${pageNo ? ' offset $offset ' : ''}
        `, {
            bind: {
                enterpriseUuid,
                legalEntityUuid,
                fromDate,
                toDate,
                userUuids,
                stateCodes,
                divisionUuids,
                createdByTexts,
                limit: Number(pageSize),
                offset: Number(pageNo) * Number(pageSize)
            }
        });
        return reportData[0];
    }


    getExculdedDiscounts = async (enterpriseUuid, legalEntityUuid, divUuid, plantUuid, dcCode) => {
        return await ExcludedDiscount.findOne({
            attributes: [
                'code',
            ],
            where: {
                enterpriseUuid: enterpriseUuid,
                legalEntityUuid: legalEntityUuid,
                ...(plantUuid ? { plantUuid: plantUuid } : { plantUuid: null }),
                ...(divUuid ? { divUuid: divUuid } : { divUuid: null }),
                ...(dcCode ? { dcCode: dcCode } : { dcCode: null })
            },
            raw: true
        });
    }

}

module.exports = IndentRepository;