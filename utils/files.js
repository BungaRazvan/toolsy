const fs = require("fs");
const path = require("path");

module.exports.readCommands = (filesFolder, args = {}) => {
  const functionArgs = {
    justSlashCommands: false,
    justCommnads: false,
    log: false,
    ...args,
  };
  const commands = [];

  const commandFiles = fs
    .readdirSync(path.resolve(filesFolder))
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const props = require(`${path.resolve(filesFolder, file)}`);

    if (functionArgs.justSlashCommands && props.config.slashCommand) {
      commands.push({ name: props.config.name, props });
      continue;
    }

    if (functionArgs.justCommnads && !props.config?.slashCommand) {
      commands.push({ name: props.config.name, props });
      continue;
    }

    if (!functionArgs.justCommnads && !functionArgs.justSlashCommands) {
      if (props.config.slashCommand) {
        commands.push({ name: props.config.name, props });
        continue;
      }

      commands.push({ name: props.config.name, props });
    }

    if (functionArgs.log) {
      console.log(`${file} loaded!`);
    }
  }

  return commands;
};

module.exports.readFiles = (filesFolder, ext) => {
  const files = fs
    .readdirSync(path.resolve(filesFolder))
    .filter((file) => file.endsWith(ext));

  return files;
};
