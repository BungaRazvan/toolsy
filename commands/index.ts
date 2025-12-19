// import * as play from "./play";
import * as play from "./play";
import * as help from "./help";
import * as skip from "./skip";
import * as stop from "./stop";
import * as loop from "./loop";
import * as list from "./list";
import * as playlist from "./playlist";
import * as mc_stats from "./mc_stats";

const commands = {
  play,
  help,
  skip,
  stop,
  loop,
  list,
  playlist,
  mc_stats,
};

const slashCommands = {};
const normalCommands = {};

for (const [commandName, commandValues] of Object.entries(commands)) {
  if (commandValues.config?.slashCommand) {
    slashCommands[commandName] = commandValues;
    continue;
  }

  normalCommands[commandName] = commandValues;
}

export { slashCommands, normalCommands };
