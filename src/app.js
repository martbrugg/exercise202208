const express = require("express");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");

const { getProfile } = require("./middleware/getProfile");
const contractsRoute = require('./routes/contracts');
const jobsRoute = require('./routes/jobs');
const balancesRoute = require('./routes/balances');
const adminRoute = require('./routes/admin');

const app = express();
app.use(bodyParser.json());
app.set("sequelize", sequelize);
app.set("models", sequelize.models);

app.use("/contracts", getProfile, contractsRoute);
app.use("/jobs", getProfile, jobsRoute);
app.use("/balances", getProfile, balancesRoute);
app.use("/admin", getProfile, adminRoute);



// /**
//  * FIX ME!
//  * @returns contract by id
//  */
// app.get("/contracts/:id", getProfile, async (req, res) => {
//   const { Contract } = req.app.get("models");
//   const { id } = req.params;
//   const contract = await Contract.findOne({
//     where: {
//       id,
//       [Op.or]: [{ ContractorId: req.profile.id }, { ClientId: req.profile.id }],
//     },
//   });
//   if (!contract) return res.status(404).end();
//   res.json(contract);
// });
module.exports = app;
