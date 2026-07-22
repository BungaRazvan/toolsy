import { songQueue, Track } from "../constants";
import {
  ChatInputCommandInteraction,
  ModalSubmitInteraction,
  TextBasedChannel,
} from "discord.js";
import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  joinVoiceChannel,
  StreamType,
} from "@discordjs/voice";
import { shouldDisconnect } from "./voice";
import youtubedl from "youtube-dl-exec";

export async function fetchTracksByTitleOrUrl(song: string) {
  const trimmedSong = song?.trim();

  if (!trimmedSong) {
    throw new Error("Song title or URL is required");
  }

  const url = URL.canParse(trimmedSong) ? new URL(trimmedSong) : null;

  if (url) {
    return await fetchTracks(url.href);
  }

  return await fetchTracks(null, trimmedSong);
}

export async function fetchTracks(
  url: string | null = null,
  title: string | null = null,
): Promise<Track[]> {
  if (!process.env.API_URL) {
    throw new Error("Missing API_URL environment variable");
  }

  let params: URLSearchParams;

  if (url) {
    params = new URLSearchParams({ url });
  } else if (title) {
    params = new URLSearchParams({ title });
  } else {
    throw new Error("Missing url or title for fetchTracks");
  }

  const response = await fetch(
    `${process.env.API_URL}/discord/get-youtube-tracks?${params}`,
  );

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => "<unable to read response>");

    throw new Error(
      `Failed to fetch tracks: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return response.json();
}

export async function playNext(
  interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
) {
  if (!interaction.guildId) {
    return;
  }

  const guildId = interaction.guildId;
  const serverQueue = songQueue.get(guildId);

  if (!serverQueue) {
    return;
  }

  serverQueue.player.removeAllListeners();

  while (serverQueue.index < serverQueue.tracks.length) {
    const nextTrack = serverQueue.tracks[serverQueue.index];

    if (
      !nextTrack ||
      !nextTrack.url ||
      (nextTrack.title && nextTrack.title.includes("Deleted"))
    ) {
      console.warn("⚠️ Skipping invalid track at index:", serverQueue.index);
      serverQueue.index++;
      continue;
    }

    break;
  }

  if (serverQueue.index >= serverQueue.tracks.length) {
    const channel = interaction.channel as TextBasedChannel | null;
    channel?.send("⚠️ No more songs. Leaving Soon").catch(() => {});

    serverQueue.disconnectTimeout = setTimeout(() => {
      serverQueue.connection.destroy();
      songQueue.delete(interaction.guildId!);
      console.log("⏹️ No more songs. Leaving voice channel...");
    }, Number(process.env.DC_IDLE));
    return;
  }

  const track = serverQueue.tracks[serverQueue.index]!;

  console.log("▶️ Now playing:", track.url);

  try {
    const audio = youtubedl.exec(
      track.url,
      {
        format: "bestaudio/best",
        noPlaylist: true,
        quiet: true,
        noWarnings: true,
        output: "-",
      },
      {
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    if (!audio || !audio.stdout) {
      throw new Error("Unable to create audio stream from URL");
    }

    const resource = createAudioResource(audio.stdout, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
    }) as any;

    serverQueue.player.play(resource);
  } catch (error) {
    console.error("❌ Failed to create audio resource:", error);
    const channel = interaction.channel as TextBasedChannel | null;
    channel
      ?.send("⚠️ Failed to play song. Skipping to next track.")
      .catch(() => {});
    serverQueue.index++;
    return playNext(interaction);
  }

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

    if (serverQueue.index >= serverQueue.tracks.length) {
      // @ts-ignore
      interaction.channel.send("⚠️ No more songs. Leaving Soon");
    } else {
      console.log("👋 Leaving soon due to inactivity...");
    }

    // Reset message flag for the next song
    serverQueue.hasAnnounced = false;

    serverQueue.disconnectTimeout = setTimeout(() => {
      if (!serverQueue.isLooping) {
        serverQueue.index++;
      }

      if (shouldDisconnect(interaction)) {
        serverQueue.connection.destroy();
        songQueue.delete(interaction.guildId!);
        return;
      }

      playNext(interaction);
    }, Number(process.env.DC_IDLE));
  });

  serverQueue.player.on("error", (error: Error) => {
    console.error("❌ Audio player error:", error);
    const channel = interaction.channel as TextBasedChannel | null;
    channel
      ?.send(`⚠️ Error playing: ${track.url}. Skipping...`)
      .catch(() => {});
    serverQueue.index++;
    playNext(interaction);
  });
}

export async function playQueue(
  interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
  tracks: Track[],
) {
  // @ts-ignore
  const voiceChannel = interaction.member?.voice?.channel;

  if (!voiceChannel) {
    return;
  }

  const guildId = interaction.guildId!;

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
      "Song already playing on another voice channel",
    );
  }

  if (!songQueue.has(guildId)) {
    const player = createAudioPlayer();
    connection.subscribe(player);
    songQueue.set(guildId, {
      tracks: [],
      index: 0,
      disconnectTimeout: null,
      disconnectInterval: null,
      connection,
      player,
      hasAnnounced: false,
      isLooping: false,
      isRadio: false,
    });
  }

  const guildQueue = songQueue.get(guildId);
  if (!guildQueue) {
    return;
  }

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

    return interaction.editReply(`Added to queue: ${tracks[0].title}`);
  }
}
