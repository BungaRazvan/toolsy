const { EC2Client, StopInstancesCommand } = require("@aws-sdk/client-ec2");

const {
  awsRegion,
  awsMinecraftServerInstance,
} = require("./../json/constants.json");

const { getAwsState } = require("../utils/aws");

module.exports.run = async (bot, message, args) => {
  const client = new EC2Client({ region: awsRegion });
  let instance_des = await getAwsState(
    client,
    awsMinecraftServerInstance,
    true
  );

  if (instance_des.state == "stopped") {
    return message.channel.send("Minecraft Server Stopped");
  }

  const command = new StopInstancesCommand({
    InstanceIds: [awsMinecraftServerInstance],
    DryRun: false,
  });
  await client.send(command);

  while (instance_des.state == "stopping") {
    setTimeout(async () => {
      instance_des = await getAwsState(
        client,
        awsMinecraftServerInstance,
        true
      );
    }, 5000);
  }

  return message.channel.send("Minecraft Server Stopped");
};

module.exports.config = {
  name: "stop_mc_server",
  description: "Start mc server",
  usage: "!stop_mc_server",
};
