import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import { slashCommands } from "./commands";
import { captureError, initErrorTracking } from "./utils/error";
import env from "dotenv";

env.config();
initErrorTracking(process.env.ENV === "dev");

const commandsData = Object.values(slashCommands).map(
  (command) => command.data
);

const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN!);

const deplyCommands = async () => {
  try {
    console.log(
      `Started refreshing ${
        Object.keys(commandsData).length
      } application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationCommands(process.env.BOT_CLIENT_ID!),
      { body: commandsData }
    );

    console.log(
      // @ts-ignore
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    captureError(error, "deploySlashCommands");
    process.exitCode = 1;
  }
};

deplyCommands();
