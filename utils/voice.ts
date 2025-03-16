import { VoiceConnection } from "@discordjs/voice";
import { songQueue } from "../constants";

export function checkAndDisconnect(
  guildId: string,
  connection: VoiceConnection
) {
  const guild = connection.joinConfig.guildId;
  const channel = connection.joinConfig.channelId;

  if (!guild || !channel) return;

  const voiceChannel = interaction.client.guilds.cache
    .get(guildId)
    ?.channels.cache.get(channel);

  if (!voiceChannel) return;

  // Check if bot is the only one left
  if (voiceChannel.members.size === 1) {
    console.log("👋 Leaving due to inactivity...");
    setTimeout(() => {
      if (voiceChannel.members.size === 1) {
        connection.destroy();
        songQueue.delete(guildId);
      }
    }, 60000); // 60 seconds before leaving
  }
}
