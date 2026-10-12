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

export function captureError(
  error: unknown,
  context?: string,
  tags?: Record<string, string>,
) {
  const label = context ? `[${context}]` : "[Error]";
  const exception =
    error instanceof Error
      ? error
      : new Error(typeof error === "string" ? error : "Unknown error");

  console.error(label, error);
  Sentry.withScope((scope) => {
    if (context) {
      scope.setTag("error_context", context);
    }

    for (const [key, value] of Object.entries(tags ?? {})) {
      scope.setTag(key, value);
    }

    scope.captureException(exception);
  });
}

export async function safeReply(
  interaction: RepliableInteraction,
  replyOptions: string | MessagePayload | InteractionReplyOptions,
) {
  if (!interaction.isRepliable()) {
    captureError(new Error("Interaction is not repliable"), "safeReply");
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
    captureError(new Error("Interaction is not repliable"), "safeEditReply");
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
