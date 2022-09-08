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
  try {
    const { userId } = req.params;
    const sequelize = req.app.get("sequelize");
    const { Profile, Job, Contract } = req.app.get("models");
    const { amount } = req.body;
    const result = await sequelize.transaction(async (t) => {
      const client = await Profile.findByPk(userId, {transaction: t});

      if (!client) {
        //return res.status(404).end(`Client not found`);
        throw new Error(`Client not found`)
      }

      if (!amount) {
        //return res.status(400).end(`no amount in body`);
        throw new Error(`no amount in body`)

      }

      const openJobAmount = await Job.sum("price", {
        where: {
          paid: {
            [Op.or]: [{ [Op.eq]: null }, { [Op.eq]: false }],
          },
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
      },  { transaction: t });

      if (openJobAmount === null) {
        throw new Error(`No open Jobs found`)
        //return res.status(400).end(`No open Jobs found`);
      }

      const maxAmount = openJobAmount * 0.25;

      if (amount + client.balance > maxAmount) {
        throw new Error(`Max payment amount (${maxAmount}) exceeded`)
        // return res
        //   .status(400)
        //   .end(`Max payment amount (${maxAmount}) exceeded`);
      }

      await client.update(
        { balance: client.balance + amount },
        { transaction: t }
      );

      return client;
    });

    res.json(result);
  } catch (error) {
    res.status(400).end(error.message);
  }
});

module.exports = router;
