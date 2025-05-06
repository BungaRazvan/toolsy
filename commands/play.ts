import { SlashCommandBuilder, CommandInteraction } from "discord.js";

import { fetchTracksByTitleOrUrl, playQueue } from "../utils/youtube";
import { checkCanPlay } from "../utils/voice";

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
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  const song = interaction.options.getString("song");

  const url = URL.canParse(song) ? new URL(song) : null;

  if (url && url.hostname != "www.youtube.com") {
    return interaction.reply("You must provinde a yotube url");
  }

  const voiceChannel = interaction.member?.voice?.channel;

  if (!voiceChannel) {
    return interaction.reply("You must be in a voice channel!");
  }

  await interaction.deferReply();

  const tracks = await fetchTracksByTitleOrUrl(song);

  if (!tracks.length) {
    return interaction.editReply("No valid tracks found.");
  }

  playQueue(interaction, tracks);
}
