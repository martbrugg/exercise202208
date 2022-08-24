const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
var moment = require("moment");
const { Contract } = require("../model");

/**
 * @returns best profession in time range
 */
router.get("/best-profession", async (req, res) => {
  const { Contract, Job, Profile } = req.app.get("models");
  const endDate = moment(req.query.end)
    .endOf("day")
    .format("YYYY-MM-DD HH:mm:ss");
  const startDate = moment(req.query.start)
    .startOf("day")
    .format("YYYY-MM-DD HH:mm:ss");
  const jobs = await Job.findAll({
    where: {
      paid: true,
      paymentDate: {
        [Op.lte]: endDate,
        [Op.gte]: startDate,
      },
    },
    include: [{
      model: Contract,
      include:[{model: Profile, as: 'Contractor'}]
    }]
  });

  if(jobs.length === 0) {
    return res.json(null);
  }

  const groupByProfession = jobs.reduce((acc, job) => {
    const existing = acc.find((e) => e.profession === job.Contract.Contractor.profession);

    if(!existing) {
      acc.push({
        profession: job.Contract.Contractor.profession,
        paid: job.price
      })
      return acc;
    }

    existing.paid += job.price;
    return acc;

  }, []);

  const maxProfession = groupByProfession.reduce((acc, prof) => {
    if(acc.price < prof.price) {
      acc = prof;
    }

    return acc;
  })
  res.json(maxProfession);
});

/**
 * @returns best clients in time range
 */

router.get("/best-clients", async (req, res) => {
  const { Contract, Job, Profile } = req.app.get("models");
  const endDate = moment(req.query.end)
    .endOf("day")
    .format("YYYY-MM-DD HH:mm:ss");
  const startDate = moment(req.query.start)
    .startOf("day")
    .format("YYYY-MM-DD HH:mm:ss");

  const limit = req.query.limit || 2
  const jobs = await Job.findAll({
    where: {
      paid: true,
      paymentDate: {
        [Op.lte]: endDate,
        [Op.gte]: startDate,
      },
    },
    include: [{
      model: Contract,
      include:[{model: Profile, as: 'Client'}]
    }]
  });

  if(jobs.length === 0) {
    return res.json(null);
  }

  const groupByClient = jobs.reduce((acc, job) => {
    const existing = acc.find((e) => e.id === job.Contract.Client.id);

    if(!existing) {
      acc.push({
        id: job.Contract.Client.id,
        fullName: `${job.Contract.Client.firstName} ${job.Contract.Client.lastName}`,
        paid: job.price
      })
      return acc;
    }

    existing.paid += job.price;
    return acc;

  }, []).sort((a,b) => {
    return b.paid - a.paid;
  });

  const limitResult = groupByClient.slice(0, limit)
  res.json(limitResult);
});

module.exports = router;
