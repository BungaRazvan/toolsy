import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { request } from "undici";
import { captureError, safeEditReply } from "../utils/error";
import {
  AudioPlayerStatus,
  createAudioResource,
  entersState,
  StreamType,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { isRadioQueueItem, songQueue } from "../constants";
import {
  getInteractionVoiceChannel,
  getOrJoinVoiceConnection,
} from "../utils/voice";
import {
  createQueue,
  removeRadioItems,
} from "../utils/queue";
import { playRadio } from "../utils/radio";

const RADIO_TITLE = "Radio Romanian";
const RADIO_STREAM_URL = "http://asculta.radioromanian.net:8100/";

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
  const voiceChannel = getInteractionVoiceChannel(interaction);

  if (!voiceChannel) {
    return interaction.reply("You must be in a voice channel!");
  }

  await interaction.deferReply();

  const guildId = interaction.guildId!;
  const connection = getOrJoinVoiceConnection(interaction, voiceChannel);

  if (!connection) {
    return;
  }

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  } catch (error: unknown) {
    captureError(error, "radioVoiceConnection", { guild_id: guildId });
    connection.destroy();
    return interaction.editReply("❌ Failed to join voice channel.");
  }

  let response;

  try {
    response = await request(RADIO_STREAM_URL);
  } catch (error) {
    captureError(error, "radioRequest");
    if (!songQueue.has(guildId)) {
      connection.destroy();
    }
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
    if (!songQueue.has(guildId)) {
      connection.destroy();
    }
    return safeEditReply(
      interaction,
      "❌ Failed to play the radio stream. Please try again later.",
    );
  }

  const existingQueue = songQueue.get(guildId);
  if (
    existingQueue &&
    !existingQueue.isRadio &&
    existingQueue.disconnectTimeout &&
    existingQueue.player.state.status === AudioPlayerStatus.Idle
  ) {
    existingQueue.index++;
  }

  const serverQueue = createQueue(guildId, connection);
  connection.subscribe(serverQueue.player);

  const wasRadioPlaying = serverQueue.isRadio;
  removeRadioItems(serverQueue);
  if (wasRadioPlaying) {
    const currentItem = serverQueue.tracks[serverQueue.index];
    if (currentItem && isRadioQueueItem(currentItem)) {
      serverQueue.tracks.splice(serverQueue.index, 1);
    }
  }

  const isTrackPlaying =
    !wasRadioPlaying &&
    (serverQueue.player.state.status === AudioPlayerStatus.Playing ||
      serverQueue.player.state.status === AudioPlayerStatus.Buffering);
  const radioItem = {
    type: "radio" as const,
    title: RADIO_TITLE,
    url: RADIO_STREAM_URL,
    resource,
  };

  serverQueue.tracks.splice(
    isTrackPlaying ? serverQueue.index + 1 : serverQueue.index,
    0,
    radioItem,
  );

  if (isTrackPlaying) {
    return interaction.editReply(
      "📻 Radio will start after the current song. The rest of the queue is preserved.",
    );
  }

  playRadio(serverQueue, radioItem, interaction);
  return interaction.editReply("📻 Now playing radio!");
}
