const fs = require("fs");
const path = require("path");
const pixivImg = require("pixiv-img");
const { QueueInterval, QueuePicture } = require("../models/index");
const {
  getAwsDatabaseConnections,
  getRdsInfo,
  toggleRdsInstance,
} = require("./aws");

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

const queueRdsStartStop = async (repeatTime, onTimes, rdsClient) => {
  const today = new Date();
  const hour = today.getHours();
  const minute = today.getMinutes();

  for (const { hourTrigger, minuteTrigger } of onTimes) {
    // if we are pass the trigger do nothing
    if (hour > hourTrigger) {
      continue;
    }

    if (minute == minuteTrigger - 5) {
      toggleRdsInstance();
    }

    if (minute == minuteTrigger + 5) {
      toggleRdsInstance();
    }
  }
};

module.exports.queueRdsStartStop = queueRdsStartStop;
module.exports.queueIntervalPost = queueIntervalPost;
