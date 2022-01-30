const {
  awsRegion,
  awsMinecraftServerInstance,
} = require("./../json/constants.json");

const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");

module.exports.getAwsState = async (client = null, instance, ip = false) => {
  let awsClient = client;

  if (awsClient) {
    awsClient = new EC2Client({ region: awsRegion });
  }

  const command = new DescribeInstancesCommand({
    InstanceIds: [instance],
    DryRun: false,
  });

  const response = await awsClient.send(command);
  const return_response = {};
  const instance_response = response.Reservations[0].Instances[0];

  if (ip) {
    return_response["ip"] = instance_response.PublicIpAddress;
  }

  return_response["state"] = instance_response.State.Name;

  return return_response;
};
