const Discord = require("discord.js");

module.exports.run = async (bot, message, args) => {
  if (message.guild.voiceConnection) {
    message.guild.voiceConnection.disconnect();
  }
};

module.exports.config = {
  name: "leave",
  description: "Disconnect the bot from Voice Channel"
};
