import { createAudioResource, StreamType } from "@discordjs/voice";
import { CommandInteraction, ModalSubmitInteraction } from "discord.js";
import { RadioQueueItem, ServerQueue } from "../constants";
import { request } from "undici";
import { deleteQueue, scheduleQueueAction } from "./queue";
import { shouldDisconnect } from "./voice";
import { captureError } from "./error";
import { AudioPlayerStatus } from "@discordjs/voice";

type RadioInteraction = CommandInteraction | ModalSubmitInteraction;

export async function playRadio(
  serverQueue: ServerQueue,
  radioItem: RadioQueueItem,
  interaction: RadioInteraction,
): Promise<void> {
  const guildId = interaction.guildId!;
  const response = await request(radioItem.url);
  if (response.statusCode < 200 || response.statusCode >= 300) {
    response.body.destroy();
    throw new Error(`Radio stream returned HTTP ${response.statusCode}`);
  }

  const resource = createAudioResource(response.body, {
    inputType: StreamType.Arbitrary,
  });

  if (serverQueue.tracks[serverQueue.index] !== radioItem) {
    response.body.destroy();
    return;
  }

  serverQueue.player.removeAllListeners();
  serverQueue.player.stop(true);
  serverQueue.isRadio = true;
  serverQueue.isLooping = false;
  serverQueue.player.play(resource);

  serverQueue.player.on(AudioPlayerStatus.Playing, () => {
    console.log("✅ Playing radio stream");
  });

  serverQueue.player.on(AudioPlayerStatus.Idle, () => {
    console.log("⚠️ Stream ended or idle");
  });

  serverQueue.player.on("error", (error: Error) => {
    captureError(error, "radioPlayer", { guild_id: guildId });
  });

  scheduleQueueAction(
    serverQueue,
    () => {
      if (shouldDisconnect(interaction)) {
        deleteQueue(guildId);
      }
    },
    true,
  );
}
