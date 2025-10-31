import { render, screen } from "@testing-library/react";
import SignUpPage from "../app/signup/page";

describe("SignUp page", () => {
  it("renders intro and account form", () => {
    render(<SignUpPage />);

    expect(
      screen.getByRole("heading", { name: /create your syncpad workspace/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
