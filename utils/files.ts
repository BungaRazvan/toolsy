import fs from "fs";
import path from "path";

export const readCommands = (filesFolder: string, args = {}) => {
  const functionArgs = {
    justSlashCommands: false,
    justCommnads: false,
    log: false,
    ...args,
  };
  const commands = [];

  const commandFiles = fs
    .readdirSync(path.resolve(filesFolder))
    .filter((file) => file.endsWith(".ts"));

  for (const file of commandFiles) {
    const props = require(`${path.resolve(filesFolder, file)}`);

    if (functionArgs.justSlashCommands && props.config.slashCommand) {
      commands.push({ name: props.config.name, props });
      continue;
    }

    if (functionArgs.justCommnads && !props.config.slashCommand) {
      commands.push({ name: props.config.name, props });
      continue;
    }

    console.log(functionArgs.justCommnads, props.config.slashCommand, file);

    if (functionArgs.log) {
      console.log(`${file} loaded!`);
    }
  }

  return commands;
};

export const readFiles = (filesFolder: string, ext: string) => {
  const files = fs
    .readdirSync(path.resolve(filesFolder))
    .filter((file) => file.endsWith(ext));

  return files;
};
