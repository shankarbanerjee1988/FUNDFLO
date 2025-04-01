const IndentExternalRepository = require('./indent.external.repository');
const repository = require('./indent.repository');
const moment = require('moment');
const ErpController = require('../../V1/integration/indent/erp/erp.controller');
const _ = require('lodash');
const { sequelize } = require('../../config/db/db');
const BusinessService = require('../../V1/admin/business/business.service');

class IndentExternalService {

    #indentExternalRepository = new IndentExternalRepository();
    #repository = new repository();
    #erpController = new ErpController();
    #businessService = new BusinessService();

    _createOrder = async (enterpriseUuid, requestBody) => {
        let indentObj = {
            enterpriseUuid
        };

        this.checkMandatoryFields(requestBody);
        this.processIndentAddress(requestBody, indentObj);
        await this.processBusinessObject(indentObj.enterpriseUuid, requestBody, indentObj);
        await this.processTemplateAndOrderType(requestBody, indentObj);
        await this.processExtraDetails(requestBody, indentObj);
        await this.checkBusinessMapping(indentObj);

        let orderItems = requestBody.orderItems ?? [];
        let processedIndentItems =[]
        for (let row of orderItems) {
            indentObj.totalQuantity = (indentObj.totalQuantity??0)+Number(row.quantity);
            indentObj.totalPcs = (indentObj.totalPcs??0)+Number(row.pcs);
            let indentItemObj = await this.processIndentItems(row, indentObj, requestBody);
            processedIndentItems.push(indentItemObj);
        }

        indentObj.indentFinalAmount = (Number(indentObj.indentBaseAmount) > 0 ? Number(indentObj.indentBaseAmount) : 0) - (Number(indentObj.totalDiscount) > 0 ? Number(indentObj.totalDiscount) : 0);
        indentObj.indentFinalAmount = (Number(indentObj.indentFinalAmount) + (Number(indentObj.billingInfo.handlingCharges) > 0 ? Number(indentObj.billingInfo.handlingCharges) : 0));
        indentObj.indentFinalAmount = Number(Number(indentObj.indentFinalAmount).toFixed(2));

        this.processIndentTax( requestBody, indentObj );
        this.processIndentFinalAmountAndSummary( indentObj );

        return await this.upsertOrder( indentObj, processedIndentItems );

    }

    checkMandatoryFields = ( requestBody ) => {
        requestBody.orderType = 'O1';
        requestBody.orderStatus = 'SUBMITTED';
        let mandatoryFields = [ 'salesOrganization', 'freight', 'salesEmployeeCode', 'truckSize', 'paymentTerms', 'dcCode', 'orderDate', 'salesOfficeCode', 'salesGroupCode', 'plantCode', 'divisionCode', 'dealerCode', 'orderStatus', 'tpNo', 'paytCode'];
        let addressMandatoryFields = ['addrName', 'phoneNumber', 'addrLine1', 'addrState', 'city', 'pincode'];
        for(let field of mandatoryFields){
            if( !requestBody[field] ){ throw new Error(` ${field} is mandatory`); }
        }  
        if( !requestBody.address || !Array.isArray(requestBody.address) || requestBody.address.length<1 ) throw new Error(` address is mandatory and should be array`);
        for( let field of addressMandatoryFields){
            if( !requestBody?.address[0][field] ) throw new Error(`${field} is mandatory in address`);
        }
    }

