const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");
const { readFiles } = require("./utils/files");

const env = require("dotenv");
env.config();

const slashCommands = [];
const rest = new REST({ version: "10" }).setToken(process.env.BOT_TOKEN);

// and deploy your commands!
const files = readFiles("./commands", {
  justSlashCommands: true,
});

for (const command of files) {
  slashCommands.push(command.props.data.toJSON());
}

(async () => {
  try {
    console.log(
      `Started refreshing ${slashCommands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(
        "1043585554849202237",
        "496374699463409675"
      ),
      { body: slashCommands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
