import { render, screen } from "@testing-library/react";
import DocsPage from "../app/docs/page";

describe("Docs page", () => {
  it("describes the documentation quickstart", () => {
    render(<DocsPage />);

    expect(
      screen.getByRole("heading", { name: /syncpad product documentation/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /quickstart/i, level: 2 })).toBeInTheDocument();
  });
});
