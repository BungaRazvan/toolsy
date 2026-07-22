import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { fetchTracksByTitleOrUrl, playQueue } from "../utils/youtube";
import { captureError, safeEditReply } from "../utils/error";

export const config = {
  name: "play",
  description: "Play a YouTube video (audio only)",
  usage: "/play <url>/<title>",
  slashCommand: true,
};

export const data = new SlashCommandBuilder()
  .setName(config.name)
  .setDescription(config.description)
  .addStringOption((option) =>
    option
      .setName("song")
      .setDescription("Youtube video url or title")
      .setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const song = interaction.options.getString("song", true);
  const url = URL.canParse(song) ? new URL(song) : null;

  if (url && url.hostname !== "www.youtube.com") {
    return interaction.reply("You must provide a YouTube URL");
  }

  const voiceChannel = interaction.member?.voice?.channel;

  if (!voiceChannel) {
    return interaction.reply("You must be in a voice channel!");
  }

  await interaction.deferReply();
  let tracks = [];

  try {
    tracks = await fetchTracksByTitleOrUrl(song);
  } catch (error) {
    captureError(error, "fetchTracksByTitleOrUrl");
    return safeEditReply(
      interaction,
      "⚠️ No valid tracks found. Please try again later.",
    );
  }

  if (!tracks.length) {
    return interaction.editReply("No valid tracks found.");
  }

  playQueue(interaction, tracks);
}
