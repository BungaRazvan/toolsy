import {
  CommandInteraction,
  SlashCommandBuilder,
  MessageFlags,
} from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { songQueue } from "../constants";

export const config = {
  name: "loop",
  description: "Set playing song to loop or not",
  usage: "/loop",
  slashCommand: true,
};

export const data = new SlashCommandBuilder()
  .setName(config.name)
  .setDescription(config.description);

export async function execute(interaction: CommandInteraction) {
  // @ts-ignore
  const voiceChannel = interaction.member?.voice?.channel;

  if (!voiceChannel) {
    return interaction.reply({
      content: "Not connected to voice channel",
      flags: MessageFlags.Ephemeral,
    });
  }

  const guildId = interaction.guildId;
  const connection = getVoiceConnection(guildId!);

  if (!connection) {
    return interaction.reply({
      content: "Bot not connected to voice channel",
      flags: MessageFlags.Ephemeral,
    });
  }

  if (connection && connection.joinConfig.channelId !== voiceChannel.id) {
    return interaction.reply({
      content: "Bot not connected to the correct voice channel",
      flags: MessageFlags.Ephemeral,
    });
  }

  const serverQueue = songQueue.get(interaction.guildId);

  if (!serverQueue) {
    return interaction.reply({
      content: "❌ No active song queue.",
      flags: MessageFlags.Ephemeral,
    });
  }

  serverQueue.isLooping = !serverQueue.isLooping;

  return interaction.reply(
    `🔁 Looping is now **${serverQueue.isLooping ? "enabled" : "disabled"}**.`,
  );
}
