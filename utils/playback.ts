import { isRadioQueueItem, songQueue } from "../constants";
import type { QueueItem, ServerQueue } from "../constants";
import { findIndex } from "lodash";
import {
  ChatInputCommandInteraction,
  CommandInteraction,
  ModalSubmitInteraction,
  TextBasedChannel,
} from "discord.js";
import { AudioPlayerStatus } from "@discordjs/voice";
import {
  ensureVoiceChannel,
  getOrJoinVoiceConnection,
  shouldDisconnect,
} from "./voice";
import { captureError } from "./error";
import { playRadio } from "./radio";
import { playYoutube } from "./youtube";
import {
  cancelScheduledDeletion,
  createQueue,
  deleteQueue,
  scheduleQueueAction,
} from "./queue";

const playbackAttempts = new WeakMap<ServerQueue, object>();

export type InteractionWithVoice =
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
    playbackAttempts.delete(serverQueue);
    try {
      await playRadio(serverQueue, queueItem, interaction);
    } catch (error) {
      captureError(error, "radioStream", { guild_id: guildId });
      const channel = interaction.channel;
      if (channel?.isSendable()) {
        void channel
          .send("⚠️ Failed to connect to the radio stream. Skipping it.")
          .catch((notificationError: unknown) =>
            captureError(notificationError, "radioFailureNotification", {
              guild_id: guildId,
            }),
          );
      }

      if (serverQueue.tracks[serverQueue.index] === queueItem) {
        serverQueue.tracks.splice(serverQueue.index, 1);
      }
      serverQueue.isRadio = false;
      await playNext(interaction);
    }
    return;
  }

  cancelScheduledDeletion(serverQueue);
  serverQueue.isRadio = false;
  serverQueue.hasAnnounced = false;

  const playbackAttempt = {};
  playbackAttempts.set(serverQueue, playbackAttempt);
  serverQueue.player.removeAllListeners();

  console.log("▶️ Now playing:", queueItem.url);

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
    playYoutube(serverQueue.player, queueItem, (error) =>
      skipFailedTrack(error, "youtubeDownload"),
    );
  } catch (error) {
    skipFailedTrack(error, "audioResourceCreation");
    return;
  }

  serverQueue.player.once(AudioPlayerStatus.Playing, async () => {
    if (!serverQueue.hasAnnounced && !serverQueue.isLooping) {
      // @ts-ignore
      await interaction.channel!.send(`🎶 Now playing: ${queueItem.url}`);
      serverQueue.hasAnnounced = true;
    }

    cancelScheduledDeletion(serverQueue);
  });

  serverQueue.player.once(AudioPlayerStatus.Idle, () => {
    console.log("🎵 Song ended. Playing next...");

    const nextItem = serverQueue.tracks[serverQueue.index + 1];
    if (nextItem && isRadioQueueItem(nextItem)) {
      serverQueue.index++;
      serverQueue.isLooping = false;
      serverQueue.isRadio = true;
      void playNext(interaction).catch((nextTrackError) =>
        captureError(nextTrackError, "nextTrackPlayback", {
          guild_id: guildId,
        }),
      );
      return;
    }

    if (serverQueue.index >= serverQueue.tracks.length) {
      // @ts-ignore
      interaction.channel.send("⚠️ No more songs. Leaving Soon");
    } else {
      console.log("👋 Leaving soon due to inactivity...");
    }

    serverQueue.hasAnnounced = false;

    scheduleQueueAction(serverQueue, () => {
      if (!serverQueue.isLooping) {
        serverQueue.index++;
      }

      if (shouldDisconnect(interaction)) {
        deleteQueue(guildId);
        return;
      }

      void playNext(interaction).catch((nextTrackError) =>
        captureError(nextTrackError, "nextTrackPlayback", {
          guild_id: guildId,
        }),
      );
    });
  });

  serverQueue.player.on("error", (error: Error) => {
    skipFailedTrack(error, "audioPlayer");
  });
}

export async function playQueue(
  interaction: InteractionWithVoice,
  items: QueueItem[],
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

  const existingQueue = songQueue.get(guildId);
  if (
    existingQueue?.disconnectTimeout &&
    existingQueue.player.state.status === AudioPlayerStatus.Idle
  ) {
    existingQueue.index++;
  }

  const guildQueue = createQueue(guildId, connection);
  const startPlayback = () => {
    void playNext(interaction).catch((error) =>
      captureError(error, "playQueuePlayback", { guild_id: guildId }),
    );
  };
  const radioItem =
    items.length === 1 && isRadioQueueItem(items[0]) ? items[0] : null;

  if (radioItem) {
    const isPlaying =
      guildQueue.player.state.status === AudioPlayerStatus.Playing ||
      guildQueue.player.state.status === AudioPlayerStatus.Buffering;
    const radioIndex = findIndex(
      guildQueue.tracks,
      isRadioQueueItem,
      guildQueue.index,
    );

    if (radioIndex === guildQueue.index) {
      guildQueue.tracks[radioIndex] = radioItem;
      startPlayback();
      return interaction.editReply("📻 Now playing radio!");
    }

    if (isPlaying) {
      if (radioIndex >= 0) {
        guildQueue.tracks[radioIndex] = radioItem;
      } else {
        guildQueue.tracks.splice(guildQueue.index + 1, 0, radioItem);
      }
      return interaction.editReply(
        "📻 Radio will start after the current song. The rest of the queue is preserved.",
      );
    }

    if (radioIndex >= 0) {
      guildQueue.tracks.splice(radioIndex, 1);
    }
    guildQueue.tracks.splice(guildQueue.index, 0, radioItem);
    startPlayback();
    return interaction.editReply("📻 Now playing radio!");
  }

  const currentItem = guildQueue.tracks[guildQueue.index];

  let shouldStartPlayback = false;
  if (currentItem && isRadioQueueItem(currentItem)) {
    guildQueue.tracks.splice(guildQueue.index, 1, ...items);
    shouldStartPlayback = true;
  } else {
    guildQueue.tracks.push(...items);
  }

  const isIdle =
    guildQueue.player.state.status !== AudioPlayerStatus.Playing &&
    guildQueue.player.state.status !== AudioPlayerStatus.Buffering;

  if (shouldStartPlayback || isIdle) {
    startPlayback();

    try {
      await interaction.editReply(`Songs ${items.length} Loaded`);
    } catch (error) {
      console.warn("⚠️ No deferred reply to delete.");
    }
  } else {
    if (items.length > 1) {
      return interaction.editReply(`Added to queue: ${items.length} songs`);
    }

    if (!items.length) {
      return interaction.editReply("No valid tracks found.");
    }

    return interaction.editReply(`Added to queue: ${items[0]!.title}`);
  }
}
