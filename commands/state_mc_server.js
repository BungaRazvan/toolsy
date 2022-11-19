const { MessageEmbed } = require("discord.js");

const { awsMinecraftServerInstance } = require("./../json/constants.json");
const { getAwsInfo } = require("../utils/aws");
const { msToTime } = require("../utils/dates");

module.exports.run = async (bot, message, args) => {
  const instance = await getAwsInfo(null, awsMinecraftServerInstance, {
    all: true,
  });
  const emblem = new MessageEmbed();
  const launchDate = instance.all.LaunchTime;

  emblem.setColor(message.guild.me.displayHexColor);
  emblem.addField("**State**:", `${instance.state}`);
  emblem.addField("**Launch Time**:", `${launchDate.toLocaleString()}`);
  emblem.addField("**Time Running**:", `${msToTime(new Date() - launchDate)}`);

  return message.channel.send(emblem);
};

module.exports.config = {
  name: "state_mc_server",
  description: "State of mc server",
  usage: "!state_mc_server",
};
