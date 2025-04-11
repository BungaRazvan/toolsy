import { CommandInteraction, SlashCommandBuilder } from "discord.js";

import { songQueue, loopSong } from "../constants";
import { AudioPlayerStatus, getVoiceConnection } from "@discordjs/voice";
import { checkAndDisconnect } from "../utils/voice";

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

  if (!songQueue.has(guildId)) {
    return;
  }

  const guildQueue = songQueue.get(guildId);

  if (
    guildQueue.player.state.status == AudioPlayerStatus.Playing ||
    guildQueue.player.state.status == AudioPlayerStatus.Buffering
  ) {
    guildQueue.player.stop();
    guildQueue.idleTimeout = setTimeout(() => {
      checkAndDisconnect(interaction);
    }, process.env.DC_IDLE);
    songQueue.delete(interaction.guildId);

    return interaction.reply("⏹️ Stopped playback and cleared queue.");
  }

  return interaction.reply("Failed to stop playback");
}
