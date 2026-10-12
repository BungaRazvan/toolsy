import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { QueueItem } from "../constants";
import { playQueue } from "../utils/playback";

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
  .setDescription(config.description)
  .addStringOption((option) =>
    option
      .setName("url")
      .setDescription("HTTP(S) radio stream URL")
      .setRequired(false),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const suppliedUrl = interaction.options.getString("url");
  let streamUrl = RADIO_STREAM_URL;
  let streamTitle = RADIO_TITLE;

  if (suppliedUrl) {
    try {
      const parsedUrl = new URL(suppliedUrl);
      if (
        !["http:", "https:"].includes(parsedUrl.protocol) ||
        parsedUrl.username ||
        parsedUrl.password
      ) {
        throw new Error(
          "Radio URL must be HTTP(S) and must not include credentials.",
        );
      }

      streamUrl = parsedUrl.href;
      streamTitle = `Radio (${parsedUrl.hostname})`;
    } catch (error) {
      return interaction.reply({
        content:
          error instanceof TypeError
            ? "❌ Please provide a valid HTTP(S) radio stream URL."
            : `❌ ${
                error instanceof Error ? error.message : "Invalid radio URL."
              }`,
        ephemeral: true,
      });
    }
  }

  await interaction.deferReply();

  const radioItem: QueueItem = {
    type: "radio" as const,
    title: streamTitle,
    url: streamUrl,
  };

  return playQueue(interaction, [radioItem]);
}