    checkBusinessMapping = async ( indentObj ) => {
        let businessData = await this.#indentExternalRepository.getOperationalRelationData( indentObj.userUuid, indentObj.enterpriseUuid, indentObj.legalEntityUuid, indentObj.division );
        if( businessData.sales_office != indentObj.soUuid ) throw new Error(`salesOffice: ${indentObj.additionalInfo.salesOffice} is not mapped to user: ${indentObj.dealerCode}, division: ${indentObj.additionalInfo.division}, salesOrganization: ${indentObj.salesOrganization}`);
        if( businessData.sales_group != indentObj.sgUuid ) throw new Error(`salesGroup: ${indentObj.additionalInfo.salesGroup} is not mapped to user: ${indentObj.dealerCode}, division: ${indentObj.additionalInfo.division}, salesOrganization: ${indentObj.salesOrganization}`);
        let plantInfo = await this.#businessService._getObjects( indentObj.enterpriseUuid, indentObj.legalEntityUuid, indentObj.userUuid, {
            division: [indentObj.division],
            users: [ indentObj.userUuid ],
            legal_entity: [ indentObj.legalEntityUuid ],
        }, 'plant', {
            division: indentObj.division,
            sales_group: indentObj.soUuid,
            sales_office: indentObj.sgUuid,
        });
        let plants = [];
        for(let plant of plantInfo.data){
            plants.push(plant?.dataValues?.id);
        }
        if( !plants.includes(indentObj.plant) ) throw new Error(` plant: ${ indentObj.additionalInfo.plant } is not tagged to the sales organization: ${ indentObj.salesOrganization}, division: ${indentObj.additionalInfo.division}, sales office: ${indentObj.additionalInfo.salesOffice}, sales group: ${indentObj.additionalInfo.salesGroup} `);
    }

    processIndentAddress = (requestBody, indentObj) => {
        let billToAddress = {}, shiptoAddress = {};
        if (requestBody.address.length > 0 && requestBody.address[0].addrType == 'SHIP_TO') {
            shiptoAddress = requestBody.address[0];
        }
        if (requestBody.address.length > 1 && requestBody.address[1].addrType == 'BILL_TO') {
            billToAddress = requestBody.address[0];
        }
        indentObj.indentAddress = {
            "addrtype": shiptoAddress.addrType,
            "addrname": shiptoAddress.addrName,
            "addrline1": shiptoAddress.addrLine1,
            "addrline2": shiptoAddress.addrLine2,
            "addrline3": shiptoAddress.addrLine3,
            "addrtext": shiptoAddress.addrText,
            "addrstate": shiptoAddress.addrState,
            "city": shiptoAddress.city,
            "pincode": shiptoAddress.pincode,
            "phonenumber": shiptoAddress.phoneNumber,
            "isfavorite": shiptoAddress.isfavorite,
            "ship_to_code": shiptoAddress.shipToCode,
            "gstNumber": shiptoAddress.gstNumber
        };
    }

    processBusinessObject = async (enterpriseUuid, requestBody, indentObj) => {
        indentObj.userCode = requestBody.dealerCode;
        indentObj.dealerCode = requestBody.dealerCode;
        indentObj.userFullname = requestBody.dealerCode ? ((await this.#indentExternalRepository.fetchUserDetails(requestBody.dealerCode, enterpriseUuid))[0][0])?.user_fullname : NULL;
        indentObj.userUuid = requestBody.dealerCode ? ((await this.#indentExternalRepository.fetchUserDetails(requestBody.dealerCode, enterpriseUuid))[0][0])?.id : NULL;
        indentObj.legalEntityUuid = requestBody.salesOrganization ? ((await this.#indentExternalRepository.fetchlegalEntityDetails(requestBody.salesOrganization, enterpriseUuid))[0][0])?.id : NULL;
        indentObj.division = requestBody.divisionCode ? ((await this.#indentExternalRepository.fetchDivisionDetails(requestBody.divisionCode, enterpriseUuid))[0][0])?.id : NULL;
        indentObj.plant = requestBody.plantCode ? ((await this.#indentExternalRepository.fetchPlantDetails(requestBody.plantCode, enterpriseUuid))[0][0])?.id : NULL;
        indentObj.soUuid = requestBody.salesOfficeCode ? ((await this.#indentExternalRepository.fetchSalesOfficeDetails(requestBody.salesOfficeCode, enterpriseUuid))[0][0])?.id : NULL;
        indentObj.sgUuid = requestBody.salesGroupCode ? ((await this.#indentExternalRepository.fetchSalesGroupDetails(requestBody.salesGroupCode, enterpriseUuid))[0][0])?.id : NULL;
        indentObj.dcCode = requestBody.dcCode;
        if(!indentObj.legalEntityUuid)throw new Error(`Invalid salesOrganization : ${requestBody.salesOrganization}`);
        if(!indentObj.userUuid)throw new Error(`Invalid dealerCode code : ${requestBody.dealerCode}`);
        if(!indentObj.division)throw new Error(`Invalid division code : ${requestBody.divisionCode}`);
        if(!indentObj.soUuid)throw new Error(`Invalid sales office code : ${requestBody.salesOfficeCode}`);
        if(!indentObj.sgUuid)throw new Error(`Invalid sales group code : ${requestBody.salesGroupCode}`);
    }

    processTemplateAndOrderType = async (requestBody, indentObj) => {
        requestBody.template = await this.#indentExternalRepository.getIndentTemplate(indentObj.enterpriseUuid, indentObj.legalEntityUuid);
        indentObj.orderType = requestBody.orderType;
        requestBody.enterpriseConfiguration = await this.#indentExternalRepository.getEnterpriseConfig(indentObj.enterpriseUuid, indentObj.legalEntityUuid, indentObj.orderType);
    }

    processExtraDetails = async (requestBody, indentObj) => {
        let incoTermLocation = requestBody?.incoTermLocation ?? (await this.#indentExternalRepository.findPlantDetailsByCode(indentObj.enterpriseUuid, requestBody.plantCode))?.incoTermLocation;
        indentObj.additionalInfo = {
            salesEmployee: (requestBody?.salesEmployeeCode ? requestBody.salesEmployeeCode : requestBody?.employeeCode ),
            division: (requestBody?.divisionCode ? requestBody?.divisionCode : null),
            plant: (requestBody?.plantCode ? requestBody?.plantCode : null),
            salesOffice: (requestBody?.salesOfficeCode ? requestBody?.salesOfficeCode : null),
            salesGroup: (requestBody?.salesGroupCode ? requestBody?.salesGroupCode : ''),
            incoTermLocation: incoTermLocation
        }
        indentObj.thirdPartyIndentNo = requestBody.tpNo;
        indentObj.thirdPartyId = requestBody.tpUuid;
        indentObj.indentStatus = requestBody.orderStatus ?? 'SUBMITTED';
        indentObj.createdDate = requestBody?.orderDate;
        indentObj.plantOrderType = requestBody.orderType;
        indentObj.indentDate = requestBody?.orderDate; 
        indentObj.requestedDeliveryDate = requestBody?.requestedDeliveryDate ? moment(requestBody?.requestedDeliveryDate).format('YYYY-MM-DD') : null;
        indentObj.createdFrom = indentObj.createdFrom ?? 'LSQ';
        indentObj.createdByText = indentObj.createdByText ?? 'LSQ';
        indentObj.truckSize= requestBody.truckSize;
        indentObj.paytCode= requestBody.paytCode;
        indentObj.paymentTerms= requestBody.paymentTerms;
        indentObj.freight = requestBody.freight;
        indentObj.remarks = requestBody.remarks;
        indentObj.remarks1 = requestBody.remarks1;
        indentObj.salesOrganization = requestBody.salesOrganization;
    }

    processIndentItems = async (row, indentObj, requestBody) => {
        let indentItemObj = {};
        const productDetails = await this.#indentExternalRepository.getItemDetails(indentObj.enterpriseUuid, row.materialCode, row?.qualityCode, null, null);
        if( !productDetails ) throw new Error(`material/product: ${row.materialCode} in invalid`);
        this.processProductDetails(productDetails, row, indentItemObj);
        await this.processQuantity(row, requestBody, indentObj, indentItemObj); //hard coded things are there
        this.processRate(row, indentItemObj, indentObj); //hard coded things are there
        this.processItemWeight(requestBody, productDetails, indentItemObj);
        await this.processItemDiscount(row, indentItemObj, indentObj);
        await this.processHandlingCharges(row, indentItemObj, indentObj);
        this.processBillingInfoAndIndentData( indentItemObj.billingInfo, indentItemObj, indentObj );
        return  indentItemObj;
    }

    processProductDetails = async (productDetails, row, indentItemObj) => {
        indentItemObj.productCode = productDetails?.productCode;
        indentItemObj.productDesc = productDetails?.productDesc;
        indentItemObj.brandCode = productDetails?.brandCode;
        indentItemObj.brandDesc = productDetails?.brandDesc;
        indentItemObj.categoryCode = productDetails?.categoryCode;
        indentItemObj.categoryDesc = productDetails?.categoryDesc;
        indentItemObj.itemDesc = productDetails?.itemDesc;
        indentItemObj.itemCode = productDetails?.itemCode;
        indentItemObj.size = productDetails?.size;
        indentItemObj.pcs = Number(row.quantity);
        indentItemObj.otherInfo = {
            itemDesc: productDetails.itemCode,
            itemDesc: productDetails.itemDesc,
            itemGroup: productDetails.itemGroup,
            productCode: productDetails.productCode,
            productDesc: productDetails.productDesc,
            brandCode: productDetails.brandCode,
            brandDesc: productDetails.brandDesc,
            categoryCode: productDetails.categoryCode,
            categoryDesc: productDetails.categoryDesc,
            size: productDetails.size,
            thickness: productDetails.thickness,
            itemWeight: productDetails.itemWeight,
            weightUnit: productDetails.weightUnit,
            topDesign: productDetails.topDesign,
            bottomDesign: productDetails.bottomDesign,
            finish: productDetails.finish,
            grade: productDetails.grade,
            gradeDesc: productDetails.gradeDesc,
            designDesc: productDetails.designDesc,
            qualityCode: productDetails.grade,
            quality: productDetails.gradeDesc,
            denominator: productDetails.denominator,
            numerator: productDetails.numerator,
            pcs: Number(row.quantity),
            orderUnit: row.saleUnit,
        }
    }

    processWithoutQuantity = async (requestBody, indentObj, indentItemObj) => {
        indentItemObj.quantity = indentItemObj.pcs;
        try {
            if (requestBody.enterpriseConfiguration.pcsQuantityConversion == 'sale_unit') {
                const itemPcs = Number(indentItemObj.pcs) >= 0 ? Number(indentItemObj.pcs) : 0;

                let reqObj = {
                    entityCode: requestBody.salesOrganization,
                    dealerCode: requestBody.dealerCode,
                    qualityCode: indentItemObj.otherInfo?.qualityCode,
                    divCode: requestBody.divisionCode,
                    salesOfficeCode: requestBody.salesOfficeCode,
                    itemCode: indentItemObj.itemCode ,
                    dcCode: requestBody.dcCode,
                    plantCode: requestBody.plantCode
                }

                reqObj['stateCustomCode'] = (await this.#repository.getStateCustomeCode(indentObj.enterpriseUuid, indentObj.legalEntityUuid, requestBody.dealerCode))?.stateCustomCode;

                let priceObj = await this.#erpController.getProductPricefunction(indentObj.enterpriseUuid, reqObj);
                if (priceObj) {
                    const tpResponse = priceObj.tpResponse;
                    if (tpResponse && Array.isArray(tpResponse.alt_units)) {
                        for (let unit of tpResponse.alt_units) {
                            if (tpResponse.bun == 'M2' && unit.alt_unit == 'BOX') {
                                const denominator = Number(unit.denominator);
                                const numerator = Number(unit.numerator);
                                const ratio = numerator / denominator;
                                indentItemObj.quantity = Number(Number(itemPcs) * Number(ratio)).toFixed(3);
                            } else if (tpResponse.bun == 'BOX' && unit.alt_unit == 'M2') {
                                const denominator = Number(unit.denominator);
                                const numerator = Number(unit.numerator);
                                const ratio = denominator / numerator;
                                indentItemObj.quantity = Number(Number(itemPcs) * Number(ratio)).toFixed(3);
                            }
                        }
                    }
                }

            } else {
                indentItemObj.quantity = indentItemObj.pcs;
            }
        } catch (error) {
            console.log("IndentExternalService", "processQuantity", error?.message);
        }
    }

    processQuantity = async (row, requestBody, indentObj, indentItemObj) => {
        if(!row.pcs || !row.quantity || !row.rate)throw new Error('pcs, quantity and rate and mandatory');
        indentItemObj.quantity = row.quantity;
        indentItemObj.pcs = row.pcs;
    }

    processRate = async (row, indentItemObj, indentObj) => {
        indentItemObj.rateOn = row.saleUnit == 'EA' ? 'pcs' : row.saleUnit;
        indentItemObj.rate = row.rate;
        indentItemObj.itemAmount = _.round((indentItemObj.quantity * row.rate), 2);
        indentObj.indentBaseAmount = (indentObj.indentBaseAmount || 0) + (indentItemObj.itemAmount || 0);
    }

    processItemWeight = async (requestBody, productDetails, indentItemObj) => {
        if (requestBody.enterpriseConfiguration.weightConversion == 'gross_weight_quantity') {
            const grossWeight = productDetails.grossWeight;
            const itemQuantity = indentItemObj.quantity;
            indentItemObj.itemWeightInKg = Number(grossWeight) > 0 ? Number(grossWeight) * Number(itemQuantity) : 0;
            indentItemObj.itemWeight = Number(grossWeight) > 0 ? ((Number(grossWeight) * Number(itemQuantity)) / 1000) : 0;
            indentItemObj.weightUnit = 'ton';

        } else if (requestBody.enterpriseConfiguration.weightConversion == 'net_weight_pcs') {
            const netWeight = productDetails.netWeight;
            const itemPcs = indentItemObj.pcs;
            indentItemObj.itemWeightInKg = Number(netWeight) > 0 ? Number(netWeight) * Number(itemPcs) : 0;
            indentItemObj.itemWeight = Number(netWeight) > 0 ? ((Number(netWeight) * Number(itemPcs)) / 1000) : 0;
            indentItemObj.weightUnit = 'ton';
        }
        indentItemObj.itemWeightInKg = Number(indentItemObj.itemWeightInKg).toFixed(3);
        indentItemObj.itemWeight = Number(indentItemObj.itemWeight).toFixed(3);
    }

    processItemDiscount = async (row, indentItemObj, indentObj) => {
        if (row.calculations && row.calculations.length) {
            const indentItemDiscounts = await this.#repository.getTaxDiscountJson(indentObj.enterpriseUuid, indentObj.legalEntityUuid, indentObj.orderType, 'IndentItemDiscount');
            let remainingAmount = indentItemObj.itemAmount;

            const itemDiscounts = [];

            let calculations = row.calculations;

            for (let disc of calculations) {
                if(!disc.calcRate || !disc.calCode || !disc.calcAmount)throw new Error('calcRate, calcAmount and calCode are mandatory in calculations');

                if (!disc.calcDescription.toLowerCase().includes('handling charge') && disc.calCode !== 'ZB00') {
                    let matchedObject;
                    if (indentItemDiscounts) {
                        matchedObject = indentItemDiscounts.find((i) => i.key === disc.calCode);
                    }
                    if (matchedObject) {
                        let discount = {
                            discCode: (matchedObject.key ? matchedObject.key : disc.calCode),
                            discDesc: (matchedObject.displayName ? matchedObject.displayName : disc.calcDescription),
                            discValue: Number(disc.calcRate.replace('-', '')),
                            discUnit: (matchedObject.unit ? matchedObject.unit : (disc.unit ? disc.unit : '%')),
                            seqNo: (matchedObject.seq_no || disc.seqNo),
                            discAmount: Number(disc.calcAmount)
                        }

                        // discount['discAmount'] = (_.trim(discount.discUnit) == '%' ?
                        //     _.round(((remainingAmount * Number(discount.discValue)) / 100), 2)
                        //     :
                        //     _.round(Number(discount.discValue) * Number(indentItemObj.quantity), 2)
                        // );
                        remainingAmount = (remainingAmount - discount['discAmount']).toFixed(2);

                        itemDiscounts.push(discount);

                        indentItemObj.discountAmount = (Number(indentItemObj.discountAmount) > 0 ? Number(indentItemObj.discountAmount) : 0) + (Number(discount['discAmount']) > 0 ? Number(discount['discAmount']) : 0);
                        indentItemObj.discountAmount = _.round(indentItemObj.discountAmount, 2);
                        indentObj.totalDiscount = (Number(indentObj.totalDiscount) > 0 ? Number(indentObj.totalDiscount) : 0) + (Number(discount['discAmount']) > 0 ? Number(discount['discAmount']) : 0);
                        indentObj.totalDiscount = _.round(indentObj.totalDiscount, 2);

                        // indentItemObj.itemAmount = remainingAmount;
                    }
                }
            }

            indentItemObj.IndentItemDiscounts = itemDiscounts;
        }
    }

    processHandlingCharges = async ( row, indentItemObj, indentObj ) => {
        if (row.calculations && row.calculations.length) {
            const indentItemHandlingCharges = await this.#repository.getTaxDiscountJson(indentObj.enterpriseUuid, indentObj.legalEntityUuid, indentObj.orderType, 'IndentItemHandlingCharges');
            let itemAmount = Number(indentItemObj.itemAmount);
            let itemHandlingCharges = [];
            let billingInfo = { handlingCharges: 0 }

            let calculations = row.calculations;

            for (let charge of calculations) {
                if(!charge.calcRate || !charge.calCode || !charge.calcAmount)throw new Error('calcRate, calcAmount and calCode are mandatory in calculations');

                if (charge.calcDescription.toLowerCase().includes('handling charge')) {
                    let matchedObject;
                    if (indentItemHandlingCharges) {
                        matchedObject = indentItemHandlingCharges.find((i) => i.key === charge.calCode);
                    }

                    if (matchedObject) {
                        let handlingCharges = {
                            showItemLevel: true,
                            seqNo: matchedObject.seqNo,
                            chargeCode: matchedObject.key ? matchedObject.key : charge.calCode,
                            chargeDesc: matchedObject.displayName ? matchedObject.displayName : charge.calcDescription,
                            chargeValue: charge.calcRate,
                            chargeUnit: matchedObject.unit,
                            chargeAmount: charge.calcAmount
                        }
                        itemHandlingCharges.push(handlingCharges);

                        indentItemObj.handlingCharges = (Number(indentItemObj.handlingCharges) > 0 ? Number(indentItemObj.handlingCharges) : 0) + Number(handlingCharges.chargeAmount);
                        indentItemObj.handlingCharges = _.round(indentItemObj.handlingCharges, 2);
                        billingInfo.handlingCharges = (Number(billingInfo.handlingCharges) > 0 ? Number(billingInfo.handlingCharges) : 0) + Number(handlingCharges.chargeAmount);
                        billingInfo.handlingCharges = _.round(billingInfo.handlingCharges, 2);
                    }
                }
            }
            indentItemObj.billingInfo = billingInfo;
            indentItemObj.IndentItemCharges = itemHandlingCharges;
        }
    }

    processBillingInfoAndIndentData = async ( billingInfo = {} , indentItemObj, indentObj ) => {
        billingInfo.handlingCharges = (billingInfo.handlingCharges) + ( indentObj?.billingInfo?.handlingCharges ?? 0 );
        indentObj.billingInfo = billingInfo;

        indentObj.totalWeight = (indentObj.totalWeight || 0) + (indentItemObj.otherInfo.itemWeight || 0);

        indentObj.brandDesc = _.isSet(indentObj.brandDesc) ? indentObj.brandDesc.add(indentItemObj.brandDesc) : new Set([indentItemObj.brandDesc]);
        indentObj.productDesc = _.isSet(indentObj.productDesc) ? indentObj.productDesc.add(indentItemObj.productDesc) : new Set([indentItemObj.productDesc]);
        indentObj.itemDesc = _.isSet(indentObj.itemDesc) ? indentObj.itemDesc.add(indentItemObj.itemDesc) : new Set([indentItemObj.itemDesc]);
        indentObj.itemCodes = _.isSet(indentObj.itemCodes) ? indentObj.itemCodes.add(indentItemObj.itemCode) : new Set([indentItemObj.itemCode]);
    
    }

    processIndentTax = async ( requestBody, indentObj ) => {
        const indentTaxes = await this.#repository.getTaxDiscountJson(indentObj.enterpriseUuid, indentObj.legalEntityUuid, indentObj.orderType, 'IndentTax');

        for (let tax of indentTaxes) {
            if (tax.key == 'gst') {
                this.#calculateGSTValue(indentObj, tax.value, tax.unit);
                indentObj.indentFinalAmount = (Number(indentObj.indentFinalAmount) > 0 ? Number(indentObj.indentFinalAmount) : 0)
                    + (Number(indentObj.totalGST) > 0 ? Number(indentObj.totalGST) : 0);
            } else if (tax.key == 'tcs') {
                const tcsPercentage = await this.#repository.getTCSPercentageByUser(indentObj.enterpriseUuid, indentObj.legalEntityUuid, indentObj.userUuid);
                if (tcsPercentage && tcsPercentage[0] && tcsPercentage[0][0]) {
                    const tcsOn = (Number(indentObj.indentFinalAmount) > 0 ? Number(indentObj.indentFinalAmount) : 0)
                    const tcsAmount = Number(Number((tcsOn * tcsPercentage[0][0].tcs_amount) / 100).toFixed(2));
                    if (tcsAmount > 0) {
                        indent.totalTcs = Number(tcsAmount);
                        indent.tcsPercentage = Number(tcsPercentage[0][0].tcs_amount) > 0 ? Number(tcsPercentage[0][0].tcs_amount) : 0;
                    }
                    indentObj.indentFinalAmount = (Number(indentObj.indentFinalAmount) > 0 ? Number(indentObj.indentFinalAmount) : 0)
                        + (Number(indentObj.totalTcs) > 0 ? Number(indentObj.totalTcs) : 0);
                }
            }
        }
    }

    #calculateGSTValue(indentObject, gstValue, gstUnit) {
        switch (_.toUpper(gstUnit)) {
            case '%':
                const gstAmount = (Number(Number((indentObject.indentFinalAmount * gstValue) / 100).toFixed(2)));
                if (gstAmount > 0) {
                    indentObject.totalGST = Number(gstAmount);
                    indentObject.gstPercentage = Number(`${gstValue}`) > 0 ? Number(`${gstValue}`) : 0;
                }
                break;
            case 'flat':
                gstValue = Number(gstValue).toFixed(2);
                if (gstValue > 0) {
                    indentObject.totalGST = Number(gstValue);
                }
                break;
        }
    }

    processIndentFinalAmountAndSummary = async ( indentObj ) => {
        let indentFinalAmount = Math.round(Number(indentObj.indentFinalAmount));
        indentObj.roundOff = Number(indentFinalAmount) - Number(indentObj.indentFinalAmount);
        indentObj.roundOff = Number(indentObj.roundOff.toFixed(2));
        indentObj.indentFinalAmount = indentFinalAmount

        indentObj.brandDesc = Array.from(indentObj.brandDesc).toString();
        indentObj.productDesc = Array.from(indentObj.productDesc).toString();
        indentObj.itemDesc = Array.from(indentObj.itemDesc).toString();
        indentObj.itemCodes = Array.from(indentObj.itemCodes).toString();
    }

    upsertOrder = async ( indentObj, processedIndentItems ) => {
        let upsertIndentTransaction = await sequelize.transaction();
        try {
            indentObj = await this.upsertIndentDetails( indentObj, upsertIndentTransaction );
            await this.upsertIndentItemDetails( indentObj, processedIndentItems, upsertIndentTransaction );
            await upsertIndentTransaction.commit();
            return {
                indentId: indentObj.id,
                ffIndentNo: indentObj.ffIndentNo,
                orderDate: indentObj.createdDate,
                tpNo: indentObj.thirdPartyIndentNo,
                tpUuid: indentObj.thirdPartyId
            }
        } catch (error) {
            await upsertIndentTransaction.rollback();
            console.log("IndentExternalService", "upsertOrder", `error: ${error?.message}`);
            throw new Error(error?.message);
        }
    }

    upsertIndentDetails = async ( indentObj, upsertIndentTransaction ) => {
        const exisitingIndent = await this.#indentExternalRepository.findIndentDetailsByUniqueId( indentObj.enterpriseUuid, indentObj.ffIndentNo, indentObj.thirdPartyIndentNo);
        if (!exisitingIndent){
            indentObj = (await this.#indentExternalRepository.createIndent(indentObj, upsertIndentTransaction))?.dataValues;
        } else {
            let updatedObj = (await this.#indentExternalRepository.updateIndent(indentObj, upsertIndentTransaction));
            indentObj = updatedObj;
        }
        return indentObj;
    }

    upsertIndentItemDetails = async ( indentObj, processedIndentItems, upsertIndentTransaction ) => {
        const savedIndentItems = await this.#indentExternalRepository.getAllIndentItems(indentObj.id);
        if( savedIndentItems && savedIndentItems.length > 0 ) {
            //upsert operation
            const indentItemsRemoved = this.#checkIndentItemsRemoved(savedIndentItems, processedIndentItems );
            for( let item of processedIndentItems ) {
                let whereObj = {
                    itemCode: item.itemCode,
                    indentId: indentObj.id,
                    otherInfo: { qualityCode: item.otherInfo?.qualityCode }
                }
                let itemDetails = await this.#indentExternalRepository.fetchIndentItem( whereObj, upsertIndentTransaction );
                if(itemDetails){
                    //indent item already presents, update it
                    await this.updateIndentItem( itemDetails, item, upsertIndentTransaction );
                } else {
                    //indent item not presents, create it
                    const { IndentItemDiscounts: discounts, IndentItemCharges: charges, IndentItemCalculation: itemCalculation, ...indentItem } = item;
                    await this.createIndentItem( indentObj, discounts, charges, indentItem, upsertIndentTransaction );
                }
            }
            await this.destroyIndentItems( indentObj, indentItemsRemoved, upsertIndentTransaction );

        } else {
            //create operation
            for( let item of processedIndentItems ) {
                const { IndentItemDiscounts: discounts, IndentItemCharges: charges, IndentItemCalculation: itemCalculation, ...indentItem } = item;
                await this.createIndentItem( indentObj, discounts, charges, indentItem, upsertIndentTransaction );
            }
        }
    }

    createIndentItem = async ( indentObj, discounts, charges, indentItem, upsertIndentTransaction ) => {
        indentItem.indentId = indentObj.id;
        indentItem.createdDate = moment().local();
        let indentItemInfo = ( await this.#indentExternalRepository.createIndentItem( indentItem, upsertIndentTransaction ))?.dataValues;
        await this.createIndentItemDiscounts( discounts, indentItemInfo, upsertIndentTransaction );
        await this.createIndentItemCharges( charges, indentItemInfo, upsertIndentTransaction );
    }

    updateIndentItem = async ( itemDetails, item, upsertIndentTransaction ) => {

        itemDetails.updatedDate = new Date();
        await this.#indentExternalRepository.updateIndentItem(item, {
            id: itemDetails.id
        }, upsertIndentTransaction );
        if(item.IndentItemDiscounts ){
            await this.#indentExternalRepository.deleteIndentItemDiscounts( itemDetails.id, upsertIndentTransaction )
            await this.createIndentItemDiscounts( item.IndentItemDiscounts, itemDetails, upsertIndentTransaction );
        } 
        if(item.IndentItemCharges ) {
            await this.#indentExternalRepository.deleteIndentItemCharges( itemDetails.id, upsertIndentTransaction );
            await this.createIndentItemCharges( item.IndentItemCharges, itemDetails, upsertIndentTransaction );
        }
    }

    destroyIndentItems = async ( indentObj, indentItemsRemoved, upsertIndentTransaction) => {
        for (let item of indentItemsRemoved) {
            let whereObj = {
                itemCode: item.itemCode,
                indentId: indentObj.id,
                otherInfo: { qualityCode: item.otherInfo?.qualityCode },
            }
            const indentItemToDelete = await this.#indentExternalRepository.fetchIndentItem( whereObj, upsertIndentTransaction );
            if (indentItemToDelete) {
                await this.#indentExternalRepository.deleteIndentItems( indentItemToDelete.id, upsertIndentTransaction );
                await this.#indentExternalRepository.deleteIndentItemCharges( indentItemToDelete.id, upsertIndentTransaction );
                await this.#indentExternalRepository.deleteIndentItemDiscounts( indentItemToDelete.id, upsertIndentTransaction )
            }
        }
    }

    createIndentItemDiscounts = async ( discounts, indentItemInfo, upsertIndentTransaction ) => {
        if (discounts && discounts.length) {
            for (let discount of discounts) {
                discount.indentItemId = indentItemInfo.id;
            }
            await this.#indentExternalRepository.bulkCreateIndentItemDiscounts(discounts, upsertIndentTransaction);
        }
    }

    createIndentItemCharges = async ( charges,  indentItemInfo, upsertIndentTransaction ) => {

        if (charges && charges.length) {
            for (let charge of charges) {
                charge.indentItemId = indentItemInfo.id;
            }
            await this.#indentExternalRepository.bulkCreateIndentItemCharges(charges, upsertIndentTransaction);
        }
    }

    #checkIndentItemsRemoved = (oldItems, newItems) => {
        let indentItemRemoval = []
        for (const oldValue of oldItems) {
            const val = newItems.find(x => {
                return x.itemCode == oldValue.itemCode
                    && x.otherInfo.qualityCode == oldValue.otherInfo.qualityCode 
                    && x.otherInfo.topDesgin == oldValue.otherInfo.topDesgin
            });
            if (!val) indentItemRemoval.push(oldValue)
        }
        return indentItemRemoval
    }

}

module.exports = IndentExternalService;