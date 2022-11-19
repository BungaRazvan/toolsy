const { EC2Client, StopInstancesCommand } = require("@aws-sdk/client-ec2");

const {
  awsRegion,
  awsMinecraftServerInstance,
} = require("./../json/constants.json");

const { getAwsInfo } = require("../utils/aws");

module.exports.run = async (bot, message, args) => {
  const client = new EC2Client({ region: awsRegion });
  let instance = await getAwsInfo(client, awsMinecraftServerInstance);

  if (instance.state == "stopped") {
    return message.channel.send("Minecraft Server Allready Stopped");
  }

  const command = new StopInstancesCommand({
    InstanceIds: [awsMinecraftServerInstance],
    DryRun: false,
  });
  await client.send(command);

  while (instance.state == "stopping") {
    setTimeout(async () => {
      instance = await getAwsInfo(client, awsMinecraftServerInstance);
    }, 5000);
  }

  return message.channel.send("Minecraft Server Stopped");
};

module.exports.config = {
  name: "stop_mc_server",
  description: "Start mc server",
  usage: "!stop_mc_server",
};
