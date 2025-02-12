const { inactiveUsers } = require("../../lib/inactiveUsers");

describe("Smoke test", () => {
  it("inactiveUsers is a function", () => {
    expect(inactiveUsers).toBeInstanceOf(Function);
  });
});