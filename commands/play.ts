import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  getVoiceConnection,
  AudioPlayerStatus,
} from "@discordjs/voice";
import { songQueue } from "../constants";
import { fetchTracks, fetchTracksByTitle, playNext } from "../utils/youtube";
import { URL } from "url";

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
  const voiceChannel = interaction.member?.voice?.channel;
  const song = interaction.options.getString("song");
  const url = URL.canParse(song) ? new URL(song) : null;

  if (url && url.hostname != "www.youtube.com") {
    return interaction.reply("You must provinde a yotube url");
  }

  const guildId = interaction.guildId;

  if (!voiceChannel) {
    return await interaction.reply("You must be in a voice channel!");
  }

  await interaction.deferReply();

  let tracks = [];

  if (url) {
    tracks = await fetchTracks(url.href);
  } else {
    tracks = await fetchTracksByTitle(song);
  }

  if (!tracks.length) {
    return interaction.editReply("No valid tracks found.");
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
    return interaction.editReply(
      "Song already playing on another voice channel"
    );
  }

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

  const guildQueue = songQueue.get(guildId);
  guildQueue.tracks.push(...tracks);

  if (
    guildQueue.player.state.status !== AudioPlayerStatus.Playing &&
    guildQueue.player.state.status !== AudioPlayerStatus.Buffering
  ) {
    playNext(interaction);

    // Remove old deferred reply
    try {
      await interaction.editReply(`Songs ${tracks.length} Loaded`);
    } catch (error) {
      console.warn("⚠️ No deferred reply to delete.");
    }
  } else {
    interaction.editReply(`Added to queue: ${tracks[0].title}`);
  }
}
