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
  const serverQueue = songQueue.get(interaction.guildId!);

  if (!connection || !serverQueue) {
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

  const hasHumanMembers = voiceChannel.members.some(
    (member) => !member.user.bot,
  );

  if (serverQueue.isRadio) {
    return !hasHumanMembers;
  }

  return !hasHumanMembers || serverQueue.index >= serverQueue.tracks.length;
}
