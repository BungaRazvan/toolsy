import {
  AudioPlayer,
  createAudioPlayer,
  VoiceConnection,
} from "@discordjs/voice";
import { ServerQueue, songQueue } from "../constants";

export function createQueue(
  guildId: string,
  connection: VoiceConnection,
): ServerQueue {
  let queue = songQueue.get(guildId);

  if (!queue) {
    const player: AudioPlayer = createAudioPlayer();
    connection.subscribe(player);

    queue = {
      tracks: [],
      index: 0,
      disconnectTimeout: null,
      disconnectInterval: null,
      connection,
      player,
      hasAnnounced: false,
      isLooping: false,
      isRadio: false,
    };

    songQueue.set(guildId, queue);
  }

  cancelScheduledDeletion(queue);

  return queue;
}

export function cancelScheduledDeletion(queue: ServerQueue): void {
  if (queue.disconnectTimeout) {
    clearTimeout(queue.disconnectTimeout);
    queue.disconnectTimeout = null;
  }

  if (queue.disconnectInterval) {
    clearInterval(queue.disconnectInterval);
    queue.disconnectInterval = null;
  }
}

export function scheduleQueueAction(
  queue: ServerQueue,
  callback: () => void,
  repeat = false,
): void {
  cancelScheduledDeletion(queue);
  const delay = Number(process.env.DC_IDLE);

  if (repeat) {
    queue.disconnectInterval = setInterval(callback, delay);
  } else {
    queue.disconnectTimeout = setTimeout(callback, delay);
  }
}

export function deleteQueue(guildId: string, destroy = true): void {
  const queue = songQueue.get(guildId);

  if (!queue) {
    return;
  }

  cancelScheduledDeletion(queue);

  if (destroy) {
    queue.connection.destroy();
  }

  songQueue.delete(guildId);
}
