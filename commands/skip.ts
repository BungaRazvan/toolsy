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
  .setDescription(config.description);

export async function execute(interaction: CommandInteraction) {
  const voiceChannel = interaction.member?.voice?.channel;

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

  await interaction.deferReply();

  const serverQueue = songQueue.get(interaction.guildId);

  if (!serverQueue) {
    return;
  }

  serverQueue.index++;
  playNext(interaction);
}
