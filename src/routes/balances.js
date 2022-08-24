const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");


/**
 * @returns updated client
 */
router.post("/deposit/:userId", async (req, res) => {
  const { userId } = req.params;
  const { Profile, Job, Contract } = req.app.get("models");
  const { amount } = req.body;
  const client = await Profile.findByPk(userId);

  if (!client) {
    return res.status(404).end(`Client not found`);
  }
  const jobs = await Job.findAll({
    where: {
      paid: { [Op.eq]: null },
    },
    include: [
      {
        model: Contract,
        where: {
          status: {
            [Op.in]: ["in_progress"],
          },
          ClientId: userId,
        },
      },
    ],
  });

  const openJobAmount = jobs.reduce((acc, job) => {
    acc += job.price;
    return acc;
  }, 0);

  const maxAmount = openJobAmount * 0.25;

  if (amount + client.balance > maxAmount) {
    return res.status(404).end(`Max payment amount (${maxAmount}) exceeded`);
  }

  await client.update({ balance: client.balance + amount });

  res.json(client);
});

module.exports = router;
