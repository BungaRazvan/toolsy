import {
  Events,
  GatewayIntentBits,
  Client,
  Collection,
  ActivityType,
  ChannelType,
  ModalBuilder,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import env from "dotenv";

import { slashCommands, normalCommands } from "./commands";
import models, { loadModels } from "./models";
import sequelize from "./utils/db";
import { songQueue } from "./constants";
import { fetchTracksByTitleOrUrl, playQueue } from "./utils/youtube";
import { checkCanPlay } from "./utils/voice";

env.config();

const bot = new Client({
  disableEveryone: true,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

bot.commands = new Collection();

for (const [commandName, commandValues] of Object.entries(normalCommands)) {
  console.log(`${commandName} loaded!`);
  bot.commands.set(commandName, commandValues);
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

  const commandfile = bot.commands.get(cmd.slice(prefix.length));

  if (!commandfile) {
    return;
  }

  commandfile.execute(bot, message, args);
});

bot.on("ready", async () => {
  loadModels();
  sequelize.sync();

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
  const isButton = interaction.isButton();

  if (isButton && interaction.customId.includes("playlist_play")) {
    const guildId = interaction.guildId;

    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply("You must be in a voice channel!");
    }

    const playlistId = interaction.customId.split("::")[1];
    const songs = await models.Song.findAll({
      where: { playlist_id: playlistId },
    });

    await interaction.deferReply();

    const trackResults = await Promise.all(
      songs.map(async (s) => await fetchTracksByTitleOrUrl(s.song))
    );

    const tracks = trackResults.flat();

    if (songQueue.has(guildId)) {
      const guildQueue = songQueue.get(guildId);
      guildQueue.tracks = [];
      guildQueue.index = 0;
    }

    playQueue(interaction, tracks);
  }

  if (isButton && interaction.customId == "playlist_create") {
    const modal = new ModalBuilder()
      .setCustomId("modal_create_playlist")
      .setTitle("Create Playlist");

    const playlistName =
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("playlist_name")
          .setLabel("Playlist Name")
          .setStyle(1)
          .setRequired(true)
      );

    const playlistSongs =
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("playlist_songs")
          .setPlaceholder("Comma-separated song titles or URLs")
          .setLabel("Songs")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      );

    modal.addComponents(playlistName, playlistSongs);
    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === "modal_create_playlist") {
      const playlistName =
        interaction.fields.getTextInputValue("playlist_name");

      const playlistSongs =
        interaction.fields.getTextInputValue("playlist_songs");

      const playlist = await models.Playlist.create({
        name: playlistName,
        user_id: interaction.user.id,
        guild_id: interaction.guildId,
      });

      models.Song.bulkCreate(
        playlistSongs.split(",").map((song) => {
          return {
            song: song,
            playlist_id: playlist.id,
          };
        })
      );

      await interaction.reply({
        content: `✅ Created playlist: **${playlistName}**`,
        ephemeral: true,
      });
    }

    if (interaction.customId === "modal_edit_playlist") {
      await interaction.reply({
        content: `✅ Playlist Edited`,
        ephemeral: true,
      });
    }
  }

  if (!interaction.isCommand()) {
    return;
  }

  const { commandName } = interaction;

  if (!commandName) {
    interaction.reply("Unknown command");
    return;
  }

  try {
    await slashCommands[commandName].execute(interaction);
  } catch (err) {
    console.error(err);
  }
});

bot.login(process.env.BOT_TOKEN);
