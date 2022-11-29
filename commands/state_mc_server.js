const { EmbedBuilder } = require("discord.js");

const { awsMinecraftServerInstance } = require("./../json/constants.json");
const { getAwsInfo } = require("../utils/aws");
const { msToTime } = require("../utils/dates");

module.exports.run = async (bot, message, args) => {
  const instance = await getAwsInfo(null, awsMinecraftServerInstance, {
    all: true,
  });
  const emblem = new EmbedBuilder();
  const launchDate = instance.all.LaunchTime;

  emblem.setColor(message.member.displayHexColor);
  emblem.addFields({ name: "**State**:", value: `${instance.state}` });

  if (instance.state == "running") {
    emblem.addFields(
      {
        name: "**Launch Time**:",
        value: `${launchDate.toLocaleString()}`,
      },

      {
        name: "**Time Running**:",
        value: `${msToTime(new Date() - launchDate)}`,
      }
    );
  } else if (instance.state == "stopped") {
    const stringToArray = instance.all.StateTransitionReason.replace(
      "(",
      ""
    ).split(" ");
    const stoppedDate = new Date(`${stringToArray[2]}T${stringToArray[3]}`);

    emblem.addFields(
      { name: "**Stopped Time**", value: `${stoppedDate.toLocaleString()}` },
      {
        name: "**Running Time**",
        value: `${msToTime(stoppedDate - launchDate)}`,
      }
    );
  }

  return message.channel.send({ embeds: [emblem] });
};

module.exports.config = {
  name: "state_mc_server",
  description: "State of mc server",
  usage: "!state_mc_server",
};
