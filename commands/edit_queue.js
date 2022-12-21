const { QueueInterval, QueuePicture } = require("../models/index");
const { SlashCommandBuilder } = require("@discordjs/builders");

const config = {
  name: "qe",
  description: "Queue a time and pictures to be sent to a channel",
  usage: "/qe",
  slashCommand: true,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName(config.name)
    .setDescription(config.description),

  async run(interaction) {
    console.log(interaction);
  },
};

module.exports.config = {
  ...config,
};
