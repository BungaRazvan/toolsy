import { SlashCommandOptionsOnlyBuilder } from "discord.js";

import * as play from "./play";
import * as help from "./help";
import * as skip from "./skip";
import * as stop from "./stop";
import * as loop from "./loop";
import * as list from "./list";
import * as playlist from "./playlist";
import * as mc_stats from "./mc_stats";
import * as radio from "./radio";

type CommnadConfig = {
  name: string;
  description: string;
  usage: string;
  slashCommand?: boolean;
};

interface CustomCommand {
  config: CommnadConfig;
  execute: Function;
  data?: SlashCommandOptionsOnlyBuilder;
}

interface CommandsCollection {
  [key: string]: CustomCommand;
}

const commands: CommandsCollection = {
  play,
  help,
  skip,
  stop,
  loop,
  list,
  playlist,
  mc_stats,
  // radio,
};

const slashCommands: CommandsCollection = {};
const normalCommands: CommandsCollection = {};

for (const [commandName, commandValues] of Object.entries(commands)) {
  if (commandValues.config?.slashCommand) {
    slashCommands[commandName] = commandValues;
    continue;
  }

  normalCommands[commandName] = commandValues;
}

export { slashCommands, normalCommands, CustomCommand, CommandsCollection };
