import { Command } from "./command";
import { MessageEmbed, Client } from "discord.js";
import { CommandContext } from "../models/command_context";

export class HelpCommand implements Command {
  readonly commandNames = ["help", "h"];

  private commands: Command[];

  constructor(commands: Command[]) {
    this.commands = commands;
  }

  async run(commandContext: CommandContext, client: any): Promise<void> {
    const HelpCommandEmbed = new MessageEmbed()
      .setThumbnail(commandContext.originalMessage.guild.iconURL())
      .setColor("#0099ff")
      .setFooter(
        `${client.user.username}`,
        `${client.user.displayAvatarURL()}`
      );

    if (commandContext.args.length === 0) {
      const commandNames = this.commands.map(
        (command) => command.commandNames[0]
      );

      HelpCommandEmbed.setDescription(
        `Here is a list of commands you can run: `
      );

      commandNames.map((commandName) => {
        const usage = this.commands.find((command) =>
          command.commandNames.includes(commandName)
        );
        HelpCommandEmbed.addField(
          "**Command**: ",
          `${commandContext.commandPrefix}${commandName}`
        ).addField(
          "**Usage**:",
          `${this.buildHelpMessageForCommand(usage, commandContext)}`
        );
      });

      await commandContext.originalMessage.reply(HelpCommandEmbed);
      return;
    }

    const matchedCommand = this.commands.find((command) =>
      command.commandNames.includes(commandContext.args[0])
    );

    if (!matchedCommand) {
      await commandContext.originalMessage.reply(
        "I don't know about that command :(. Try !help to find all commands you can use."
      );
      return Promise.reject("Unrecognized command");
    } else {
      HelpCommandEmbed.addField(
        "**Usage**: ",
        `${this.buildHelpMessageForCommand(matchedCommand, commandContext)}`
      );
      await commandContext.originalMessage.reply(HelpCommandEmbed);
    }
  }

  private buildHelpMessageForCommand(
    command: Command,
    context: CommandContext
  ): string {
    return `${command.getHelpMessage(context.commandPrefix)}`;
  }

  getHelpMessage(commandPrefix: string) {
    return "I think you already know how to use this command...";
  }
}
