import ytdl from "youtube-dl-exec";
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
import { checkAndDisconnect } from "./voice";

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
    tracks = await fetchTracksByTitle(song);
  }

  return tracks;
}

export async function fetchTracks(url: string): Promise<Track[]> {
  return new Promise((resolve, reject) => {
    ytdl(url, {
      dumpSingleJson: true,
      flatPlaylist: true, // Get URLs only
    })
      .then((data) => {
        if (data.entries) {
          // If it's a playlist
          resolve(
            data.entries.map((entry) => ({
              title: entry.title,
              url: entry.url,
            }))
          );
        } else {
          // Single video
          resolve([{ title: data.title, url: url }]);
        }
      })
      .catch(reject);
  });
}

// export async function fetchTracksByTitleMultiple(query: string): Promise<Track[]> {
//   try {
//     const result = await ytdl(`ytsearch5:${query}`, {
//       dumpSingleJson: true,
//       noPlaylist: true,
//     });

//     if (!result.entries || result.entries.length === 0) return [];

//     return result.entries.map((entry) => ({
//       title: entry.title,
//       url: `https://www.youtube.com/watch?v=${entry.id}`,
//     }));
//   } catch (error) {
//     console.error("❌ Error fetching tracks by title:", error);
//     return [];
//   }
// }

export async function fetchTracksByTitle(title: string): Promise<Track[]> {
  return new Promise((resolve, reject) => {
    ytdl(title, {
      dumpSingleJson: true,
      defaultSearch: "ytsearch",
      // flatPlaylist: true,
    })
      .then((data) => {
        if (data.entries && Array.isArray(data.entries)) {
          // Multiple search results
          const tracks = data.entries.map((entry) => ({
            title: entry.title,
            url: `https://www.youtube.com/watch?v=${entry.id}`,
          }));
          resolve(tracks);
        } else {
          // Single result
          resolve([
            {
              title: data.title,
              url: `https://www.youtube.com/watch?v=${data.id}`,
            },
          ]);
        }
      })
      .catch(reject);
  });
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

  if (serverQueue.disconnectTimeout) {
    clearTimeout(serverQueue.disconnectTimeout);
  }

  // If queue is empty, destroy connection and exit
  if (serverQueue.index >= serverQueue.tracks.length) {
    console.log("⏹️ No more songs. Leaving voice channel...");
    serverQueue.disconnectTimeout = setTimeout(() => {
      if (serverQueue.connection?.state.status !== "destroyed") {
        serverQueue.connection.destroy();
        songQueue.delete(interaction.guildId);
      }
    }, Number(process.env.DC_IDLE) || 30000); // Default: 30 sec timeout
    return;
  }

  const track = serverQueue.tracks[serverQueue.index];

  // Skip invalid tracks
  if (!track?.url || (track.title && track.title.includes("Deleted"))) {
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
      await interaction.channel.send(`🎶 Now playing: ${track.url}`);
      serverQueue.hasAnnounced = true; // ✅ Prevent duplicate "Playing now" messages
    }

    if (serverQueue.idleTimeout) {
      clearTimeout(serverQueue.idleTimeout);
    }
  });

  serverQueue.player.once(AudioPlayerStatus.Idle, () => {
    console.log("🎵 Song ended. Playing next...");

    // Reset message flag for the next song
    serverQueue.hasAnnounced = false;

    serverQueue.idleTimeout = setTimeout(() => {
      if (!serverQueue.isLooping) {
        serverQueue.index++;
      }

      checkAndDisconnect(interaction);
      playNext(interaction);
    }, 5000);
  });

  serverQueue.player.on("error", (error) => {
    console.error("❌ Audio player error:", error);
    interaction.channel.send(`⚠️ Error playing: ${track.url}. Skipping...`);
    serverQueue.index++;
    playNext(interaction);
  });
}

export async function playQueue(
  interaction: CommandInteraction | ButtonInteraction,
  tracks: Track[]
) {
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
    interaction.editReply(`Added to queue: ${tracks[0].title}`);
  }
}
