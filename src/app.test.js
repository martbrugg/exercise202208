const request = require("supertest");

const app = require("./app");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("GET /contracts/:id", () => {
  it("Check middleware", async () => {
    const response = await request(app)
      .get("/contracts/1")
      .set("Accept", "application/json");

    expect(response.status).toEqual(401);
  });

  it("Known Contract for Profile should not be empty", async () => {
    const response = await request(app)
      .get("/contracts/1")
      .set("Accept", "application/json")
      .set("profile_id", 5);

    expect(response.status).toEqual(200);
    expect(response.body.ContractorId).toEqual(5);
  });

  it("Unnkown contract should return null", async () => {
    const response = await request(app)
      .get("/contracts/2")
      .set("Accept", "application/json")
      .set("profile_id", 5);

    expect(response.status).toEqual(404);
  });
});

describe("GET /contracts/", () => {
  const baseUrl = "/contracts";
  it("Check middleware", async () => {
    const response = await request(app)
      .get(baseUrl)
      .set("Accept", "application/json");

    expect(response.status).toEqual(401);
  });

  it("List of Contracts for Profile 5 should be empty", async () => {
    const response = await request(app)
      .get(baseUrl)
      .set("Accept", "application/json")
      .set("profile_id", 5);

    expect(response.status).toEqual(200);
    expect(response.body.length).toEqual(0);
  });

  it("List of Contracts for Profile 7 should not be empty", async () => {
    const response = await request(app)
      .get(baseUrl)
      .set("Accept", "application/json")
      .set("profile_id", 7);

    expect(response.status).toEqual(200);
    expect(response.body.length).toBeGreaterThan(0);

    for (let i = 0; i < response.body.length.length; i++) {
      const element = response.body.length[i];
      expect(element.status).not.toEqual("terminated");
    }
  });
});

