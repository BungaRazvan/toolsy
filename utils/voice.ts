import {
  getVoiceConnection,
  joinVoiceChannel,
  VoiceConnection,
} from "@discordjs/voice";
import {
  CommandInteraction,
  ModalSubmitInteraction,
  VoiceChannel,
  ChatInputCommandInteraction,
} from "discord.js";
import { songQueue } from "../constants";

export type VoiceCommandInteraction =
  | ChatInputCommandInteraction
  | CommandInteraction
  | ModalSubmitInteraction;

export function getInteractionVoiceChannel(
  interaction: VoiceCommandInteraction,
): VoiceChannel | null {
  // @ts-ignore - Discord member payload is available on guild interactions.
  return interaction.member?.voice?.channel ?? null;
}

function sendInteractionReply(
  interaction: VoiceCommandInteraction,
  message: string,
) {
  if (interaction.deferred || interaction.replied) {
    return void interaction.editReply(message);
  }

  return void interaction.reply(message);
}

export function ensureVoiceChannel(
  interaction: VoiceCommandInteraction,
  message = "You must be in a voice channel!",
): VoiceChannel | null {
  const voiceChannel = getInteractionVoiceChannel(interaction);

  if (!voiceChannel) {
    sendInteractionReply(interaction, message);
    return null;
  }

  return voiceChannel;
}

export function getOrJoinVoiceConnection(
  interaction: VoiceCommandInteraction,
  voiceChannel: VoiceChannel,
): VoiceConnection | null {
  const guildId = interaction.guildId!;
  let connection = getVoiceConnection(guildId);

  if (!connection) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
  } else if (connection.joinConfig.channelId !== voiceChannel.id) {
    sendInteractionReply(
      interaction,
      "Song already playing on another voice channel",
    );
    return null;
  }

  return connection;
}

export function checkCanPlay(
  interaction: VoiceCommandInteraction,
  song: string,
): VoiceChannel | null {
  const url = URL.canParse(song) ? new URL(song) : null;

  if (url && url.hostname !== "www.youtube.com") {
    sendInteractionReply(interaction, "You must provide a YouTube URL");
    return null;
  }

  return ensureVoiceChannel(interaction);
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
