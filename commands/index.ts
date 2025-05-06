// import * as play from "./play";
import * as play from "./play";
import * as help from "./help";
import * as skip from "./skip";
import * as stop from "./stop";
import * as loop from "./loop";
import * as list from "./list";
import * as playlist from "./playlist";

const commands = {
  play,
  help,
  skip,
  stop,
  loop,
  list,
  playlist,
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
