import fs from "fs";
import path from "path";
import { Sequelize, ModelStatic, DataTypes } from "sequelize";
import sequelize from "../utils/db"; // Your Sequelize instance

const models: Record<string, ModelStatic<any>> = {};

export function loadModels() {
  const modelsDir = path.resolve(__dirname);
  const files = fs.readdirSync(modelsDir);

  for (const file of files) {
    if (file === "index.ts" || file === "index.js") continue; // Skip this file

    const modelPath = path.join(modelsDir, file);
    const modelFactory = require(modelPath).default;
    if (typeof modelFactory === "function") {
      const model = modelFactory(sequelize, DataTypes);
      models[model.name] = model;
    }
  }

  // Set up associations here (if any)
}

export default models;
