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
  const { Contract, Job } = req.app.get("models");
  const contract = await Job.findAll({
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
          [Op.or]: [
            { ContractorId: req.profile.id },
            { ClientId: req.profile.id },
          ],
        },
      },
    ],
  });
  if (!contract) return res.status(404).end();
  res.json(contract);
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
  const { job_id } = req.params;
  const { Job, Contract, Profile } = req.app.get("models");
  const job = await Job.findByPk(job_id, {
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

  if (!job) return res.status(404).end("job does not exist");

  if (job.paid) return res.status(404).end("job is already paid");

  if (
    job.Contract.Contractor &&
    job.Contract.Client &&
    job.Contract.Client.balance >= job.price
  ) {
    const newClientBalance = job.Contract.Client.balance - job.price;
    const newContractorBalance = job.Contract.Contractor.balance + job.price;

    await job.Contract.Client.update({ balance: newClientBalance });
    await job.Contract.Contractor.update({ balance: newContractorBalance });
    await job.update({ paid: true, paymentDate: new Date() });
    console.log("enough balance");
  } else {
    return res.status(404).end("not enough balance");
  }

  res.json(job);
});

module.exports = router;
