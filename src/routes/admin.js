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
    include: [
      {
        model: Contract,
        include: [{ model: Profile, as: "Contractor" }],
      },
    ],
  });

  if (jobs.length === 0) {
    return res.json(null);
  }

  const groupByProfession = jobs.reduce((acc, job) => {
    const existing = acc.find(
      (e) => e.profession === job.Contract.Contractor.profession
    );

    if (!existing) {
      acc.push({
        profession: job.Contract.Contractor.profession,
        paid: job.price,
      });
      return acc;
    }

    existing.paid += job.price;
    return acc;
  }, []);

  const maxProfession = groupByProfession.reduce((acc, prof) => {
    if (acc.price < prof.price) {
      acc = prof;
    }

    return acc;
  });
  res.json(maxProfession);
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
    include: [
      {
        model: Contract,
        include: [{ model: Profile, as: "Client" }],
      },
    ],
  });

  if (jobs.length === 0) {
    return res.json(null);
  }

  const groupByClient = jobs
    .reduce((acc, job) => {
      const existing = acc.find((e) => e.id === job.Contract.Client.id);

      if (!existing) {
        acc.push({
          id: job.Contract.Client.id,
          fullName: `${job.Contract.Client.firstName} ${job.Contract.Client.lastName}`,
          paid: job.price,
        });
        return acc;
      }

      existing.paid += job.price;
      return acc;
    }, [])
    .sort((a, b) => {
      return b.paid - a.paid;
    });

  const limitResult = groupByClient.slice(0, limit);
  res.json(limitResult);
});

module.exports = router;
