import {
  Events,
  GatewayIntentBits,
  Client,
  Collection,
  ActivityType,
  ChannelType,
  Interaction,
  CacheType,
  MessageFlags,
} from "discord.js";

import env from "dotenv";

import { slashCommands, normalCommands } from "./commands";
import { songQueue } from "./constants";
import { playQueue } from "./utils/youtube";
import { createPlaylistModal } from "./utils/playlist";

import Sentry from "@sentry/node";
import { apiCall } from "./utils/api";

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
const isDEV = process.env.ENV === "dev";

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
  Sentry.init({
    enabled: !isDEV,
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENV,
  });
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

const executeInteraction = async (interaction: Interaction<CacheType>) => {
  const isButton = interaction.isButton();

  if (isButton && interaction.customId.includes("playlist_delete")) {
    const playlistId = interaction.customId.split("::")[1];

    const response = await apiCall(
      "delete",
      "youtube-playlist",
      {
        playlist_id: playlistId,
        user_id: interaction.user.id,
        guild_id: interaction.guildId,
      },
      {
        useAPIKey: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      await interaction.reply({
        content: await response.text(),
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `✅ Deleted playlist`,
      ephemeral: true,
    });
  }

  if (isButton && interaction.customId.includes("playlist_edit")) {
    const playlistId = interaction.customId.split("::")[1];

    const response = await apiCall(
      "get",
      "youtube-playlist",
      new URLSearchParams({
        playlist_id: playlistId as string,
        user_id: interaction.user.id as string,
        guild_id: interaction.guildId as string,
      }),
      { useAPIKey: true }
    );

    if (!response.ok) {
      await await interaction.reply({
        content: await response.text(),
        ephemeral: true,
      });
      return;
    }

    const data = await response.json();
    const playlist = data.playlists[0];

    const songsUrls = playlist.songs;

    const modal = createPlaylistModal(
      `modal_edit_playlist::${playlistId}`,
      "Edit Playlist",
      playlist.name,
      songsUrls.join(",")
    );
    await interaction.showModal(modal);
  }

  if (isButton && interaction.customId.includes("playlist_play")) {
    const guildId = interaction.guildId;

    const voiceChannel = interaction.member?.voice?.channel;

    if (!voiceChannel) {
      return interaction.reply({
        content: "You must be in a voice channel!",
        flags: MessageFlags.Ephemeral,
      });
    }

    const playlistId = interaction.customId.split("::")[1];

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const response = await apiCall(
      "get",
      "youtube-playlist",
      new URLSearchParams({
        playlist_id: playlistId as string,
        user_id: interaction.user.id as string,
        guild_id: interaction.guildId as string,
        play_mode: "true",
      }),
      { useAPIKey: true }
    );

    if (!response.ok) {
      await interaction.editReply({
        content: await response.text(),
      });
      return;
    }

    const data = await response.json();
    const playlist = data.playlists[0];

    if (songQueue.has(guildId)) {
      const guildQueue = songQueue.get(guildId);
      guildQueue.tracks = [];
      guildQueue.index = 0;
      guildQueue.hasAnnounced = false;

      if (guildQueue.player) {
        guildQueue.player.state.status = null;
      }
    }

    playQueue(interaction, playlist.songs);

    await interaction.followUp({
      content: `✅ Playing Playlist ${playlist.name}`,
    });

    return;
  }

  if (isButton && interaction.customId == "playlist_create") {
    const modal = createPlaylistModal(
      "modal_create_playlist",
      "Create Playlist"
    );
    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === "modal_create_playlist") {
      const playlistName =
        interaction.fields.getTextInputValue("playlist_name");

      const playlistSongs =
        interaction.fields.getTextInputValue("playlist_songs");

      const response = await apiCall(
        "post",
        "youtube-playlist",
        {
          playlist_name: playlistName,
          playlist_songs: playlistSongs,
          guild_id: interaction.guildId,
          user_id: interaction.user.id,
        },
        {
          useAPIKey: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        await interaction.reply({
          content: `✅ Created playlist: **${playlistName}**`,
          ephemeral: true,
        });

        return;
      }

      await interaction.reply({
        content: await response.text(),
        ephemeral: true,
      });
    }

    if (interaction.customId.includes("modal_edit_playlist")) {
      const playlistId = interaction.customId.split("::")[1];
      const playlistSongs =
        interaction.fields.getTextInputValue("playlist_songs");
      const playlistName =
        interaction.fields.getTextInputValue("playlist_name");

      const response = await apiCall(
        "put",
        "youtube-playlist",
        {
          playlist_id: playlistId,
          playlist_songs: playlistSongs,
          playlist_name: playlistName,
          guild_id: interaction.guildId,
          user_id: interaction.user.id,
        },
        {
          useAPIKey: true,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        await interaction.reply({
          content: `✅ Playlist Edited`,
          ephemeral: true,
        });

        return;
      }

      await interaction.reply({
        content: await response.text(),
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

  await slashCommands[commandName].execute(interaction);
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
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply(fallbackMsg).catch((e) => {});
      } else {
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
