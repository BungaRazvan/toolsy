import { Sequelize, DataTypes } from "sequelize";

export default (sequelize: Sequelize) => {
  return sequelize.define("Playlist", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    guild_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
};
