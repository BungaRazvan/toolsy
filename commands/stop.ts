import {
  CommandInteraction,
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";

import { songQueue } from "../constants";
import { getVoiceConnection } from "@discordjs/voice";

import Sentry from "@sentry/node";

export const config = {
  name: "stop",
  description: "Stop song from playing and clears queue",
  usage: "/stop",
  slashCommand: true,
};

export const data = new SlashCommandBuilder()
  .setName(config.name)
  .setDescription(config.description);

export async function execute(interaction: CommandInteraction) {
  // @ts-ignore
  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    return interaction.reply({
      content: "Not connected to voice channel",
      flags: MessageFlags.Ephemeral,
    });
  }

  const guildId = interaction.guildId;
  const connection = getVoiceConnection(guildId!);

  if (!connection) {
    return interaction.reply({
      content: "Bot not connected to the voice channel",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (connection && connection.joinConfig.channelId !== voiceChannel.id) {
    return interaction.reply({
      content: "Not connected to the correct voice channel",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (!songQueue.has(guildId)) {
    return interaction.reply({
      content: "❌ No active song queue.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const serverQueue = songQueue.get(guildId);

  try {
    serverQueue.player.stop();
    songQueue.delete(guildId);

    return interaction.reply("⏹️ Stopped playback and cleared queue.");
  } catch (error) {
    Sentry.captureException(error);

    return interaction.reply("Failed to stop playback");
  }
}