describe("GET /jobs/unpaid", () => {
  const baseUrl = "/jobs/unpaid";
  it("Check middleware", async () => {
    const response = await request(app)
      .get(baseUrl)
      .set("Accept", "application/json");

    expect(response.status).toEqual(401);
  });

  it("List of Jobs for Profile 5 should be empty", async () => {
    const response = await request(app)
      .get(baseUrl)
      .set("Accept", "application/json")
      .set("profile_id", 5);

    expect(response.status).toEqual(200);
    expect(response.body.length).toEqual(0);
  });

  it("List of Jobs for Profile 1 should have items", async () => {
    const response = await request(app)
      .get(baseUrl)
      .set("Accept", "application/json")
      .set("profile_id", 7);

    expect(response.status).toEqual(200);
    expect(response.body.length).toBeGreaterThan(0);

    for (let i = 0; i < response.body.length.length; i++) {
      const element = response.body.length[i];
      expect(element.paid).not.toBeTruthy();
    }
  });

  describe("POST /jobs/:id/pay", () => {
    it("Check middleware", async () => {
      const response = await request(app)
        .post("/jobs/2/pay")
        .set("Accept", "application/json");

      expect(response.status).toEqual(401);
    });

    it("Payment of Job should return paid job", async () => {
      const response = await request(app)
        .post("/jobs/2/pay")
        .set("Accept", "application/json")
        .set("profile_id", 1);

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(2);
      expect(response.body.paid).toBeTruthy();
    });

    it("Payment of paid Job should return status 400", async () => {
      const response = await request(app)
        .post("/jobs/2/pay")
        .set("Accept", "application/json")
        .set("profile_id", 1);

      expect(response.status).toEqual(400);
      expect(response.text).toEqual("job is already paid");
    });

    it("Payment of Job with unnsufficient balance should return status 400", async () => {
      const response = await request(app)
        .post("/jobs/5/pay")
        .set("Accept", "application/json")
        .set("profile_id", 4);

      expect(response.status).toEqual(400);
      expect(response.text).toEqual("not enough balance");
    });
  });

  describe("POST /balances/deposit/:id", () => {
    it("Check middleware", async () => {
      const response = await request(app)
        .post("//balances/deposit/1")
        .set("Accept", "application/json")
        .send({ amount: 1000 });

      expect(response.status).toEqual(404);
    });

    it("Deposit of to big amount shoud return 400", async () => {
      const response = await request(app)
        .post("/balances/deposit/4")
        .set("Accept", "application/json")
        .set("profile_id", 4)
        .send({ amount: 1000 });

      expect(response.status).toEqual(400);
      expect(response.text).toMatch(/Max payment amount/);
    });

    it("Deposit to client with no open jobs shoud return 400", async () => {
      const response = await request(app)
        .post("/balances/deposit/1")
        .set("Accept", "application/json")
        .set("profile_id", 4)
        .send({ amount: 50 });

      expect(response.status).toEqual(400);
      expect(response.text).toMatch(/No open Jobs found/);
    });

    it("Deposit of no body should return error 400", async () => {
      const response = await request(app)
        .post("/balances/deposit/4")
        .set("Accept", "application/json")
        .set("profile_id", 4)
        .send();

      expect(response.status).toEqual(400);
    });

    it("Concurrent Deposit shoud return updated Client with correct ammount", async () => {
      const p1 = request(app)
        .post("/balances/deposit/4")
        .set("Accept", "application/json")
        .set("profile_id", 4)
        .send({ amount: 10 });

      // Usecase of test was to check the transaction handling of conncurrent transactions
      // Unfortunately SQLite can only handle on Transaction at a time and throws an error if there are more

      const p2 = request(app)
        .post("/balances/deposit/4")
        .set("Accept", "application/json")
        .set("profile_id", 4)
        .send({ amount: 10 });

      // Usecase of test was to check the transaction handling of conncurrent transactions
      // Unfortunately SQLite can only handle on Transaction at a time and throws an error if there are more
      // const [response1, response2] = await Promise.all([p1, p2]);

      const [response1] = await Promise.all([p1]);
      const [response2] = await Promise.all([p2]);

      expect(response1.status).toEqual(200);
      expect(response1.body.id).toEqual(4);
      expect(response1.body.balance).toEqual(11.3);

      expect(response2.status).toEqual(200);
      expect(response2.body.id).toEqual(4);
      expect(response2.body.balance).toEqual(21.3);
    });

    it("Deposit shoud return updated Client", async () => {
      const response = await request(app)
        .post("/balances/deposit/4")
        .set("Accept", "application/json")
        .set("profile_id", 4)
        .send({ amount: 10 });

      expect(response.status).toEqual(200);
      expect(response.body.id).toEqual(4);
    });
  });

  describe("GET /admin/best-profession", () => {
    const baseUrl = "/admin/best-profession";
    it("Check middleware", async () => {
      const response = await request(app)
        .get(baseUrl)
        .set("Accept", "application/json");

      expect(response.status).toEqual(401);
    });

    it("Overall best profession without start and end should return null", async () => {
      const response = await request(app)
        .get(baseUrl)
        .set("Accept", "application/json")
        .set("profile_id", 5);

      expect(response.status).toEqual(200);
      expect(response.body).toBeNull();
    });

    it("Overall best profession should be Programmer", async () => {
      const response = await request(app)
        .get(baseUrl)
        .set("Accept", "application/json")
        .query({ start: "2020-01-15", end: "2020-12-15" })
        .set("profile_id", 5);

      expect(response.status).toEqual(200);
      expect(response.body.profession).toEqual("Programmer");
    });

    it("Overall best profession of date with no jobs should be null", async () => {
      const response = await request(app)
        .get(baseUrl)
        .set("Accept", "application/json")
        .set("profile_id", 5)
        .query({ start: "2020-10-15", end: "2020-12-15" });

      expect(response.status).toEqual(200);
      expect(response.body).toBeNull();
    });

    it("Overall best profession on 2020-08-17 should be Musician", async () => {
      const response = await request(app)
        .get(baseUrl)
        .set("Accept", "application/json")
        .set("profile_id", 5)
        .query({ start: "2020-08-17", end: "2020-08-17" });

      expect(response.status).toEqual(200);
      expect(response.body.profession).toEqual("Musician");
    });
  });

  describe("GET /admin/best-clients", () => {
    const baseUrl = "/admin/best-clients";
    it("Check middleware", async () => {
      const response = await request(app)
        .get(baseUrl)
        .set("Accept", "application/json");

      expect(response.status).toEqual(401);
    });

    it("Overall best clients should be Client Id 4 and result should have length 2", async () => {
      const response = await request(app)
        .get(baseUrl)
        .set("Accept", "application/json")
        .query({ start: "2020-01-15", end: "2020-12-15" })
        .set("profile_id", 5);

      expect(response.status).toEqual(200);
      expect(response.body.length).toEqual(2);
      expect(response.body[0].id).toEqual(4);
    });

    it("Overall best clients response with limit 3 should have length 3", async () => {
      const response = await request(app)
        .get(baseUrl)
        .set("Accept", "application/json")
        .set("profile_id", 5)
        .query({ start: "2020-08-15", end: "2020-12-15", limit: 3 });

      expect(response.status).toEqual(200);
      expect(response.body.length).toEqual(3);
    });

    it("Overall best clients of date with no jobs should be empty array", async () => {
      const response = await request(app)
        .get(baseUrl)
        .set("Accept", "application/json")
        .set("profile_id", 5)
        .query({ start: "2022-10-15", end: "2022-12-15" });

      expect(response.status).toEqual(200);
      expect(response.body).toBeNull();
    });
  });
});
