import {
  SlashCommandBuilder,
  CommandInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} from "discord.js";
import { songQueue } from "../constants";

export const config = {
  name: "list",
  description: "List songs in queue",
  usage: "/list",
  slashCommand: true,
};

export const data = new SlashCommandBuilder()
  .setName(config.name)
  .setDescription(config.description);

export async function execute(interaction: CommandInteraction) {
  const guildId = interaction.guildId;
  const serverQueue = songQueue.get(guildId);

  if (!serverQueue || serverQueue.tracks.length === 0) {
    return await interaction.reply(
      "There are no songs currently in the queue."
    );
  }

  const pageSize = 5;
  let page = 0;

  const getPageRows = (page: number) => {
    const start = page * pageSize;
    const end = start + pageSize;
    const tracks = serverQueue.tracks.slice(start, end);

    const songList = tracks
      .map((track, index) => `${start + index + 1}. ${track.title}`)
      .join("\n");

    const playButtons = tracks.map((_, i) =>
      new ButtonBuilder()
        .setCustomId(`play_${start + i}`)
        .setLabel(`▶️ ${start + i + 1}`)
        .setStyle(ButtonStyle.Secondary)
    );

    const favButtons = tracks.map((_, i) =>
      new ButtonBuilder()
        .setCustomId(`fav_${start + i}`)
        .setLabel(`⭐ ${start + i + 1}`)
        .setStyle(ButtonStyle.Secondary)
    );

    const playRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      playButtons
    );
    const favRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      favButtons
    );

    const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("⏮️ Prev")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(page === 0),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next ⏭️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(end >= serverQueue.tracks.length)
    );

    return { songList, rows: [playRow /* favRow */, , navRow] };
  };

  const { songList, rows } = getPageRows(page);

  await interaction.reply({
    content: `**Currently queued songs (Page ${page + 1})**:\n\n${songList}`,
    components: rows,
    ephemeral: true,
  });

  const collector = interaction.channel!.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120_000,
  });

  collector.on("collect", async (i) => {
    if (i.user.id !== interaction.user.id)
      return i.reply({ content: "This menu isn't for you.", ephemeral: true });

    if (i.customId === "next") {
      page++;
    } else if (i.customId === "prev") {
      page--;
    } else if (i.customId.startsWith("play_")) {
      const index = parseInt(i.customId.split("_")[1]);
      serverQueue.index = index;
      await i.update({
        content: `▶️ Playing **${serverQueue.tracks[index].title}**`,
        components: [],
      });
      return; // let playNext() logic handle the rest
    } else if (i.customId.startsWith("fav_")) {
      const index = parseInt(i.customId.split("_")[1]);
      const track = serverQueue.tracks[index];
      await i.reply({
        content: `⭐ You starred: **${track.title}**`,
        ephemeral: true,
      });
      return;
    }

    const { songList: newList, rows: newRows } = getPageRows(page);
    await i.update({
      content: `**Currently queued songs (Page ${page + 1})**:\n\n${newList}`,
      components: newRows,
    });
  });

  collector.on("end", async () => {
    try {
      await interaction.editReply({ components: [] });
    } catch (err) {
      console.error("Failed to edit reply after collector end:", err);
    }
  });
}
