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
import { routeInteractions } from "./interactions";
import { captureError, initErrorTracking, safeReply } from "./utils/error";
import { deleteQueue } from "./utils/queue";

env.config();
initErrorTracking(process.env.ENV === "dev");

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const commands = new Collection<string, CustomCommand>();
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

  try {
    await commandFile.execute(bot, message, args);
  } catch (error) {
    captureError(error, "messageCommandFailure", {
      command: commandFile.config.name,
      guild_id: message.guildId ?? "unknown",
    });
  }
});

bot.on(Events.VoiceStateUpdate, (oldState, newState) => {
  if (
    newState.id !== bot.user?.id ||
    !oldState.channelId ||
    newState.channelId
  ) {
    return;
  }

  const guildId = newState.guild.id;

  deleteQueue(guildId);
});

bot.on("ready", async () => {
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
    captureError(err, "interactionFailure", {
      command: interaction.isCommand() ? interaction.commandName : "unknown",
      guild_id: interaction.guildId ?? "unknown",
    });

    // @ts-ignore
    await safeReply(interaction, {
      content: "⚠️ An error occurred while running that command.",
      ephemeral: true,
    });
  }
});

bot.login(process.env.BOT_TOKEN);
