const { EmbedBuilder } = require("discord.js");

const json = require("../json/constants.json");

module.exports.run = async (bot, message, args) => {
  const helpEmbed = new EmbedBuilder();

  if (args[0] == "help") {
    return message.channel.send(`Just do ${json.prefix}help`);
  }

  helpEmbed
    .setColor(message.member.displayHexColor)
    .setDescription("These are the availble commands");

  let commands = bot.commands;

  if (args[0] && bot.commands.has(args[0])) {
    commands = [bot.commands.get(args[0])];
    helpEmbed.setDescription("");
  }

  for (const [name, command] of commands) {
    if (!command) {
      continue;
    }

    helpEmbed.addFields(
      {
        name: "**Command**: ",
        value: `${json.prefix}${name}`,
      },
      { name: "**Description**: ", value: `${command.config.description}\n\n` }
    );

    if (command.config.usage) {
      helpEmbed.addFields({
        name: "**Usage**: ",
        value: `${command.config.usage}\n\n`,
      });
    }
  }

  message.channel.send({ embeds: [helpEmbed] });
};

module.exports.config = {
  name: "help",
  description: "List of all commands",
};
