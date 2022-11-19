const { EC2Client, StartInstancesCommand } = require("@aws-sdk/client-ec2");

const {
  awsRegion,
  awsMinecraftServerInstance,
} = require("./../json/constants.json");

const { getAwsInfo } = require("../utils/aws");

module.exports.run = async (bot, message, args) => {
  const client = new EC2Client({ region: awsRegion });
  let instanceDes = await getAwsInfo(client, awsMinecraftServerInstance, {
    ip: true,
  });

  if (instanceDes.state == "running") {
    return message.channel.send(
      `Minecraft server already running at ${instanceDes.ip}`
    );
  }

  if (instanceDes.state == "stopping" || instanceDes.state == "pending") {
    return message.channel.send("Something went wrong try again later!");
  }

  const command = new StartInstancesCommand({
    InstanceIds: [awsMinecraftServerInstance],
    DryRun: false,
  });

  await client.send(command);

  instanceDes = await getAwsInfo(client, awsMinecraftServerInstance, {
    ip: true,
  });

  while (instanceDes.state == "pending") {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    getAwsInfo(client, awsMinecraftServerInstance, { ip: true }).then(
      (response) => {
        instanceDes = response;
      }
    );
  }

  return message.channel.send(`Minecraft server started at ${instanceDes.ip}`);
};

module.exports.config = {
  name: "start_mc_server",
  description: "Start mc server",
  usage: "!start_mc_server",
};
