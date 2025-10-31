import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SignUp from "@/components/auth/signUp";

type OnboardingSlide = {
  eyebrow: string;
  title: string;
  description: string;
  stats: { label: string; value: string }[];
};

const onboardingSlides: OnboardingSlide[] = [
  {
    eyebrow: "Tailored start",
    title: "Spin up a workspace in minutes",
    description:
      "Name your workspace, invite team members, and define default permissions before anyone writes a line of content.",
    stats: [
      { label: "Invite readiness", value: "Pre-configured roles" },
      { label: "Data model", value: "Workspace, documents, comments" },
      { label: "Storage", value: "PostgreSQL + Prisma" },
    ],
  },
  {
    eyebrow: "Security aware",
    title: "Control access without slowing the team",
    description:
      "Every workspace member has a clear role while share links offer temporary access for contractors, clients, or reviewers.",
    stats: [
      { label: "Roles", value: "Owner → Viewer" },
      { label: "Share links", value: "View / Comment / Edit" },
      { label: "Logging", value: "Activity feed + audits" },
    ],
  },
  {
    eyebrow: "Future ready",
    title: "Cloud native when you are",
    description:
      "Develop locally with Docker Compose, then move to your preferred cloud stack with IaC once you are production ready.",
    stats: [
      { label: "Gateway", value: "Express API" },
      { label: "AI", value: "Vector search & summaries" },
      { label: "IaC", value: "AWS CDK roadmap" },
    ],
  },
];

function OnboardingCard({ slide }: { slide: OnboardingSlide }) {
  return (
    <Card className="mx-auto h-[380px] max-w-lg border border-border/50 bg-gradient-to-br from-background via-primary/5 to-background shadow-lg">
      <CardHeader className="flex h-full flex-col gap-6 p-8">
        <div className="flex flex-col gap-3">
          <span className="text-primary text-xs font-semibold uppercase tracking-[0.35em]">
            {slide.eyebrow}
          </span>
          <CardTitle className="text-balance text-2xl font-semibold tracking-tight text-foreground">
            {slide.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {slide.description}
          </CardDescription>
        </div>
        <dl className="grid gap-3 text-sm text-muted-foreground">
          {slide.stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center justify-between rounded-lg bg-background/70 px-3 py-2"
            >
              <dt className="font-medium text-foreground/80">{stat.label}</dt>
              <dd className="text-foreground">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </CardHeader>
    </Card>
  );
}

export default function SignUpPage() {
  return (
    <div className="grid min-h-screen w-full grid-rows-[auto_1fr] bg-background md:grid-cols-[0.95fr_1.05fr] md:grid-rows-1">
      <div className="relative hidden items-center justify-center overflow-hidden bg-muted/60 p-12 md:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(82,63,255,0.18),_transparent_55%)]" />
        <Carousel
          className="relative w-full max-w-lg"
          opts={{ loop: true, align: "start" }}
          autoplay
          autoplayInterval={6500}
        >
          <CarouselContent>
            {onboardingSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <OnboardingCard slide={slide} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <div className="relative flex items-center justify-center px-6 py-12 md:px-16">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background via-background/60 to-transparent md:hidden" />
        <div className="w-full max-w-lg space-y-10">
          <div className="space-y-3 text-center md:text-left">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Create your SyncPad workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              Start with core collaboration tools and scale to realtime, AI-assisted workflows as
              your team adopts SyncPad.
            </p>
          </div>
          <SignUp className="w-full" />
        </div>
      </div>
    </div>
  );
}
