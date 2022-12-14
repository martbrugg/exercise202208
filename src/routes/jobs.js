const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");

/**
 * @openapi
 * /jobs/unpaid:
 *   get:
 *     tags:
 *      - jobs
 *     parameters:
 *       - name: profile_id
 *         in: header
 *         description: profile id for authorization
 *         required: true
 *         type: string
 *     description: list of unpaid jobs for profile
 *     responses:
 *       200:
 *         description: Returns list of jobs.
 */

/**
 * @returns list of unpaid jobs for profile
 */
router.get("/unpaid", async (req, res) => {
  try {
    const { Contract, Job } = req.app.get("models");
    const contracts = await Job.findAll({
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
            [Op.or]: [
              { ContractorId: req.profile.id },
              { ClientId: req.profile.id },
            ],
          },
        },
      ],
    });
    if (!contracts) return res.status(404).end();
    res.json(contracts);
  } catch (error) {
    res.status(500).end(error.message);
  }
});

/**
 * @openapi
 * /jobs/{job_id}/pay:
 *   post:
 *     tags:
 *      - jobs
 *     parameters:
 *       - name: job_id
 *         in: path
 *         required: true
 *         type: integer
 *         minimum: 1
 *         description: The job ID.
 *       - name: profile_id
 *         in: header
 *         description: profile id for authorization
 *         required: true
 *         type: string
 *     description: Pay for a job
 *     responses:
 *       200:
 *         description: Returns the the paid job.
 */

/**
 * @returns Job
 */
router.post("/:job_id/pay", async (req, res) => {
  try {
    const { job_id } = req.params;
    const sequelize = req.app.get("sequelize");
    const { Job, Contract, Profile } = req.app.get("models");

    const result = await sequelize.transaction(async (t) => {
      const job = await Job.findByPk(job_id, {
        transaction: t,
        // paid: { [Op.eq]: null },
        include: [
          {
            model: Contract,
            include: [
              { model: Profile, as: "Contractor" },
              { model: Profile, as: "Client" },
            ],
            where: {
              ClientId: req.profile.id,
            },
          },
        ],
      });

      if (!job) throw new Error("job does not exist");

      if (job.paid) throw new Error("job is already paid");

      if (
        job.Contract.Contractor &&
        job.Contract.Client &&
        job.Contract.Client.balance >= job.price
      ) {
        const newClientBalance = job.Contract.Client.balance - job.price;
        const newContractorBalance =
          job.Contract.Contractor.balance + job.price;

        await job.Contract.Client.update(
          { balance: newClientBalance },
          { transaction: t }
        );
        await job.Contract.Contractor.update(
          { balance: newContractorBalance },
          { transaction: t }
        );
        await job.update(
          { paid: true, paymentDate: new Date() },
          { transaction: t }
        );

        return job;
      } else {
        throw new Error("not enough balance");
      }
    });

    res.json(result);
  } catch (error) {
    res.status(400).end(error.message);
  }
});

module.exports = router;
