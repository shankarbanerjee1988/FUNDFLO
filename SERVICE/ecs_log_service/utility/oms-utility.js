const jsonMapper = require('json-mapper-json');
const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const addErrors = require("ajv-errors");

const ajv = new Ajv({ allErrors: true });
addFormats(ajv); 
addErrors(ajv); 

class OMSUtility {

    jsonMapperFunction = async (convertFromJSON, convertTOTemplate) => {
        return await jsonMapper(convertFromJSON, convertTOTemplate);
    }

    validateSchema = (schemaToValidate, validationSchemaTemplate) => {
        try {
            const validate = ajv.compile(validationSchemaTemplate);
            const isValid = validate(schemaToValidate);
            return isValid;
        } catch (error) {
            throw new Error(error?.message)
        } 
    }

}

module.exports = OMSUtility