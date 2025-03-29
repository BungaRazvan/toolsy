import ytdl from "youtube-dl-exec";
import { songQueue } from "../constants";
import { CommandInteraction } from "discord.js";
import {
  AudioPlayerStatus,
  createAudioResource,
  StreamType,
} from "@discordjs/voice";
import { spawn } from "child_process";
import { checkAndDisconnect } from "./voice";

type Track = {
  title: string;
  url: string;
};

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

export async function playNext(interaction: CommandInteraction) {
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
    }, process.env.DC_IDLE);
  });

  serverQueue.player.on("error", (error) => {
    console.error("❌ Audio player error:", error);
    interaction.channel.send(`⚠️ Error playing: ${track.url}. Skipping...`);
    serverQueue.index++;
    playNext(interaction);
  });
}
