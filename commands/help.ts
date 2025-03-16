const { EmbedBuilder } = require("discord.js");

const env = require("dotenv");
env.config();

export const execute = async (bot, message, args) => {
  const helpEmbed = new EmbedBuilder();

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
        value: `${process.env.prefix}${name}`,
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

export const config = {
  name: "help",
  description: "List of all commands",
  usage: "!help or !help other command",
};
