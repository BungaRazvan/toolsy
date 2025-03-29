import { normalCommands, slashCommands } from ".";

const { EmbedBuilder } = require("discord.js");

const env = require("dotenv");
env.config();

export const execute = async (bot, message, args) => {
  const helpEmbed = new EmbedBuilder();

  helpEmbed
    .setColor(message.member.displayHexColor)
    .setDescription("These are the availble commands");

  let commands = {
    ...normalCommands,
    ...slashCommands,
  };

  // if (args[0] && bot.commands.has(args[0])) {
  //   commands = [bot.commands.get(args[0])];
  //   helpEmbed.setDescription("");
  // }

  for (const command of Object.values(commands)) {
    const name = command.config.name;
    const description = command.config.description;
    const usage = command.config.usage;
    const isSlashCommand = command.config.slashCommand;

    helpEmbed.addFields(
      {
        name: "**Command**: ",
        value: isSlashCommand
          ? `/` + `${name}`
          : `${process.env.prefix}` + `${name}`,
      },
      { name: "**Description**: ", value: `${description}\n\n` }
    );

    if (usage) {
      helpEmbed.addFields({
        name: "**Usage**: ",
        value: `${usage}\n\n`,
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
