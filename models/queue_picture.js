// QueuePicture.belongsTo(QueueInterval, { foreignKey: "qp_interval_id" });
// QueueInterval.hasMany(QueuePicture, { foreignKey: "qi_id" });

module.exports = (sequelize, DataTypes) => {
  const QueuePicture = sequelize.define(
    "QueuePicture",
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
        defaultValue: sequelize.fn("now"),
      },
    },
    { tableName: "queue_pictures" }
  );

  return QueuePicture;
};
