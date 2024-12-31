import { CommandInteraction, SlashCommandBuilder } from "discord.js";

const config = {
  name: "play",
  description: "Play a youtube video",
  usage: "/play",
  slashCommand: true,
};

const data = new SlashCommandBuilder()
  .setName(config.name)
  .setDescription(config.description)
  .addStringOption((option) =>
    option.setName("url").setDescription("Youtube URL").setRequired(true)
  );

async function execute(interaction: CommandInteraction) {
  // const voiceChannel = interaction.member.
  return await interaction.reply("reload");
}

export { data, execute };
