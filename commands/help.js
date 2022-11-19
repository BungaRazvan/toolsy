const { MessageEmbed } = require("discord.js");

const json = require("../json/constants.json");

module.exports.run = async (bot, message, args) => {
  const helpEmbed = new MessageEmbed();

  if (args[0] == "help") {
    return message.channel.send(`Just do ${json.prefix}help`);
  }

  const img = message.guild.iconURL;
  helpEmbed
    .setColor(message.guild.me.displayHexColor)
    .setThumbnail(img)
    .setDescription("These are the availble commands");

  let commands = bot.commands;

  if (args[0] && bot.commands.has(args[0])) {
    commands = [bot.commands.get(args[0])];
    helpEmbed.setDescription("");
  }

  commands.forEach((command) => {
    helpEmbed.addField("**Command**: ", `${json.prefix}${command.config.name}`);
    helpEmbed.addField(
      "**Description**: ",
      `${command.config.description}\n\n`
    );
    helpEmbed.addField("**Usage**: ", `${command.config.usage}\n\n`);
  });

  return message.channel.send(helpEmbed);
};

module.exports.config = {
  name: "help",
  description: "List of all commands",
};
