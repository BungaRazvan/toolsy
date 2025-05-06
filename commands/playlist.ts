import {
  SlashCommandBuilder,
  CommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  ModalBuilder,
  ModalActionRowComponentBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  AnyComponentBuilder,
  TextInputStyle,
  TextInputBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { songQueue } from "../constants";
import models from "../models";

export const config = {
  name: "playlist",
  description: "Create/Update Playlists",
  usage: "/playlist",
  slashCommand: true,
};

export const data = new SlashCommandBuilder()
  .setName(config.name)
  .setDescription(config.description);

export async function execute(interaction: CommandInteraction) {
  const playlists = await models.Playlist.findAll({
    where: { user_id: interaction.user.id, guild_id: interaction.guild?.id },
  });

  const options = playlists.map((playlist) => {
    return {
      label: playlist.name,
      description: undefined,
      value: playlist.id.toString(),
    };
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("playlist_select")
    .setPlaceholder("Select a playlist")
    .addOptions(options);

  const selectRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("playlist_play")
      .setLabel("▶️ Play")
      .setStyle(1)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("playlist_create")
      .setLabel("🆕 Create")
      .setStyle(3),
    new ButtonBuilder()
      .setCustomId("playlist_rename")
      .setLabel("✏️ Rename")
      .setStyle(1)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("playlist_delete")
      .setLabel("🗑️ Delete")
      .setStyle(4)
      .setDisabled(true)
  );

  await interaction.reply({
    content: "🎛️ Manage your playlists:",
    components: [selectRow, buttonRow],
    ephemeral: true,
  });

  const collector = interaction.channel!.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 120_000,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: "This menu isn't for you.", ephemeral: true });
    }

    if (i.isStringSelectMenu() && i.customId === "playlist_select") {
      const selectedId = i.values[0];

      // Enable Rename and Delete buttons when a playlist is selected
      const updatedButtons =
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`playlist_play::${selectedId}`)
            .setLabel("▶️ Play")
            .setStyle(1),
          new ButtonBuilder()
            .setCustomId("playlist_create")
            .setLabel("🆕 Create")
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`playlist_rename:${selectedId}`)
            .setLabel("✏️ Rename")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`playlist_delete:${selectedId}`)
            .setLabel("🗑️ Delete")
            .setStyle(ButtonStyle.Danger)
        );

      const option = options.find((option) => option.value == i.values[0]);
      // Update the message to reflect the new button state
      await i.update({
        content: `▶️ Selected: **${option?.label}**`,
        components: [i.message.components[0], updatedButtons],
      });

      return;
    }
  });

  collector.on("end", async () => {
    await interaction.editReply({ components: [] });
  });
}
