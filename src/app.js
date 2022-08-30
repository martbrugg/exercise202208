const express = require("express");
const bodyParser = require("body-parser");
const { sequelize } = require("./model");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { getProfile } = require("./middleware/getProfile");
const contractsRoute = require('./routes/contracts');
const jobsRoute = require('./routes/jobs');
const balancesRoute = require('./routes/balances');
const adminRoute = require('./routes/admin');
const swagger = require('./config/swagger')
const app = express();

app.use(bodyParser.json());
app.set("sequelize", sequelize);
app.set("models", sequelize.models);


// load routes for the endpoints
app.use("/contracts", getProfile, contractsRoute);
app.use("/jobs", getProfile, jobsRoute);
app.use("/balances", getProfile, balancesRoute);
app.use("/admin", getProfile, adminRoute);


// Generation of Swagger API Documentation
const specs = swaggerJsdoc(swagger.options);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs)
);

// /**
//  * FIX ME!
//  * @returns contract by id
//  */

// Moved Handler into contracts route
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
