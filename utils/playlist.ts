import {
  ModalBuilder,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export function createPlaylistModal(
  customId: string,
  title: string,
  playlistName: string | null = null,
  songs: string | null = null
) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle(title);

  const nameTextInput = new TextInputBuilder()
    .setCustomId("playlist_name")
    .setLabel("Playlist Name")
    .setStyle(1)
    .setRequired(true);

  if (playlistName) {
    nameTextInput.setValue(playlistName);
  }

  const playlistNameInput =
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      nameTextInput
    );

  const songTextInput = new TextInputBuilder()
    .setCustomId("playlist_songs")
    .setPlaceholder("Comma-separated song titles or URLs")
    .setLabel("Songs")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  if (songs) {
    songTextInput.setValue(songs);
  }

  const playlistSongsInput =
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
      songTextInput
    );

  modal.addComponents(playlistNameInput, playlistSongsInput);

  return modal;
}
