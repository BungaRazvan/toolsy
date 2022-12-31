const { awsRegion } = require("./../json/constants.json");

const { EC2Client, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const {
  RDSClient,
  StartDBInstanceCommand,
  StopDBInstanceCommand,
  DescribeDBInstancesCommand,
} = require("@aws-sdk/client-rds");

const {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  Statistic,
} = require("@aws-sdk/client-cloudwatch");

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

const getRdsInfo = async (client = null, instance, args = {}) => {
  let rdsClient = client;

  if (!rdsClient) {
    rdsClient = new RDSClient({ region: awsRegion });
  }

  const command = new DescribeDBInstancesCommand({
    DBInstanceIdentifier: process.env.DB_HOSTNAME.split(".")[0],
  });
  const response = await rdsClient.send(command);

  return response.DBInstances[0];
};

const getAwsDatabaseConnections = async (client = null, identifier) => {
  let cloudWatchClient = client;

  if (!cloudWatchClient) {
    cloudWatchClient = new CloudWatchClient({ region: awsRegion });
  }

  const command = new GetMetricStatisticsCommand({
    Namespace: "AWS/RDS",
    MetricName: "DatabaseConnections",
    Dimensions: [{ Name: "DBInstanceIdentifier", Value: identifier }],
    StartTime: new Date(new Date() - 1 * 60000),
    EndTime: new Date(),
    Period: 60,
    Statistics: [Statistic.Maximum],
  });
  const response = await cloudWatchClient.send(command);

  return response.Datapoints[0].Maximum;
};

const toggleRdsInstance = async () => {
  const identifier = process.env.DB_HOSTNAME.split(".")[0];

  let rdsInstance = await getRdsInfo(rdsClient);

  // if (rdsInstance.DBInstanceStatus === "available") {
  //   await rdsClient.send(
  //     new StopDBInstanceCommand({
  //       DBInstanceIdentifier: identifier,
  //     })
  //   );
  // }

  // if (rdsInstance.DBInstanceStatus === "stopped") {
  //   await rdsClient.send(
  //     new StartDBInstanceCommand({ DBInstanceIdentifier: identifier })
  //   );
  // }
};

module.exports.toggleRdsInstance = toggleRdsInstance;
module.exports.getAwsInfo = getAwsInfo;
module.exports.getAwsDatabaseConnections = getAwsDatabaseConnections;
