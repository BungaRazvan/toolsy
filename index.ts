import {
  Events,
  GatewayIntentBits,
  Client,
  Collection,
  ActivityType,
  ChannelType,
  Interaction,
  CommandInteraction,
} from "discord.js";

import env from "dotenv";

import { slashCommands, normalCommands, CustomCommand } from "./commands";

import Sentry from "@sentry/node";
import { routeInteractions } from "./interactions";

env.config();

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const commands = new Collection<string, CustomCommand>();
const isDEV = process.env.ENV === "dev";

for (const [commandName, commandValues] of Object.entries(normalCommands)) {
  console.log(`${commandName} loaded!`);
  commands.set(commandName, commandValues);
}

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

  const commandFile = commands.get(cmd.slice(prefix.length));

  if (!commandFile) {
    return;
  }

  commandFile.execute(bot, message, args);
});

bot.on("ready", async () => {
  Sentry.init({
    enabled: !isDEV,
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENV,
  });
  // @ts-ignore
  console.log(`${bot.user.username} is online`);
  console.log(`Bot is in ${bot.guilds.cache.size} servers`);

  // @ts-ignore
  bot.user.setPresence({
    activities: [
      {
        name: `a fight between two birds`,
        type: ActivityType.Watching,
      },
    ],
  });
});

const executeInteraction = async (interaction: Interaction) => {
  await routeInteractions(interaction);

  if (!interaction.isCommand()) {
    return;
  }

  const { commandName } = interaction;

  if (!commandName) {
    interaction.reply("Unknown command");
    return;
  }

  await slashCommands[commandName].execute(interaction as CommandInteraction);
};

bot.on(Events.InteractionCreate, async (interaction) => {
  try {
    await executeInteraction(interaction);
  } catch (err) {
    if (isDEV) {
      console.error(err);
    }

    Sentry.captureException(err);

    const fallbackMsg = {
      content: "⚠️ An error occurred while running that command.",
    };

    // safe fallback

    try {
      // @ts-ignore
      if (!interaction.replied && !interaction.deferred) {
        // @ts-ignore
        await interaction.reply(fallbackMsg).catch(() => {});
      } else {
        // @ts-ignore
        await interaction.followUp(fallbackMsg).catch((e) => {
          console.error("Failed followUp in error handler:", e);
        });
      }
    } catch (finalErr) {
      if (isDEV) {
        console.error("Final fallback failed:", finalErr);
      }

      Sentry.captureException(finalErr);
    }
  }
});

bot.login(process.env.BOT_TOKEN);
