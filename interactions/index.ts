import {
  ButtonInteraction,
  CommandInteraction,
  Interaction,
  ModalSubmitInteraction,
} from "discord.js";
import { handlePlaylistInteraction } from "./playlist";

export async function routeInteractions(interaction: Interaction) {
  const customId = (interaction as any).customId;
  const isButton = interaction.isButton();
  const isModalSubmit = interaction.isModalSubmit();

  if ((isButton || isModalSubmit) && !customId) {
    return;
  }

  if (
    (isButton && customId.includes("playlist")) ||
    (isModalSubmit && customId.includes("playlist"))
  ) {
    return await handlePlaylistInteraction(
      interaction,
      isButton,
      isModalSubmit,
      customId
    );
  }
}
