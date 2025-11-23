import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders hero message and key calls to action", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /syncpad keeps every decision, document, and discussion/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute("href", "/signin");
    expect(screen.getByRole("link", { name: /create your workspace/i })).toHaveAttribute(
      "href",
      "/signup"
    );
  });
});
