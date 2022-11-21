const { MessageEmbed } = require("discord.js");

const { awsMinecraftServerInstance } = require("./../json/constants.json");
const { getAwsInfo } = require("../utils/aws");
const { msToTime, diff_hours } = require("../utils/dates");

module.exports.run = async (bot, message, args) => {
  const instance = await getAwsInfo(null, awsMinecraftServerInstance, {
    all: true,
  });
  const emblem = new MessageEmbed();
  const launchDate = instance.all.LaunchTime;

  emblem.setColor(message.guild.me.displayHexColor);
  emblem.addField("**State**:", `${instance.state}`);

  if (instance.state == "running") {
    emblem.addField("**Launch Time**:", `${launchDate.toLocaleString()}`);
    emblem.addField(
      "**Time Running**:",
      `${msToTime(new Date() - launchDate)}`
    );
  } else if (instance.state == "stopped") {
    const stringToArray = instance.all.StateTransitionReason.replace(
      "(",
      ""
    ).split(" ");
    const stoppedDate = new Date(`${stringToArray[2]}T${stringToArray[3]}`);
    emblem.addField("**Stopped Time**", `${stoppedDate.toLocaleString()}`);
    emblem.addField(
      "**Running Time**",
      `${msToTime(stoppedDate - launchDate)}`
    );
  }

  return message.channel.send(emblem);
};

module.exports.config = {
  name: "state_mc_server",
  description: "State of mc server",
  usage: "!state_mc_server",
};
