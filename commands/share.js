const { Client, RichEmbed } = require("discord.js");
const colors = require("../json/colors.json");

module.exports.run = async (bot, message, args) => {
  const voiceChannelId = message.member.voiceChannelID;
  const link = `https://www.discordapp.com/channels/${message.guild.id}/${voiceChannelId}`;

  if (message.member.voiceChannel) {
    const shareEmbed = new RichEmbed()
      .setColor(colors.twicth)
      .addField(
        "ScreenShare",
        `Screenshare functionality in ${message.channel}: [ click here](${link})`
      )
      .setFooter(`${bot.user.username}`, `${bot.user.displayAvatarURL}`);

    return message.channel.send(shareEmbed);
  } else {
    return message.channel.send("You have to be connected to a Voice Channel");
  }
};

module.exports.config = {
  name: "share",
  description: "Share you screen",
  usage: "!share",
};
