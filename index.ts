import {
  Events,
  GatewayIntentBits,
  Client,
  Collection,
  ActivityType,
  ChannelType,
} from "discord.js";

import env from "dotenv";

import { normalCommands, slashCommands } from "./commands";

env.config();

const bot = new Client({
  disableEveryone: true,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

bot.commands = new Collection();

bot.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) {
    return;
  }

  if (message.channel.type === ChannelType.DM) {
    return;
  }

  const prefix = process.env.prefix!;

  if (!message.content.startsWith(prefix)) {
    return;
  }

  const messageArray = message.content.split(" ");
  const cmd = messageArray[0];
  const args = messageArray.slice(1);

  const commandfile = bot.commands.get(cmd.slice(prefix.length));

  if (!commandfile) {
    return;
  }

  commandfile.run(bot, message, args);
});

bot.on("ready", async () => {
  console.log(`${bot.user.username} is online`);

  bot.user.setPresence({
    activities: [
      {
        name: `a fight between two birds`,
        type: ActivityType.Watching,
      },
    ],
  });
});

bot.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    interaction.reply("Unknown command");
    return;
  }

  try {
    await command.run(interaction);
  } catch (err) {
    console.error(err);
  }
});

bot.login(process.env.BOT_TOKEN);
