import { render, screen } from "@testing-library/react";
import SignUpPage from "@/app/signup/page";

describe("SignUp page", () => {
  it("renders intro and account form", async () => {
    const element = await SignUpPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(
      screen.getByRole("heading", { name: /create your syncpad workspace/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});
