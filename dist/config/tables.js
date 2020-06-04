"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Players = exports.Knives = exports.Inventory = exports.Cases = exports.Skins = void 0;
const sequelize_1 = require("sequelize");
const config_1 = require("./config");
const con = new sequelize_1.Sequelize(config_1.database.db, config_1.database.user, config_1.database.password, {
    host: config_1.database.host,
    logging: config_1.database.logging,
    dialect: "mysql",
    define: {
        timestamps: config_1.database.define.timestamps,
    },
});
con
    .authenticate()
    .then(() => {
    console.log("Connection has been established successfully.");
})
    .catch((err) => {
    console.error("Unable to connect to the database:", err);
});
const Skins = con.define("skins", {
    skin_id: {
        type: sequelize_1.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    skin_name: {
        type: sequelize_1.STRING,
        allowNull: false,
    },
    skin_image: {
        type: sequelize_1.TEXT,
        allowNull: true,
    },
    skin_quality: {
        type: sequelize_1.STRING,
        allowNull: false,
    },
    skin_avaible: {
        type: sequelize_1.STRING,
        allowNull: true,
    },
});
exports.Skins = Skins;
const Cases = con.define("cases", {
    case_id: {
        type: sequelize_1.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    case_name: {
        type: sequelize_1.STRING,
        allowNull: false,
    },
    case_image: {
        type: sequelize_1.TEXT,
        allowNull: true,
    },
});
exports.Cases = Cases;
const Knives = con.define("knives", {
    knife_id: {
        type: sequelize_1.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    skin_name: {
        type: sequelize_1.STRING,
        allowNull: false,
    },
    skin_avaible: {
        type: sequelize_1.STRING,
        allowNull: true,
    },
    skin_quality: {
        type: sequelize_1.STRING,
        allowNull: true,
    },
    skin_image: {
        type: sequelize_1.TEXT,
        allowNull: true,
    },
});
exports.Knives = Knives;
const KnifeCases = con.define("knife_cases", {
    id: {
        type: sequelize_1.INTEGER,
        primaryKey: true,
        allowNull: false,
    },
    knife_id: {
        type: sequelize_1.INTEGER,
        allowNull: true,
    },
    case_id: {
        type: sequelize_1.INTEGER,
        allowNull: true,
    },
});
const Players = con.define("players", {
    id: {
        type: sequelize_1.INTEGER,
        primaryKey: true,
        allowNull: true,
    },
    player_id: { type: sequelize_1.INTEGER, allowNull: false },
});
exports.Players = Players;
const Inventory = con.define("inventory", {
    id: {
        type: sequelize_1.INTEGER,
        primaryKey: true,
        allowNull: true,
    },
    quantity: { type: sequelize_1.INTEGER, allowNull: false },
    player_id: { type: sequelize_1.INTEGER, allowNull: false },
    skin_id: { type: sequelize_1.INTEGER, allowNull: true },
    knife_id: { type: sequelize_1.INTEGER, allowNull: true },
});
exports.Inventory = Inventory;
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
//# sourceMappingURL=tables.js.map