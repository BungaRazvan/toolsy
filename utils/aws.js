const { awsRegion } = require("./../json/constants.json");

const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");

const getAwsInfo = async (client = null, instance, args = {}) => {
  let awsClient = client;
  const responseArgs = {
    ip: false,
    all: false,
    ...args,
  };

  if (!awsClient) {
    awsClient = new EC2Client({ region: awsRegion });
  }

  const command = new DescribeInstancesCommand({
    InstanceIds: [instance],
    DryRun: false,
  });

  const response = await awsClient.send(command);
  const returnResponse = {};
  const instanceResponse = response.Reservations[0].Instances[0];

  if (responseArgs.all) {
    returnResponse.all = instanceResponse;
  }

  if (responseArgs.ip) {
    returnResponse.ip = instanceResponse.PublicIpAddress;
  }

  returnResponse.state = instanceResponse.State.Name;

  return returnResponse;
};

module.exports.getAwsInfo = getAwsInfo;
