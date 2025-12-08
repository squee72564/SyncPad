import { redirect, RedirectType } from "next/navigation";
import getSession from "@/lib/getSession";

export default async function ValidatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/signin", RedirectType.replace);
  }

  return <div className="w-full min-h-screen">{children}</div>;
}
