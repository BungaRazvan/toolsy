import { Sequelize, INTEGER, STRING, TEXT } from "sequelize";
import { database } from "./config";
import {
  StaticCases,
  StaticKnives,
  StaticSkins,
  StatiKnifeCases,
  StaticInvertory,
  StaticPlayers,
} from "./interfaces";

const con = new Sequelize(database.db, database.user, database.password, {
  host: database.host,
  logging: database.logging,
  dialect: "mysql",
  define: {
    timestamps: database.define.timestamps,
  },
});

con
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err: any) => {
    console.error("Unable to connect to the database:", err);
  });

const Skins = <StaticSkins>con.define("skins", {
  skin_id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  skin_name: {
    type: STRING,
    allowNull: false,
  },
  skin_image: {
    type: TEXT,
    allowNull: true,
  },
  skin_quality: {
    type: STRING,
    allowNull: false,
  },
  skin_avaible: {
    type: STRING,
    allowNull: true,
  },
});

const Cases = <StaticCases>con.define("cases", {
  case_id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  case_name: {
    type: STRING,
    allowNull: false,
  },
  case_image: {
    type: TEXT,
    allowNull: true,
  },
});

const Knives = <StaticKnives>con.define("knives", {
  knife_id: {
    type: INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  skin_name: {
    type: STRING,
    allowNull: false,
  },
  skin_avaible: {
    type: STRING,
    allowNull: true,
  },
  skin_quality: {
    type: STRING,
    allowNull: true,
  },
  skin_image: {
    type: TEXT,
    allowNull: true,
  },
});

const KnifeCases = <StatiKnifeCases>con.define("knife_cases", {
  id: {
    type: INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  knife_id: {
    type: INTEGER,
    allowNull: true,
  },
  case_id: {
    type: INTEGER,
    allowNull: true,
  },
});

const Players = <StaticPlayers>con.define("players", {
  id: {
    type: INTEGER,
    primaryKey: true,
    allowNull: true,
  },
  player_id: { type: INTEGER, allowNull: false },
});

const Inventory = <StaticInvertory>con.define("inventory", {
  id: {
    type: INTEGER,
    primaryKey: true,
    allowNull: true,
  },
  quantity: { type: INTEGER, allowNull: false },
  player_id: { type: INTEGER, allowNull: false },
  skin_id: { type: INTEGER, allowNull: true },
  knife_id: { type: INTEGER, allowNull: true },
});

Skins.belongsTo(Cases, { foreignKey: "case_id" });

Knives.belongsToMany(Cases, {
  through: "knife_cases",
  foreignKey: "knife_id",
});

Inventory.belongsTo(Skins, { foreignKey: "skin_id" });
Inventory.belongsTo(Knives, { foreignKey: "knife_id" });
Inventory.belongsTo(Players, { foreignKey: "player_id" });

Cases.hasMany(Skins, { foreignKey: "case_id" });
Cases.belongsToMany(Knives, {
  through: "knife_cases",
  foreignKey: "case_id",
});

con.sync().then(() => {
  return { Skins, Cases, Inventory, Knives, Players };
});

export { Skins, Cases, Inventory, Knives, Players };
