import {
  SlashCommandBuilder,
  CommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  StringSelectMenuBuilder,
  MessageFlags,
} from "discord.js";
import { apiCall } from "../utils/api";

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
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const response = await apiCall(
    "get",
    "youtube-playlist",
    new URLSearchParams({
      user_id: interaction.user.id as string,
      guild_id: interaction.guild?.id as string,
    }),
    { useAPIKey: true }
  );

  let playlistsData = null;

  playlistsData = await response.json();

  const playlists = playlistsData.playlists || [];

  const options = playlists.map((playlist: any) => {
    return {
      label: playlist.name,
      description: undefined,
      value: playlist.id.toString(),
    };
  });

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("playlist_select")
    .setPlaceholder("Select a playlist");

  if (!options.length) {
    selectMenu.setDisabled(true);
    selectMenu.addOptions([
      {
        label: "No playlists found",
        value: "none",
        description: "No available playlists to select",
      },
    ]);
  } else {
    selectMenu.addOptions(options);
  }

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
      .setLabel("✏️ Edit")
      .setStyle(1)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("playlist_delete")
      .setLabel("🗑️ Delete")
      .setStyle(4)
      .setDisabled(true)
  );

  const msg = await interaction.editReply({
    content: "🎛️ Manage your playlists:",
    components: [selectRow, buttonRow],
  });

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    time: 8000,
    filter: (i) => i.message.id === msg.id && i.user.id === interaction.user.id,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== interaction.user.id) {
      return i.editReply({
        content: "This menu isn't for you.",
      });
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
            .setCustomId(`playlist_edit::${selectedId}`)
            .setLabel("✏️ Edit")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`playlist_delete::${selectedId}`)
            .setLabel("🗑️ Delete")
            .setStyle(ButtonStyle.Danger)
        );

      const option = options.find((option: any) => option.value == i.values[0]);
      // Update the message to reflect the new button state

      try {
        await i.update({
          content: `▶️ Selected: **${option?.label}**`,
          components: [i.message.components[0], updatedButtons],
        });
      } catch (err: any) {
        console.warn("Failed to update interaction:", err.message);
        // Optional: edit the original slash command message instead
        await interaction
          .editReply({
            content: `▶️ Selected: **${option?.label}**`,
            components: [i.message.components[0], updatedButtons],
          })
          .catch(() => {});
      }

      return;
    }
  });

  collector.on("end", async () => {
    await interaction.editReply({ components: [] });
  });
}
