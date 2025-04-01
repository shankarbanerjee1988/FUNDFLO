const DataTypes = require("sequelize");
const { sequelize } = require("../../config/db/db");

class ModelBuilder{

    #model = {};
    #options = { sequelize };

    constructor(customTimestamps, customBy, customByText){
        if (customTimestamps) {
          this.#model.createdDate = {
            field: "created_date",
            type: DataTypes.DATE,
            allowNull: false,
          };
          this.#model.updatedDate = {
            field: "updated_date",
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
          };
        }
        if(customBy){
          this.#model.createdBy = {
            field: "created_by",
            type: DataTypes.UUID,
          };
          this.#model.updatedBy = {
            field: "updated_by",
            type: DataTypes.UUID,
          };
        }
        if(customByText){
          this.#model.createdByText = {
            field: "created_by_text",
            type: DataTypes.TEXT,
          };
          this.#model.updatedByText = {
            field: "updated_by_text",
            type: DataTypes.TEXT,
          };
        }
    }

    addAttribute(key, field, type, options){
        this.#model[key] = {
          field: field,
          type: DataTypes[type],
          ...options
        };
    }

    addAttributes(attributes){
        this.#model = { ...this.#model, ...attributes };
    }

    configureOptions(createdAt, updatedAt, tableName, schema, others){
        this.#options.createdAt = createdAt;
        this.#options.updatedAt = updatedAt;
        this.#options.tableName = tableName;
        this.#options.schema = schema;
        this.#options = { ...this.#options, ...others }
    }

    getModel(){
        return this.#model;
    }

    getOptions(){
        return this.#options;
    }

}

module.exports = ModelBuilder;