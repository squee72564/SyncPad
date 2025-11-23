import { render, screen } from "@testing-library/react";
import SignInPage from "@/app/signin/page";

describe("SignIn page", () => {
  it("shows the sign-in form", async () => {
    const element = await SignInPage({ searchParams: Promise.resolve({}) });
    render(element);

    screen.getAllByText(/sign in/i).map((element) => expect(element).toBeInTheDocument());
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
