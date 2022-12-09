const { readFiles } = require("./../utils/files");
const db = require("../utils/db");
const { DataTypes } = require("sequelize");

const modelsFiles = readFiles("./models", ".js");
let models = {};

modelsFiles.map((file) => {
  if (file == "index.js") {
    return;
  }

  let model = require("./" + file);
  model = model(db, DataTypes);
  models = {
    ...models,
    [model.name]: model,
  };
});

models.QueuePicture.belongsTo(models.QueueInterval, {
  foreignKey: "qp_interval_id",
});
models.QueueInterval.hasMany(models.QueuePicture, { foreignKey: "qi_id" });

module.exports = models;
