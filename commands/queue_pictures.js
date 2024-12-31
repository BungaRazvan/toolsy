const { SlashCommandBuilder } = require("@discordjs/builders");
const { ChannelType } = require("discord.js");

const config = {
  name: "qp",
  description: "Queue a time and pictures to be sent to a channel",
  usage: "/qp",
  slashCommand: true,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName(config.name)
    .setDescription(config.description)
    .addStringOption((option) =>
      option.setName("name").setDescription("Queue Name").setRequired(true)
    )

    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("channel to send the picture")
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .addStringOption((option) =>
      option
        .setName("at")
        .setDescription("the time at which the picture is sent. 5PM or 5AM")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("urls")
        .setDescription("image urls to send each day. Comma separeted list")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("description").setDescription("Describe the queue")
    ),

  async execute(interaction) {
    return await interaction.reply("hey");
  },
};

module.exports.config = {
  ...config,
};
