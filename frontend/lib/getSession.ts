import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie =
    cookieStore.get("__Secure-better-auth.session_token")?.value ??
    cookieStore.get("better-auth.session_token")?.value;

  if (!sessionCookie) {
    redirect("/signin");
  }

  const res = await fetch("http://localhost:3001/v1/user/self", {
    headers: {
      cookie: `better-auth.session_token=${sessionCookie}`,
    },
    cache: "no-store",
  });

  return res.json();
}
