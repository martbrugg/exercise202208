module.exports.options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Deel Demo API",
        version: "0.1.0",
        description:
          "This is a Demo API for the DEEL Backend excercice",
        contact: {
          email: "martbrugg@gmail.com",
        },
      },
      servers: [
        {
          url: "http://localhost:3001/",
        },
      ],
      securityDefinitions: {
        api_key: {
          type: 'apiKey',
          name: 'profile_id',
          in: 'header'
        }
      },
      security: {
        api_key: []
      }
    },
    apis: ["./src/routes/contracts.js","./src/routes/jobs.js","./src/routes/balances.js","./src/routes/admin.js"],
  };