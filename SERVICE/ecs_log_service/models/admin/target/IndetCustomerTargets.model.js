const { Model, DataTypes } = require("sequelize");
const ModelBuilder = require("../model.builder");

class IndentCustomerTargets extends Model { }

function defineModel() {
    const modelBuilder = new ModelBuilder();

    modelBuilder.addAttributes({
        id: {
            field: 'id',
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false
        },
        userCode: {
            field: 'user_code',
            type: DataTypes.STRING,
            allowNull: false,
        },
        userUuid: {
            field: 'user_uuid',
            type: DataTypes.UUID,
            allowNull: false,
            primaryKey: true,
            unique: 'idx_user_target',
        },
        year: {
            field: 'year',
            type: DataTypes.INTEGER,
            unique: 'idx_user_target'
        },
        month: {
            field: 'month',
            type: DataTypes.INTEGER,
            unique: 'idx_user_target'
        },
        target: {
            field: 'target',
            type: DataTypes.DOUBLE
        }
    })

    modelBuilder.configureOptions(false, false, 'indent_customer_targets', 'fundflo_indent', {});
    return modelBuilder;
}

IndentCustomerTargets.init(
    defineModel().getModel(),
    defineModel().getOptions()
);

module.exports = IndentCustomerTargets;