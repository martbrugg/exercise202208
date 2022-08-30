const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");

/**
 * @openapi
 * /contracts/{id}:
 *   get:
 *     tags:
 *      - contracts
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         type: integer
 *         minimum: 1
 *         description: The contract ID.
 *       - name: profile_id
 *         in: header
 *         description: profile id for authorization
 *         required: true
 *         type: string
 *     description: get contract by id
 *     responses:
 *       200:
 *         description: Returns the contract.
 */

/**
 * @returns contract by id
 */
router.get("/:id", async (req, res) => {
  try {
    const { Contract } = req.app.get("models");
    const { id } = req.params;
    const contract = await Contract.findOne({
      where: {
        id,
        [Op.or]: [
          { ContractorId: req.profile.id },
          { ClientId: req.profile.id },
        ],
      },
    });
    if (!contract) return res.status(404).end();
    res.json(contract);
  } catch (error) {
    res.status(500).end(error.message);
  }
});

/**
 * @openapi
 * /contracts:
 *   get:
 *     tags:
 *      - contracts
 *     parameters:
 *       - name: profile_id
 *         in: header
 *         description: profile id for authorization
 *         required: true
 *         type: string
 *     description: returns assigned contracts
 *     responses:
 *       200:
 *         description: Returns a list of assigned contracts.
 */

/**
 * @returns contract list
 */
router.get("/", async (req, res) => {
  try {
    const { Contract, Jobs } = req.app.get("models");
    const contracts = await Contract.findAll({
      where: {
        status: {
          [Op.in]: ["new", "in_progress"],
        },
        [Op.or]: [
          { ContractorId: req.profile.id },
          { ClientId: req.profile.id },
        ],
      },
    });
    if (!contracts) return res.status(404).end();
    res.json(contracts);
  } catch (error) {
    res.status(500).end(error.message);
  }
});

module.exports = router;
