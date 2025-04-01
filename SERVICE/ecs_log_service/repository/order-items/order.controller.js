const { logger } = require('../../config/logger');
const IndentService = require("./indent.service");
const IndentOtpService = require('./otp/indent.otp.service');

class IndentInternalController extends IndentService {

    #indentOtpService = new IndentOtpService();

    getRddValue = async ( request , response ) => {
        try {
            logger.customInfo('IndentInternalController', 'getRddValue', `Request PATH : ${JSON.stringify(request.originalUrl)}`);
            let { enterpriseUuid, legalEntityUuid } = request;
            let { fieldValue, fieldName, currentDate } = request.query;
            let result = await this._getRddValue( enterpriseUuid, legalEntityUuid, fieldValue, fieldName, currentDate );
            return response.status(200).json({ message: "rdd value fetched successfully", data: result })
        } catch (error) {
            logger.customError('IndentInternalController', 'getRddValue', error.message);
            return  response.status(500).json({ message: 'error in getting rdd value',  error: error?.message });
        }
    }

    getAllExclusiveProductsList = async ( request , response, next ) => {
        try {
            logger.customInfo('IndentInternalController', 'getAllExclusiveProductsList', `Request PATH : ${JSON.stringify(request.originalUrl)}`);
            let { enterpriseUuid, legalEntityUuid } = request;
            let { pageNo, pageSize } = request.query;
            let { filterObject } = request.body;
            filterObject = {
                ...filterObject,
                pageNo, pageSize
            }
            let result = await this._getAllExclusiveProductsList( enterpriseUuid, legalEntityUuid, filterObject );
            response.locals.data = result;
            next();
            // return response.status(200).json({ message: "exclusive products fetched successfully", data: result })
        } catch (error) {
            logger.customError('IndentInternalController', 'getAllExclusiveProductsList', error.message);
            return  response.status(500).json({ message: 'error in getting exclusive products',  error: error?.message });
        }
    }

    createExclusiveProduct = async ( request , response ) => {
        try {
            logger.customInfo('IndentInternalController', 'createExclusiveProduct', `Request PATH : ${JSON.stringify(request.originalUrl)}`);
            let { enterpriseUuid, legalEntityUuid } = request;
            let { createObject } = request.body;
            let result = await this._createExclusiveProduct( enterpriseUuid, legalEntityUuid, createObject );
            return response.status(200).json({ message: "exclusive products created successfully", data: result })
        } catch (error) {
            logger.customError('IndentInternalController', 'createExclusiveProduct', error.message);
            return  response.status(500).json({ message: 'error in creating exclusive products',  error: error?.message });
        }
    }

    updateExclusiveProduct = async ( request , response ) => {
        try {
            logger.customInfo('IndentInternalController', 'updateExclusiveProduct', `Request PATH : ${JSON.stringify(request.originalUrl)}`);
            let { enterpriseUuid, legalEntityUuid } = request;
            let { id } = request.params;
            let { updateObject } = request.body;
            let result = await this._updateExclusiveProduct( enterpriseUuid, legalEntityUuid, id, updateObject );
            return response.status(200).json({ message: "exclusive products updated successfully", data: result })
        } catch (error) {
            logger.customError('IndentInternalController', 'updateExclusiveProduct', error.message);
            return  response.status(500).json({ message: 'error in updating exclusive products',  error: error?.message });
        }
    }

    deleteExclusiveProduct = async ( request , response ) => {
        try {
            logger.customInfo('IndentInternalController', 'deleteExclusiveProduct', `Request PATH : ${JSON.stringify(request.originalUrl)}`);
            let { enterpriseUuid, legalEntityUuid } = request;
            let { id } = request.params;
            let result = await this._deleteExclusiveProduct( enterpriseUuid, legalEntityUuid, id );
            return response.status(200).json({ message: "exclusive products deleted successfully", data: result })
        } catch (error) {
            logger.customError('IndentInternalController', 'deleteExclusiveProduct', error.message);
            return  response.status(500).json({ message: 'error in deleting exclusive products',  error: error?.message });
        }
    }

    getReportFilterData = async ( request , response ) => {
        try {
            logger.customInfo('IndentInternalController', 'getReportFilterData', `Request PATH : ${JSON.stringify(request.originalUrl)}`);
            let { enterpriseUuid, legalEntityUuid, tags } = request;
            let { type } = request.params;
            let { search } = request.body;
            let types = ['createdBy', 'createdFrom']
            if( !type || !types.includes(type) )throw new Error(`type is mandatory and value should be either createdBy or createdFrom`);
            let result = await this._getReportFilterData( enterpriseUuid, legalEntityUuid, type, tags, search );
            return response.status(200).json({ message: "report filters fetched successfully", data: result })
        } catch (error) {
            logger.customError('IndentInternalController', 'getReportFilterData', error.message);
            return  response.status(500).json({ message: 'error in fetching the report filters',  error: error?.message });
        }
    }

    getReportData = async ( request , response ) => {
        try {
            logger.customInfo('IndentInternalController', 'getReportData', `Request PATH : ${JSON.stringify(request.originalUrl)}`);
            let { enterpriseUuid, legalEntityUuid } = request;
            let { pageNo, pageSize } = request.query;
            request.body.pageNo = pageNo;
            request.body.pageSize = pageSize;
            let result = await this._getReportData( enterpriseUuid, legalEntityUuid, request.body );
            return response.status(200).json({ message: "report fetched successfully", data: result })
        } catch (error) {
            logger.customError('IndentInternalController', 'getReportData', error.message);
            return  response.status(500).json({ message: 'error in fetching the reports',  error: error?.message });
        }
    }

}

module.exports = IndentInternalController;