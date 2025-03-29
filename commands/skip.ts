import { CommandInteraction, SlashCommandBuilder } from "discord.js";

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
      .setRequired(false)
  );

export async function execute(interaction: CommandInteraction) {
  const voiceChannel = interaction.member?.voice?.channel;
  let number = interaction.options.getInteger("number");
  let skip_no = 1;

  if (!voiceChannel) {
    return;
  }

  const guildId = interaction.guildId;

  let connection = getVoiceConnection(guildId!);

  if (!connection) {
    return;
  }

  if (connection && connection.joinConfig.channelId !== voiceChannel.id) {
    return;
  }

  if (number) {
    skip_no = Number(number);
  }

  await interaction.deferReply();

  const serverQueue = songQueue.get(interaction.guildId);

  if (!serverQueue) {
    return;
  }

  const index = serverQueue.index + skip_no;

  if (index > serverQueue.tracks.length) {
    interaction.reply(
      `Skip number ${index} is greater then the length of the playlist: ${serverQueue.tracks.length}`
    );
    return;
  }

  serverQueue.index = index;
  serverQueue.hasAnnounced = false;
  playNext(interaction);

  // Remove old deferred reply
  try {
    await interaction.editReply("Song skipped");
  } catch (error) {
    console.warn("⚠️ No deferred reply to delete.");
  }
}
