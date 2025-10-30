import HomeNavigationMenu from "@/components/HomeNavigationMenu";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function Home() {
  return (
    <div className="flex flex-col">
      <div className="flex px-5 py-2">
        <HomeNavigationMenu className="max-w-full" />
        <div className="flex justify-center items-center gap-5 flex-wrap">
          <Button variant={"default"}>
            <Link href="/signin">Sign In</Link>
          </Button>
          <Button variant={"outline"}>
            <Link href="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-row min-h-screen items-center justify-center">
        <h1>SyncPad</h1>
      </div>
    </div>
  );
}

export default Home;
