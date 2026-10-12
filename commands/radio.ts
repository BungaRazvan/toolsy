import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { request } from "undici";
import { captureError, safeEditReply } from "../utils/error";

import {
  AudioPlayerStatus,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  StreamType,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { shouldDisconnect } from "../utils/voice";
import { createQueue, deleteQueue, scheduleQueueAction } from "../utils/queue";

export const config = {
  name: "radio",
  description: "Play radio stream",
  usage: "/radio",
  slashCommand: true,
};

export const data = new SlashCommandBuilder()
  .setName(config.name)
  .setDescription(config.description);

export async function execute(interaction: ChatInputCommandInteraction) {
  const voiceChannel = interaction.member?.voice?.channel;

  if (!voiceChannel) {
    return interaction.reply("You must be in a voice channel!");
  }

  await interaction.reply("📻 Connecting...");

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

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  } catch (error) {
    captureError(error, "radioVoiceConnection", { guild_id: guildId });
    connection.destroy();
    return interaction.editReply("❌ Failed to join voice channel.");
  }

  const serverQueue = createQueue(guildId, connection);

  let response;

  try {
    response = await request("http://asculta.radioromanian.net:8100/");
  } catch (error) {
    captureError(error, "radioRequest");
    deleteQueue(guildId);
    return safeEditReply(
      interaction,
      "❌ Unable to connect to the radio stream. Please try again later.",
    );
  }

  let resource;

  try {
    resource = createAudioResource(response.body, {
      inputType: StreamType.Arbitrary,
    });
  } catch (error) {
    captureError(error, "radioResource");
    deleteQueue(guildId);
    return safeEditReply(
      interaction,
      "❌ Failed to play the radio stream. Please try again later.",
    );
  }

  connection.subscribe(serverQueue.player);

  serverQueue.player.stop();
  serverQueue.isRadio = true;
  serverQueue.player.play(resource);

  serverQueue.player.on(AudioPlayerStatus.Playing, () => {
    console.log("✅ Playing radio stream");
  });

  serverQueue.player.on(AudioPlayerStatus.Idle, () => {
    console.log("⚠️ Stream ended or idle");
  });

  serverQueue.player.on("error", (error) => {
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

  await interaction.editReply("📻 Now playing radio!");
}
