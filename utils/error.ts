import Sentry from "@sentry/node";
import type {
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  RepliableInteraction,
  MessagePayload,
} from "discord.js";

export function initErrorTracking(isDEV: boolean) {
  Sentry.init({
    enabled: !isDEV,
    dsn: process.env.SENTRY_DSN,
    environment: process.env.ENV,
  });
}

export function captureError(error: unknown, context?: string) {
  const label = context ? `[${context}]` : "[Error]";

  if (error instanceof Error) {
    console.error(label, error);
    Sentry.captureException(error);
    return;
  }

  console.error(label, error);
  Sentry.captureException(
    new Error(typeof error === "string" ? error : "Unknown error"),
  );
}

export async function safeReply(
  interaction: RepliableInteraction,
  replyOptions: string | MessagePayload | InteractionReplyOptions,
) {
  if (!interaction.isRepliable()) {
    console.error("safeReply failed: interaction is not repliable");
    return null;
  }

  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.followUp(
        replyOptions as InteractionReplyOptions,
      );
    }

    return await interaction.reply(replyOptions as InteractionReplyOptions);
  } catch (error) {
    captureError(error, "safeReply failed");
    return null;
  }
}

export async function safeEditReply(
  interaction: RepliableInteraction,
  replyOptions: string | MessagePayload | InteractionEditReplyOptions,
) {
  if (!interaction.isRepliable()) {
    console.error("safeEditReply failed: interaction is not repliable");
    return null;
  }

  try {
    if (interaction.replied || interaction.deferred) {
      return await interaction.editReply(
        replyOptions as InteractionEditReplyOptions,
      );
    }

    return await interaction.reply(replyOptions as InteractionReplyOptions);
  } catch (error) {
    captureError(error, "safeEditReply failed");
    return null;
  }
}
