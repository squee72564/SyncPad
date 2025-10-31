import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <div className="space-y-3 text-center md:text-left">
        <span className="text-primary text-xs font-semibold uppercase tracking-[0.35em]">
          Contact
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          We’d love to hear from you
        </h1>
        <p className="text-sm text-muted-foreground">
          Whether you’re exploring SyncPad for your team, planning an integration, or looking for
          early access to enterprise features, drop us a note and we’ll respond within one business
          day.
        </p>
      </div>

      <div className="rounded-2xl border bg-card/70 p-6 shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">General enquiries</h2>
            <p className="text-sm text-muted-foreground">
              Email{" "}
              <a className="text-primary" href="mailto:team@syncpad.io">
                team@syncpad.io
              </a>{" "}
              for partnerships, press, and roadmap questions.
            </p>
          </div>
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Support</h2>
            <p className="text-sm text-muted-foreground">
              Need help deploying SyncPad? Open an issue in GitHub or send details to
              <a className="text-primary" href="mailto:support@syncpad.io">
                {" "}
                support@syncpad.io
              </a>{" "}
              with logs attached.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/signup">Create a workspace</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/docs">Read the docs</Link>
        </Button>
      </div>
    </div>
  );
}
