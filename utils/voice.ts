import { getVoiceConnection } from "@discordjs/voice";
import {
  CommandInteraction,
  ModalSubmitInteraction,
  VoiceChannel,
} from "discord.js";
import { songQueue } from "../constants";

export function checkCanPlay(interaction: CommandInteraction, song: string) {
  const url = URL.canParse(song) ? new URL(song) : null;

  if (url && url.hostname != "www.youtube.com") {
    return interaction.reply("You must provinde a youtube url");
  }

  // @ts-ignore
  const voiceChannel = interaction.member?.voice?.channel;

  if (!voiceChannel) {
    return interaction.reply("You must be in a voice channel!");
  }
}

export function shouldDisconnect(
  interaction: CommandInteraction | ModalSubmitInteraction,
) {
  const connection = getVoiceConnection(interaction.guildId!);
  const serverQueue = songQueue.get(interaction.guildId);

  if (!connection) {
    return false;
  }

  const guild = interaction.client.guilds.cache.get(interaction.guildId!);

  if (!guild) {
    return false;
  }

  const voiceChannel = guild.channels.cache.get(
    connection.joinConfig.channelId!,
  ) as VoiceChannel;

  if (!voiceChannel) {
    return false;
  }

  if (voiceChannel.members.size > 1 && serverQueue && serverQueue.isRadio) {
    // Check if bot is the only one left
    return false;
  }

  if (
    voiceChannel.members.size > 1 &&
    serverQueue &&
    serverQueue.index < serverQueue.tracks.length
  ) {
    // Check if bot is the only one left
    return false;
  }

  return true;
}
