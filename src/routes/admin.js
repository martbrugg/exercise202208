const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
var moment = require("moment");

/**
 * @openapi
 * /admin/best-profession:
 *   get:
 *     tags:
 *      - admin
 *     parameters:
 *       - name: profile_id
 *         in: header
 *         description: profile id for authorization
 *         required: true
 *         type: string
 *       - name: start
 *         in: query
 *         description: startdate
 *         required: true
 *         type: date
 *       - name: end
 *         in: query
 *         description: enddate
 *         required: true
 *         type: date
 *     description: get the best profession in time range.
 *     responses:
 *       200:
 *         description: Returns the best profession in time range.
 */

/**
 * @returns best profession in time range
 */
router.get("/best-profession", async (req, res) => {
  try {
    const sequelize = req.app.get("sequelize");
    const { Contract, Job, Profile } = req.app.get("models");
    const endDate = req.query.end
      ? moment(req.query.end).endOf("day").format("YYYY-MM-DD HH:mm:ss")
      : undefined;
    const startDate = req.query.start
      ? moment(req.query.start).startOf("day").format("YYYY-MM-DD HH:mm:ss")
      : undefined;

    const jobs = await Job.findAll({
      where: {
        paid: true,
        paymentDate: {
          [Op.lte]: endDate,
          [Op.gte]: startDate,
        },
      },
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("price")), "job_count"],
        [sequelize.fn("SUM", sequelize.col("price")), "sum_price"],
        [sequelize.col("profession", { model: Profile }), "profession"],
      ],
      group: [sequelize.col("profession", { model: Profile })],
      order: [["sum_price", "DESC"]],
      limit: 1,
      include: [
        {
          model: Contract,
          attributes: [],
          include: [
            {
              model: Profile,
              as: "Contractor",
              attributes: ["id", "profession"],
            },
          ],
        },
      ],
    });

    if (!jobs || jobs.length === 0) {
      return res.json(null);
    }

    res.json({profession: jobs[0].dataValues.profession});
  } catch (error) {
    res.status(500).end(error.message);
  }
});

/**
 * @openapi
 * /admin/best-clients:
 *   get:
 *     tags:
 *      - admin
 *     parameters:
 *       - name: profile_id
 *         in: header
 *         description: profile id for authorization
 *         required: true
 *         type: string
 *       - name: start
 *         in: query
 *         description: startdate
 *         required: true
 *         type: date
 *       - name: end
 *         in: query
 *         description: enddate
 *         required: true
 *         type: date
 *       - name: limit
 *         in: query
 *         description: limit of items
 *         required: false
 *         type: integer
 *     description: get a list of the best cleients in time range.
 *     responses:
 *       200:
 *         description: Returns a list of the best cleients in time range.
 *
 *
 * @returns best clients in time range
 */

router.get("/best-clients", async (req, res) => {
  try {
    const sequelize = req.app.get("sequelize");
    const { Contract, Job, Profile } = req.app.get("models");
    const endDate = req.query.end
      ? moment(req.query.end).endOf("day").format("YYYY-MM-DD HH:mm:ss")
      : undefined;
    const startDate = req.query.start
      ? moment(req.query.start).startOf("day").format("YYYY-MM-DD HH:mm:ss")
      : undefined;

    const limit = req.query.limit || 2;
    const jobs = await Job.findAll({
      where: {
        paid: true,
        paymentDate: {
          [Op.lte]: endDate,
          [Op.gte]: startDate,
        },
      },
      attributes: [
        // [sequelize.fn("COUNT", sequelize.col("price")), "job_count"],
        [sequelize.fn("SUM", sequelize.col("price")), "paid"],
        [sequelize.col("firstName", { model: Profile }), "client_firstName"],
        [sequelize.col("lastName", { model: Profile }), "client_lastName"],
        [sequelize.col("Contract.Client.id", { model: Profile }), "id"],
        // [sequelize.col("Contract.Client.fullName", { model: Profile }), "fullName"],
      ],
      group: [sequelize.col("Contract.Client.id", { model: Profile })],
      order: [["paid", "DESC"]],
      limit: limit,
      include: [
        {
          model: Contract,
          attributes: [],
          include: [
            {
              model: Profile,
              as: "Client",
              attributes: ["id"],
            },
          ],
        },
      ],
    });

    if (jobs.length === 0) {
      return res.json(null);
    }

    // const groupByClient = jobs
    //   .reduce((acc, job) => {
    //     const existing = acc.find((e) => e.id === job.Contract.Client.id);

    //     if (!existing) {
    //       acc.push({
    //         id: job.Contract.Client.id,
    //         fullName: `${job.Contract.Client.firstName} ${job.Contract.Client.lastName}`,
    //         paid: job.price,
    //       });
    //       return acc;
    //     }

    //     existing.paid += job.price;
    //     return acc;
    //   }, [])
    //   .sort((a, b) => {
    //     return b.paid - a.paid;
    //   });

    // const limitResult = groupByClient.slice(0, limit);
    res.json(
      jobs.map((j) => {
        return {
          fullName: `${j.dataValues.client_firstName} ${j.dataValues.client_lastName}`,
          id: j.id,
          paid: j.paid,
        };
      })
    );
  } catch (error) {
    res.status(500).end(error.message);
  }
});

module.exports = router;
