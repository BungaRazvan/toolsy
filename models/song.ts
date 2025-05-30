import { Sequelize, DataTypes } from "sequelize";

export default (sequelize: Sequelize) => {
  return sequelize.define("Song", {
    song: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    playlist_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });
};
