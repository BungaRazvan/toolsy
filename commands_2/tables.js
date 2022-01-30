// const con = require("./db");
const sequelize = require("sequelize");

const Skins = con.define("skins", {
  skin_id: {
    type: sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  skin_name: {
    type: sequelize.STRING,
    allowNull: false,
  },
  skin_image: {
    type: sequelize.TEXT,
    allowNull: true,
  },
  skin_quality: {
    type: sequelize.STRING,
    allowNull: false,
  },
  skin_avaible: {
    type: sequelize.STRING,
    allowNull: true,
  },
  skin_image: {
    type: sequelize.TEXT,
    allowNull: true,
  },
});

const Types = con.define("types", {
  type_id: {
    type: sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
  },

  type_name: {
    type: sequelize.STRING,
    allowNull: true,
  },
});

const Collections = con.define("collections", {
  collection_id: {
    type: sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  collection_name: {
    type: sequelize.STRING,
    allowNull: false,
  },
  collection_image: {
    type: sequelize.TEXT,
    allowNull: true,
  },
});

const Guns = con.define("guns", {
  gun_id: {
    type: sequelize.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  gun_name: {
    type: sequelize.STRING,
    allowNull: false,
  },
  type_id: {
    type: sequelize.INTEGER,
    allowNull: true,
  },
});

const Knives = con.define("knives", {
  knife_id: {
    type: sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  skin_name: {
    type: sequelize.STRING,
    allowNull: false,
  },
  knife_avaible: {
    type: sequelize.STRING,
    allowNull: true,
  },
  knife_quality: {
    type: sequelize.STRING,
    allowNull: true,
  },
  knife_image: {
    type: sequelize.TEXT,
    allowNull: true,
  },
});

const Knife_Collections = con.define("knife_collections", {
  id: {
    type: sequelize.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  knife_id: {
    type: sequelize.INTEGER,
    allowNull: true,
  },
  collection_id: {
    type: sequelize.INTEGER,
    allowNull: true,
  },
});

Skins.belongsTo(Types, { foreignKey: "type_id" });
Skins.belongsTo(Collections, { foreignKey: "collection_id" });
Skins.belongsTo(Guns, { foreignKey: "gun_id" });

Guns.belongsTo(Types, { foreignKey: "type_id" });
Guns.hasMany(Skins, { foreignKey: "gun_id" });
Guns.hasMany(Knives, { foreignKey: "gun_id" });

Knives.belongsTo(Types, { foreignKey: "type_id" });
Knives.belongsTo(Guns, { foreignKey: "gun_id" });
Knives.belongsToMany(Collections, {
  through: "knife_collections",
  foreignKey: "knife_id",
});

Collections.hasMany(Skins, { foreignKey: "collection_id" });
Collections.belongsToMany(Knives, {
  through: "knife_collections",
  foreignKey: "collection_id",
});

Types.hasMany(Guns, { foreignKey: "type_id" });

con.sync().then(() => {
  return Skins, Types, Collections, Guns, Knives, Knife_Collections;
});

module.exports = con;
