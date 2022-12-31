const fs = require("fs");
const path = require("path");
const pixivImg = require("pixiv-img");
const { QueueInterval, QueuePicture } = require("../models/index");

const {
  StartDBInstanceCommand,
  StopDBInstanceCommand,
} = require("@aws-sdk/client-rds");

const queueIntervalPost = async (repeatTime, folderPath, filters, channel) => {
  // TODO Think of a way to clear this
  const interval = setInterval(async () => {
    const { channelName, name, userId, at } = filters;

    const today = new Date();
    const hour = today.getHours();
    const minute = today.getMinutes();
    const timeTrigger = at.split(":");
    const [hourTrigger, minuteTrigger] =
      timeTrigger.length == 2 ? timeTrigger : [timeTrigger[0], 0];

    if (hour != hourTrigger || minute != minuteTrigger) {
      return;
    }

    const picture = await QueuePicture.findOne({
      include: {
        model: QueueInterval,
        require: true,
        where: {
          qi_channel: channelName,
          qi_user_id: userId,
          qi_name: name,
        },
      },
      attributes: ["qp_image", "qp_id"],
    });

    if (!picture) {
      return;
    }

    const { qp_image, qp_id } = picture.dataValues;

    const { hostname } = new URL(qp_image);

    if (hostname == "i.pximg.net") {
      pixivImg(qp_image, `${folderPath}/${path.basename(qp_image)}`).then(
        async (output) => {
          await channel.send({
            files: [output],
          });
          fs.unlinkSync(output);
        }
      );

      await QueuePicture.destroy({
        where: {
          qp_id,
        },
      });

      return;
    }

    channel
      .send({
        files: [qp_image],
      })
      .catch((error) => channel.send("Something went wrong sorry!"));

    await QueuePicture.destroy({
      where: {
        qp_id,
      },
    });
  }, repeatTime);
};

const queueRdsStartStop = async (repeatTime, onHour, offHour, rdsClient) => {
  setInterval(async () => {
    const today = new Date();
    const hour = today.getHours();
    const identifier = process.env.DB_HOSTNAME.split(".")[0];

    if (hour == onHour) {
      await rdsClient.send(
        new StartDBInstanceCommand({
          DBInstanceIdentifier: identifier,
        })
      );
    }

    if (hour == offHour) {
      await rdsClient.send(
        new StopDBInstanceCommand({
          DBInstanceIdentifier: identifier,
        })
      );
    }
  }, repeatTime);
};

module.exports.queueRdsStartStop = queueRdsStartStop;
module.exports.queueIntervalPost = queueIntervalPost;
