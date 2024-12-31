import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { slashCommands } from "./commands";
import env from "dotenv";

env.config();

const commandsData = Object.values(slashCommands).map(
  (command) => command.data
);
const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN!);

console.log(commandsData);

const deplyCommands = async () => {
  try {
    console.log(
      `Started refreshing ${slashCommands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationCommands(process.env.BOT_CLIENT_ID!),
      { body: commandsData }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
};

deplyCommands();
