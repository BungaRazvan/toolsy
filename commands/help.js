const { Client, RichEmbed } = require("discord.js");
const json = require("../json/credentials.json");

module.exports.run = async (bot, message, args) => {
  if (args[0] == "help")
    return message.channel.send(`Just do ${json.prefix}help`);

  if (args[0]) {
    let command = args[0];
    if (bot.commands.has(command)) {
      command = bot.commands.get(command);

      const helpCommandEmbed = new RichEmbed()
        .setColor("#0099ff")

        .setDescription(
          `**Command:** ${command.config.name}\n**Description** ${
            command.config.description
          }`
        )
        .setFooter(`${bot.user.username}`, `${bot.user.displayAvatarURL}`);

      message.channel.send(helpCommandEmbed);
    }
  }

  if (!args[0]) {
    const img = message.guild.iconURL;
    const helpEmbed = new RichEmbed()
      .setColor("#0099ff")
      .setThumbnail(img)
      .setDescription("These are the availble commands")
      .setFooter(`${bot.user.username}`, `${bot.user.displayAvatarURL}`);

    const commands = bot.commands;
    commands.forEach(command => {
      helpEmbed.addField(
        "**Command**: ",
        `${json.prefix}${command.config.name}`
      );
      helpEmbed.addField(
        "**Description**: ",
        `${command.config.description}\n\n`
      );
    });
    message.author.send(helpEmbed);
  }
};

module.exports.config = {
  name: "help",
  description: "List of all commands"
};
