const { Client, RichEmbed } = require("discord.js");

const colors = require("../json/colors.json");

module.exports.run = async (bot, message, args) => {
  return message.channel.send(`https://twitch.tv/${args[0]}`);
};

module.exports.config = {
  name: "t",
  description: "Watch a Twitch stream from Discord.",
  usage: "!t <user>"
};
