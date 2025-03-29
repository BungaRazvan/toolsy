import { CommandInteraction, SlashCommandBuilder } from "discord.js";
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

  const serverQueue = songQueue.get(interaction.guildId);

  if (!serverQueue) {
    return interaction.reply("❌ No active song queue.");
  }

  serverQueue.isLooping = !serverQueue.isLooping;

  return interaction.reply(
    `🔁 Looping is now **${serverQueue.isLooping ? "enabled" : "disabled"}**.`
  );
}
