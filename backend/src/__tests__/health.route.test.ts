import request from "supertest";
import httpStatus from "http-status";
import app from "../app.js";

describe("Health route", () => {
  it("returns uptime metadata", async () => {
    const response = await request(app).get("/v1/health");

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toEqual(
      expect.objectContaining({
        status: httpStatus.OK,
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      })
    );
  });
});
