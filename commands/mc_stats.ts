import { SlashCommandBuilder, CommandInteraction } from "discord.js";
import { apiCall } from "../utils/api";
import { EmbedBuilder } from "discord.js";

export const config = {
  name: "mc_stats",
  description: "Show stats for minecraft players",
  usage: "/mc_stats",
  slashCommand: true,
};

async function fetchMCStats(quild_id: string) {
  const parmas = new URLSearchParams({
    quild_id,
  });
  const response = await apiCall("get", "minecraft-stats", parmas, {
    useAPIKey: true,
  });

  if (response.ok) {
    return response.json();
  }

  return [];
}

export const data = new SlashCommandBuilder()
  .setName(config.name)
  .setDescription(config.description);

export async function execute(interaction: CommandInteraction) {
  await interaction.deferReply();

  const stats = await fetchMCStats(interaction.guildId!);

  const embeds = stats.map((p: any) => {
    const date = new Date(p.timestamp);
    const formattedDate = `${date.getUTCDate()} ${date.toLocaleString("en-US", {
      month: "short",
    })} ${date.getUTCFullYear()}, ${date
      .getUTCHours()
      .toString()
      .padStart(2, "0")}:${date
      .getUTCMinutes()
      .toString()
      .padStart(2, "0")} UTC`;

    return new EmbedBuilder()
      .setTitle(`${p.mc_name}`)
      .addFields(
        {
          name: "⏱️ Play Time",
          value: `${p.play_time.toFixed(2)} hrs`,
          inline: true,
        },
        { name: "☠️ Deaths", value: `${p.deaths}`, inline: true },
        { name: "⚔️ Player Kills", value: `${p.player_kills}`, inline: true },
        { name: "👹 Mob Kills", value: `${p.mob_kills}`, inline: true }
      )
      .setFooter({ text: `📊 Stats at ${formattedDate}` });
  });

  if (!embeds.length) {
    return interaction.editReply({ message: "No stats" });
  }

  return interaction.editReply({ embeds });
}
