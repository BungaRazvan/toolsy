import { isRadioQueueItem, ServerQueue, songQueue, Track } from "../constants";
import {
  ChatInputCommandInteraction,
  CommandInteraction,
  ModalSubmitInteraction,
  TextBasedChannel,
} from "discord.js";
import {
  AudioPlayerStatus,
  createAudioResource,
  StreamType,
} from "@discordjs/voice";
import {
  ensureVoiceChannel,
  getOrJoinVoiceConnection,
  shouldDisconnect,
} from "./voice";
import { captureError } from "./error";
import { playRadio } from "./radio";
import youtubedl from "youtube-dl-exec";
import {
  cancelScheduledDeletion,
  createQueue,
  deleteQueue,
  removeRadioItems,
  scheduleQueueAction,
} from "./queue";

const playbackAttempts = new WeakMap<ServerQueue, object>();

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

type InteractionWithVoice =
  | ChatInputCommandInteraction
  | CommandInteraction
  | ModalSubmitInteraction;

export async function playNext(interaction: InteractionWithVoice) {
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
    const channel = interaction.channel as TextBasedChannel;
    // @ts-ignore
    channel?.send("⚠️ No more songs. Leaving Soon").catch(() => {});

    scheduleQueueAction(serverQueue, () => {
      deleteQueue(guildId);
      console.log("⏹️ No more songs. Leaving voice channel...");
    });
    return;
  }

  const queueItem = serverQueue.tracks[serverQueue.index]!;
  if (isRadioQueueItem(queueItem)) {
    playRadio(serverQueue, queueItem, interaction);
    return;
  }

  const track = queueItem;
  const playbackAttempt = {};
  playbackAttempts.set(serverQueue, playbackAttempt);

  console.log("▶️ Now playing:", track.url);

  const skipFailedTrack = (error: unknown, context: string) => {
    if (
      playbackAttempts.get(serverQueue) !== playbackAttempt ||
      songQueue.get(guildId) !== serverQueue
    ) {
      return;
    }

    playbackAttempts.delete(serverQueue);
    cancelScheduledDeletion(serverQueue);
    captureError(error, context, { guild_id: guildId });
    serverQueue.player.removeAllListeners();
    serverQueue.player.stop(true);

    const channel = interaction.channel;
    if (channel?.isSendable()) {
      void channel
        .send("⚠️ Failed to play song. Skipping to the next track.")
        .catch((notificationError: unknown) =>
          captureError(notificationError, "trackFailureNotification", {
            guild_id: guildId,
          }),
        );
    }

    serverQueue.index++;
    void playNext(interaction).catch((nextTrackError) =>
      captureError(nextTrackError, "nextTrackAfterFailure", {
        guild_id: guildId,
      }),
    );
  };

  try {
    const audio = youtubedl.exec(
      track.url,
      {
        format: "bestaudio/best",
        noPlaylist: true,
        quiet: true,
        noWarnings: true,
        output: "-",
        // @ts-expect-error yt-dlp supports this option; youtube-dl-exec's Flags type omits it.
        extractorArgs: "youtube:player_client=android,ios,mweb",
      },
      {
        stdio: ["ignore", "pipe", "pipe"],
        reject: false,
      },
    );

    void audio
      .then(({ error }) => {
        if (error) {
          skipFailedTrack(error, "youtubeDownload");
        }
      })
      .catch((error) => skipFailedTrack(error, "youtubeDownload"));

    if (!audio || !audio.stdout) {
      throw new Error("Unable to create audio stream from URL");
    }

    const resource = createAudioResource(audio.stdout, {
      inputType: StreamType.Arbitrary,
    }) as any;

    serverQueue.player.play(resource);
  } catch (error) {
    skipFailedTrack(error, "audioResourceCreation");
    return;
  }

  serverQueue.player.once(AudioPlayerStatus.Playing, async () => {
    if (!serverQueue.hasAnnounced && !serverQueue.isLooping) {
      // @ts-ignore
      await interaction.channel!.send(`🎶 Now playing: ${track.url}`);
      serverQueue.hasAnnounced = true; // ✅ Prevent duplicate "Playing now" messages
    }

    cancelScheduledDeletion(serverQueue);
  });

  serverQueue.player.once(AudioPlayerStatus.Idle, () => {
    console.log("🎵 Song ended. Playing next...");

    const nextItem = serverQueue.tracks[serverQueue.index + 1];
    if (nextItem && isRadioQueueItem(nextItem)) {
      serverQueue.index++;
      serverQueue.isLooping = false;
      playRadio(serverQueue, nextItem, interaction);
      return;
    }

    if (serverQueue.index >= serverQueue.tracks.length) {
      // @ts-ignore
      interaction.channel.send("⚠️ No more songs. Leaving Soon");
    } else {
      console.log("👋 Leaving soon due to inactivity...");
    }

    // Reset message flag for the next song
    serverQueue.hasAnnounced = false;

    scheduleQueueAction(serverQueue, () => {
      if (!serverQueue.isLooping) {
        serverQueue.index++;
      }

      if (shouldDisconnect(interaction)) {
        deleteQueue(guildId);
        return;
      }

      playNext(interaction);
    });
  });

  serverQueue.player.on("error", (error: Error) => {
    skipFailedTrack(error, "audioPlayer");
  });
}

export async function playQueue(
  interaction: InteractionWithVoice,
  tracks: Track[],
) {
  const voiceChannel = ensureVoiceChannel(
    interaction,
    "You must be in a voice channel!",
  );

  if (!voiceChannel) {
    return;
  }

  const guildId = interaction.guildId!;
  const connection = getOrJoinVoiceConnection(interaction, voiceChannel);

  if (!connection) {
    return;
  }

  const guildQueue = createQueue(guildId, connection);
  const replacingRadio = guildQueue.isRadio;

  if (replacingRadio) {
    cancelScheduledDeletion(guildQueue);
    guildQueue.player.removeAllListeners();
    guildQueue.player.stop(true);
    guildQueue.isRadio = false;
    guildQueue.hasAnnounced = false;
    const currentItem = guildQueue.tracks[guildQueue.index];
    if (currentItem && isRadioQueueItem(currentItem)) {
      currentItem.resource.playStream.destroy();
      guildQueue.tracks.splice(guildQueue.index, 1);
    }
  }

  removeRadioItems(guildQueue);
  if (replacingRadio) {
    guildQueue.tracks.splice(guildQueue.index, 0, ...tracks);
  } else {
    guildQueue.tracks.push(...tracks);
  }

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
