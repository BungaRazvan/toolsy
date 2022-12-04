const { Sequelize, DataTypes, Model } = require("sequelize");
const db = require("../utils/db");
const { QueuePicture } = require("./queue_picture");

class QueueInterval extends Model {}

QueueInterval.init(
  {
    qi_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    qi_int_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    qi_user_id: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.STRING,
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

// QueueInterval.hasMany(QueuePicture, { foreignKey: "qi_id" });

module.exports = QueueInterval;
