"use server";

import { cookies } from "next/headers";
import { cache } from "react";

async function _getSession() {
  const cookieStore = await cookies();
  const sessionCookie =
    cookieStore.get("__Secure-better-auth.session_token")?.value ??
    cookieStore.get("better-auth.session_token")?.value;

  const res = await fetch("http://localhost:3001/v1/user/self", {
    headers: {
      cookie: `better-auth.session_token=${sessionCookie}`,
    },
    cache: "no-store",
  });

  return res.json();
}

export default cache(_getSession);
