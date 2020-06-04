import { Client, Message } from "discord.js";
import { config, botConfig } from "./config/config";
import { CommandHandler } from "./command_handler";

validateConfig(config);

const commandHandler = new CommandHandler(config.prefix);
const client = new Client({ disableMentions: "everyone" });

client.on("message", (message: Message) => {
  commandHandler.handleMessage(message, client);
});

client.on("error", (e) => {
  console.error("Discord client error!", e);
});

client.on("ready", () => {
  console.log(`${client.user.username} is online`);
  client.user.setActivity(`a SEX TAPE`, {
    type: "WATCHING",
  });
});

client.login(config.token);

function validateConfig(config: botConfig) {
  if (!config.token) {
    throw new Error("You need to specify your Discord bot token!");
  }
}
