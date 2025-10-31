import { render, screen } from "@testing-library/react";
import ContactPage from "../app/contact/page";

describe("Contact page", () => {
  it("provides contact information", () => {
    render(<ContactPage />);

    expect(screen.getByRole("heading", { name: /we’d love to hear from you/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /team@syncpad.io/i })).toHaveAttribute(
      "href",
      "mailto:team@syncpad.io"
    );
  });
});
