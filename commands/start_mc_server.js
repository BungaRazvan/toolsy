const { EC2Client, StartInstancesCommand } = require("@aws-sdk/client-ec2");

const {
  awsRegion,
  awsMinecraftServerInstance,
  myUserId,
} = require("./../json/constants.json");

const { getAwsState } = require("../utils/aws");

module.exports.run = async (bot, message, args) => {
  const client = new EC2Client({ region: awsRegion });
  let instance_des = await getAwsState(
    client,
    awsMinecraftServerInstance,
    true
  );

  if (instance_des.state == "running") {
    return message.channel.send(
      `Minecraft server already running at ${instance_des.ip}`
    );
  }

  if (message.author.id != myUserId) {
    return message.channel.send(
      "You do not have permision to run this command ask someone else"
    );
  }

  if (instance_des.state == "stopping" || instance_des.state == "pending") {
    return message.channel.send("Something went wrong try again later!");
  }

  const command = new StartInstancesCommand({
    InstanceIds: [awsMinecraftServerInstance],
    DryRun: false,
  });

  await client.send(command);

  instance_des = await getAwsState(client, awsMinecraftServerInstance, true);

  while (instance_des.state == "pending") {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    getAwsState(client, awsMinecraftServerInstance, true).then((response) => {
      instance_des = response;
    });
  }

  return message.channel.send(`Minecraft server started at ${instance_des.ip}`);
};

module.exports.config = {
  name: "start_mc_server",
  description: "Start mc server",
  usage: "!start_mc_server",
};
