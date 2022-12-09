module.exports = (sequelize, DataTypes) => {
  const QueueInterval = sequelize.define(
    "QueueInterval",
    {
      qi_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
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
        defaultValue: sequelize.fn("now"),
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
      tableName: "queue_intervals",
    }
  );

  return QueueInterval;
};
