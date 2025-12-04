import HomeNavigationMenu from "@/components/HomeNavigationMenu";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const navLinks = [{ label: "Sign In", href: "/signin", variant: "default" as const }];

const pillars = [
  {
    title: "Collaborative Workspaces",
    description:
      "Organise knowledge within workspaces. Role-aware permissions keep every workspace secure and focused.",
  },
  {
    title: "AI-Augmented Workflows",
    description: "Leverage AI Agents to discover insights about your knowledge base.",
  },
  {
    title: "Realtime Co-authoring",
    description: "Utilize our realtime editing for documents to instantly collaborate with others.",
  },
];

const highlights = [
  {
    title: "Document Intelligence",
    points: [
      "Use AI to summarize, compare, and garner insights from workspace knowledge.",
      "Share documents outside of your organization with read, comment, or edit access at scale.",
    ],
  },
  {
    title: "Operational Confidence",
    points: [
      "Reliable storage for all your workspace knowledge.",
      "Activity logs for workspace activity keep leadership in the loop.",
    ],
  },
];

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-background via-primary/5 via-30% to-background">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <HomeNavigationMenu className="hidden flex-1 justify-start md:flex" />
        <div className="flex flex-1 items-center justify-end gap-3">
          {navLinks.map((link) => (
            <Button key={link.label} asChild variant={link.variant}>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-24 px-6 pb-24">
        <section
          id="overview"
          className="relative grid gap-10 py-12 md:grid-cols-[1.1fr_0.9fr] md:items-center"
        >
          <div className="flex flex-col gap-6">
            <span className="text-primary text-sm font-semibold uppercase tracking-widest">
              Collaborative Knowledge, Accelerated
            </span>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              SyncPad keeps every decision, document, and discussion at your team&apos;s fingertips.
            </h1>
            <p className="text-balance text-base text-muted-foreground sm:text-lg">
              Write together in realtime, search across your institutional knowledge with AI, and
              deliver updates confidently—without context switching or knowledge silos.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Start building a workspace</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/docs">View product docs</Link>
              </Button>
            </div>
          </div>
          <div className="relative isolate overflow-hidden rounded-3xl border bg-card p-8 shadow-xl">
            <div className="absolute -inset-x-16 -top-24 h-40 bg-primary/20 blur-3xl" aria-hidden />
            <div className="relative flex flex-col gap-6">
              <div>
                <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  Platform Highlights
                </h2>
                <p className="text-lg font-semibold">What teams unlock with SyncPad</p>
              </div>
              <dl className="grid gap-6 text-sm text-muted-foreground">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="rounded-xl border border-border/60 bg-background/80 p-4"
                  >
                    <dt className="text-sm font-semibold text-foreground">{pillar.title}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {pillar.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        <section id="features" className="grid gap-8">
          <span className="text-primary text-xs font-semibold uppercase tracking-[0.4em]">
            {" "}
            Why SyncPad
          </span>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Designed for distributed teams managing high-stakes knowledge.
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {highlights.map((feature) => (
              <div
                key={feature.title}
                className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span aria-hidden className="mt-1 size-1.5 rounded-full bg-primary" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section
          id="cta"
          className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-primary/90 to-primary shadow-xl"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%)]" />
          <div className="relative grid gap-8 px-10 py-12 text-primary-foreground md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div className="flex flex-col gap-4">
              <h2 className="text-3xl font-semibold tracking-tight">
                Ready to unify your knowledge?
              </h2>
              <p className="text-sm text-primary-foreground/90">
                SyncPad streamlines document creation, approvals, and discovery so your team can
                focus on delivering impactful work. Start with local Docker Compose, graduate to
                cloud-native deployments whenever you are ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link href="/signup">Create your workspace</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
