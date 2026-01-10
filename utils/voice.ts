import { getVoiceConnection } from "@discordjs/voice";
import {
  CommandInteraction,
  ModalSubmitInteraction,
  VoiceChannel,
} from "discord.js";

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
  interaction: CommandInteraction | ModalSubmitInteraction
) {
  const connection = getVoiceConnection(interaction.guildId!);

  if (!connection) {
    return false;
  }

  const guild = interaction.client.guilds.cache.get(interaction.guildId!);

  if (!guild) {
    return false;
  }

  const voiceChannel = guild.channels.cache.get(
    connection.joinConfig.channelId!
  ) as VoiceChannel;

  if (!voiceChannel) {
    return false;
  }

  // Check if bot is the only one left
  if (voiceChannel.members.size > 1) {
    return false;
  }

  return true;
}
