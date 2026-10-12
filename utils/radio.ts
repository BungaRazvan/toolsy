import { AudioPlayerStatus } from "@discordjs/voice";
import { CommandInteraction, ModalSubmitInteraction } from "discord.js";
import { RadioQueueItem, ServerQueue } from "../constants";
import {
  deleteQueue,
  scheduleQueueAction,
} from "./queue";
import { shouldDisconnect } from "./voice";
import { captureError } from "./error";

type RadioInteraction = CommandInteraction | ModalSubmitInteraction;

export function playRadio(
  serverQueue: ServerQueue,
  radioItem: RadioQueueItem,
  interaction: RadioInteraction,
): void {
  const guildId = interaction.guildId!;

  serverQueue.player.removeAllListeners();
  serverQueue.player.stop(true);
  serverQueue.isRadio = true;
  serverQueue.isLooping = false;
  serverQueue.player.play(radioItem.resource);

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
