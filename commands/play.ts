import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  getVoiceConnection,
  AudioPlayerStatus,
} from "@discordjs/voice";
import { songQueue } from "../constants";
import { fetchTracks, playNext } from "../utils/youtube";

export const config = {
  name: "play",
  description: "Play a YouTube video (audio only)",
  usage: "/play <url>",
  slashCommand: true,
};

export const data = new SlashCommandBuilder()
  .setName(config.name)
  .setDescription(config.description)
  .addStringOption((option) =>
    option.setName("url").setDescription("YouTube URL").setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  const voiceChannel = interaction.member?.voice?.channel;
  const url = interaction.options.getString("url");

  const guildId = interaction.guildId;

  if (!voiceChannel) {
    return await interaction.reply("You must be in a voice channel!");
  }

  if (!url) {
    return await interaction.reply("You must provide a YouTube URL!");
  }

  let connection = getVoiceConnection(guildId!);

  if (!connection) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
  } else if (
    connection &&
    connection.joinConfig.channelId !== voiceChannel.id
  ) {
    return await interaction.reply(
      "Song already playing on another voice channel"
    );
  }

  await interaction.deferReply();

  if (!songQueue.has(guildId)) {
    const player = createAudioPlayer();
    connection.subscribe(player);
    songQueue.set(guildId, {
      tracks: [],
      index: 0,
      disconnectTimeout: null,
      connection,
      player,
    });
  }

  const tracks = await fetchTracks(url);

  if (!tracks.length) {
    return interaction.editReply("No valid tracks found.");
  }

  const guildQueue = songQueue.get(guildId);
  guildQueue.tracks.push(...tracks);

  if (
    guildQueue.player.state.status !== AudioPlayerStatus.Playing &&
    guildQueue.player.state.status !== AudioPlayerStatus.Buffering
  ) {
    playNext(interaction);

    // Remove old deferred reply
    try {
      await interaction.editReply("Songs Loaded");
    } catch (error) {
      console.warn("⚠️ No deferred reply to delete.");
    }
  } else {
    interaction.editReply(`Added to queue: ${tracks[0].title}`);
  }
}
