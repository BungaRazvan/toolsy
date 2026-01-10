import {
  MessageFlags,
  ButtonInteraction,
  ModalSubmitInteraction,
  CommandInteraction,
} from "discord.js";

import { songQueue } from "../constants";
import { playQueue } from "../utils/youtube";
import { createPlaylistModal } from "../utils/playlist";
import { apiCall } from "../utils/api";

export async function handlePlaylistInteraction(
  interaction: ButtonInteraction | ModalSubmitInteraction,
  isButton: boolean,
  isModalSubmit: boolean,
  customId: string
) {
  if (isButton) {
    if (customId.includes("playlist_delete")) {
      const playlistId = customId.split("::")[1];

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
        // @ts-ignore
        await interaction.reply({
          content: await response.text(),
          ephemeral: true,
        });
        return;
      }

      // @ts-ignore
      await interaction.reply({
        content: `✅ Deleted playlist`,
        ephemeral: true,
      });
    }

    if (customId.includes("playlist_edit")) {
      const playlistId = customId.split("::")[1];

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
        // @ts-ignore
        await interaction.reply({
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
      // @ts-ignore
      await interaction.showModal(modal);
    }

    if (customId.includes("playlist_play")) {
      const guildId = interaction.guildId;

      // @ts-ignore
      const voiceChannel = interaction.member?.voice?.channel;

      if (!voiceChannel) {
        // @ts-ignore
        return interaction.reply({
          content: "You must be in a voice channel!",
          flags: MessageFlags.Ephemeral,
        });
      }

      const playlistId = customId.split("::")[1];

      // @ts-ignore
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
        // @ts-ignore
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

      // @ts-ignore
      playQueue(interaction, playlist.songs);

      // @ts-ignore
      await interaction.followUp({
        content: `✅ Playing Playlist ${playlist.name}`,
      });

      return;
    }

    if (customId == "playlist_create") {
      const modal = createPlaylistModal(
        "modal_create_playlist",
        "Create Playlist"
      );
      // @ts-ignore
      await interaction.showModal(modal);
    }
  }

  if (isModalSubmit) {
    if (customId === "modal_create_playlist") {
      const playlistName =
        // @ts-ignore
        interaction.fields.getTextInputValue("playlist_name");

      const playlistSongs =
        // @ts-ignore
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
        // @ts-ignore
        await interaction.reply({
          content: `✅ Created playlist: **${playlistName}**`,
          ephemeral: true,
        });

        return;
      }

      // @ts-ignore
      await interaction.reply({
        content: await response.text(),
        ephemeral: true,
      });
    }

    // @ts-ignore
    if (customId.includes("modal_edit_playlist")) {
      const playlistId = customId.split("::")[1];

      const playlistSongs =
        // @ts-ignore
        interaction.fields.getTextInputValue("playlist_songs");
      const playlistName =
        // @ts-ignore
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
        // @ts-ignore
        await interaction.reply({
          content: `✅ Playlist Edited`,
          ephemeral: true,
        });

        return;
      }

      // @ts-ignore
      await interaction.reply({
        content: await response.text(),
        ephemeral: true,
      });
    }
  }
}
