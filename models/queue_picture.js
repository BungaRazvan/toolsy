const { Sequelize, DataTypes, Model } = require("sequelize");
const db = require("../utils/db");

// TODO Move everthing in it's own file

class QueuePicture extends Model {}

QueuePicture.init(
  {
    qp_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    qp_image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qp_interval_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qp_created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
    },
  },
  { sequelize: db, modelName: "queue_pictures" }
);

class QueueInterval extends Model {}

QueueInterval.init(
  {
    qi_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    qi_description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    qi_user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qi_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qi_created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("now"),
    },

    qi_at: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    qi_channel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize: db,
    modelName: "queue_intervals",
  }
);

QueuePicture.belongsTo(QueueInterval, { foreignKey: "qp_interval_id" });
QueueInterval.hasMany(QueuePicture, { foreignKey: "qi_id" });

module.exports = { QueueInterval, QueuePicture };
