const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");

/**
 * @returns contract by id
 */
router.get("/:id", async (req, res) => {
  const { Contract } = req.app.get("models");
  const { id } = req.params;
  const contract = await Contract.findOne({
    where: {
      id,
      [Op.or]: [{ ContractorId: req.profile.id }, { ClientId: req.profile.id }],
    },
  });
  if (!contract) return res.status(404).end();
  res.json(contract);
});

/**
 * @returns contract list
 */
router.get("/", async (req, res) => {
  const { Contract, Jobs } = req.app.get("models");
  const contract = await Contract.findAll({
    where: {
      status: {
        [Op.in]: ["new", "in_progress"],
      },
      [Op.or]: [{ ContractorId: req.profile.id }, { ClientId: req.profile.id }],
    },
  });
  if (!contract) return res.status(404).end();
  res.json(contract);
});

module.exports = router;
