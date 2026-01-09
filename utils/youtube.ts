import { songQueue } from "../constants";
import { ButtonInteraction, CommandInteraction } from "discord.js";
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
  StreamType,
} from "@discordjs/voice";
import { spawn } from "child_process";
import { shouldDisconnect } from "./voice";

type Track = {
  title: string;
  url: string;
};

export async function fetchTracksByTitleOrUrl(song: string) {
  const url = URL.canParse(song) ? new URL(song) : null;
  let tracks = [];

  if (url) {
    tracks = await fetchTracks(url.href);
  } else {
    tracks = await fetchTracks(null, song);
  }

  return tracks;
}

export async function fetchTracks(
  url: string | null = null,
  title: string | null = null
): Promise<Track[]> {
  let params = null;

  if (url) {
    params = new URLSearchParams({ url });
  } else {
    // @ts-ignore
    params = new URLSearchParams({ title });
  }

  const response = await fetch(
    `${process.env.API_URL}/discord/get-youtube-tracks?${params}`
  );

  return response.json();
}

export async function playNext(
  interaction: CommandInteraction | ButtonInteraction
) {
  const serverQueue = songQueue.get(interaction.guildId);

  if (!serverQueue) {
    return;
  }

  // Prevent duplicate event listeners
  serverQueue.player.removeAllListeners(AudioPlayerStatus.Idle);

  // If queue is empty, destroy connection and exit
  if (serverQueue.index >= serverQueue.tracks.length) {
    serverQueue.disconnectTimeout = setTimeout(() => {
      if (serverQueue.connection?.state.status !== "destroyed") {
        serverQueue.connection.destroy();
        songQueue.delete(interaction.guildId);
        console.log("⏹️ No more songs. Leaving voice channel...");
      }
    }, Number(process.env.DC_IDLE) || 30000);
    return;
  }

  const track = serverQueue.tracks[serverQueue.index]!;

  // Skip invalid tracks
  if (!track.url || (track.title && track.title.includes("Deleted"))) {
    console.warn("⚠️ Skipping invalid track:", track.title);
    serverQueue.index++;
    return playNext(interaction);
  }

  console.log("▶️ Now playing:", track.url);

  const audio = spawn("yt-dlp", [
    "-f",
    "bestaudio",
    "-o",
    "-",
    "--no-playlist",
    "--quiet",
    "--default-search",
    "ytsearch",
    track.url,
  ]);

  const resource = createAudioResource(audio.stdout, {
    inputType: StreamType.Arbitrary,
  });

  serverQueue.player.play(resource);

  serverQueue.player.once(AudioPlayerStatus.Playing, async () => {
    if (!serverQueue.hasAnnounced && !serverQueue.isLooping) {
      // @ts-ignore
      await interaction.channel!.send(`🎶 Now playing: ${track.url}`);
      serverQueue.hasAnnounced = true; // ✅ Prevent duplicate "Playing now" messages
    }

    if (serverQueue.disconnectTimeout) {
      clearTimeout(serverQueue.disconnectTimeout);
      serverQueue.disconnectTimeout = null;
    }
  });

  serverQueue.player.once(AudioPlayerStatus.Idle, () => {
    console.log("🎵 Song ended. Playing next...");

    // Reset message flag for the next song
    serverQueue.hasAnnounced = false;

    serverQueue.disconnectTimeout = setTimeout(() => {
      if (!serverQueue.isLooping) {
        serverQueue.index++;
      }

      if (shouldDisconnect(interaction)) {
        const connection = getVoiceConnection(interaction.guildId!)!;
        connection.destroy();
        songQueue.delete(interaction.guildId!);
        console.log("👋 Leaving due to inactivity...");
        return;
      }

      playNext(interaction);
    }, Number(process.env.DC_IDLE) || 30000);
  });

  serverQueue.player.on("error", (error: any) => {
    console.error("❌ Audio player error:", error);
    // @ts-ignore
    interaction.channel!.send(`⚠️ Error playing: ${track.url}. Skipping...`);
    serverQueue.index++;
    playNext(interaction);
  });
}

export async function playQueue(
  interaction: CommandInteraction | ButtonInteraction,
  tracks: Track[]
) {
  // @ts-ignore
  const voiceChannel = interaction.member?.voice?.channel;

  if (!voiceChannel) {
    return;
  }

  const guildId = interaction.guildId;

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

    try {
      await interaction.editReply(`Songs ${tracks.length} Loaded`);
    } catch (error) {
      console.warn("⚠️ No deferred reply to delete.");
    }
  } else {
    if (tracks.length > 1) {
      return interaction.editReply(`Added to queue: ${tracks.length} songs`);
    }

    if (!tracks.length) {
      return interaction.editReply("No valid tracks found.");
    }

    interaction.editReply(`Added to queue: ${tracks[0].title}`);
  }
}
