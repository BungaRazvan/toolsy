import { getVoiceConnection } from "@discordjs/voice";
import { songQueue } from "../constants";
import {
  ButtonInteraction,
  CommandInteraction,
  VoiceChannel,
} from "discord.js";

export function checkCanPlay(interaction: CommandInteraction, song: string) {
  const url = URL.canParse(song) ? new URL(song) : null;

  if (url && url.hostname != "www.youtube.com") {
    return interaction.reply("You must provinde a yotube url");
  }

  const voiceChannel = interaction.member?.voice?.channel;

  if (!voiceChannel) {
    return interaction.reply("You must be in a voice channel!");
  }
}

export function checkAndDisconnect(
  interaction: CommandInteraction | ButtonInteraction
) {
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
