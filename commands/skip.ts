import {
  CommandInteraction,
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";
import { captureError, safeEditReply } from "../utils/error";

import { getVoiceConnection } from "@discordjs/voice";
import { playNext } from "../utils/youtube";
import { songQueue } from "../constants";

export const config = {
  name: "skip",
  description: "Skip a song",
  usage: "/skip",
  slashCommand: true,
};

export const data = new SlashCommandBuilder()
  .setName(config.name)
  .setDescription(config.description)
  .addIntegerOption((option) =>
    option
      .setName("number")
      .setDescription("Number of songs to skip")
      .setRequired(false),
  );

export async function execute(interaction: CommandInteraction) {
  // @ts-ignore
  const voiceChannel = interaction.member?.voice?.channel;
  // @ts-ignore
  let number = interaction.options.getInteger("number");
  let skip_no = 1;

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
      content: "Bot not connected to voice channel",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (connection && connection.joinConfig.channelId !== voiceChannel.id) {
    return interaction.reply({
      content: "Bot not connected to the correct voice channel",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (number) {
    skip_no = Number(number);
  }

  const serverQueue = songQueue.get(interaction.guildId);

  if (!serverQueue) {
    return interaction.reply({
      content: "❌ No active song queue.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const index = serverQueue.index + skip_no;

  if (index > serverQueue.tracks.length - 1) {
    return interaction.reply({
      content: `No next song to play`,
      flags: MessageFlags.Ephemeral,
    });
  }

  serverQueue.index = index;
  serverQueue.hasAnnounced = false;

  await interaction.deferReply();
  playNext(interaction);

  // Remove old deferred reply
  try {
    await safeEditReply(interaction, "Song skipped");
  } catch (error) {
    captureError(error, "skipCommandEditReply");
  }
}
