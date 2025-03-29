import { getVoiceConnection } from "@discordjs/voice";
import { songQueue } from "../constants";
import { CommandInteraction, VoiceChannel } from "discord.js";

export function checkAndDisconnect(interaction: CommandInteraction) {
  const connection = getVoiceConnection(interaction.guildId!);

  if (!connection) {
    return;
  }

  const guild = interaction.client.guilds.cache.get(interaction.guildId!);

  if (!guild) {
    return;
  }

  const voiceChannel = guild.channels.cache.get(
    connection.joinConfig.channelId!
  ) as VoiceChannel;

  if (!voiceChannel) {
    return;
  }

  if (voiceChannel.members.size > 1) {
    return;
  }

  // Check if bot is the only one left
  console.log("👋 Leaving due to inactivity...");

  connection.destroy();
  songQueue.delete(interaction.guildId!);
}
