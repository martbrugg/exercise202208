const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");

/**
 * @openapi
 * /balances/deposit/{userId}:
 *   post:
 *     tags:
 *      - balances
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         type: integer
 *         minimum: 1
 *         description: The id of the Client to deposit.
 *       - name: profile_id
 *         in: header
 *         description: profile id for authorization
 *         required: true
 *         type: string
 *     requestBody:
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              amount:        
 *                type: integer
 *     description: Deposit a Balance for a client
 *     responses:
 *       200:
 *         description: Returns the updated Client
 */

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

  if (!amount) {
    return res.status(404).end(`no amount in body`);
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
