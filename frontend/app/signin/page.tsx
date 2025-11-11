import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SignIn from "@/components/auth/signIn";

type CarouselSlide = {
  eyebrow: string;
  title: string;
  description: string;
  bulletPoints: string[];
};

const carouselSlides: CarouselSlide[] = [
  {
    eyebrow: "Workspace clarity",
    title: "Bring documents, decisions, and context together",
    description:
      "SyncPad eliminates scattered docs. Organise knowledge by workspace, assign roles, and track versions across every project.",
    bulletPoints: [
      "Role-aware workspaces keep teams, clients, and initiatives separate.",
      "Document history and revisions remain searchable forever.",
      "Activity logs help leaders track approvals and ownership.",
    ],
  },
  {
    eyebrow: "AI-native discovery",
    title: "Find answers faster with semantic search",
    description:
      "Ask natural-language questions and retrieve trustworthy summaries grounded in your content.",
    bulletPoints: [
      "Vector embeddings sync automatically from document edits.",
      "AI summaries unblock reviews, stakeholder updates, and handoffs.",
      "Every answer cites the source so teams can dive deeper when needed.",
    ],
  },
  {
    eyebrow: "Collaboration-first",
    title: "Edit together without version conflicts",
    description:
      "Realtime CRDT editing, inline comments, and share links keep everyone aligned across time zones.",
    bulletPoints: [
      "Presence indicators highlight who is in the doc right now.",
      "Comment threads turn feedback into structured review cycles.",
      "Granular share links unlock view, comment, or edit permissions in seconds.",
    ],
  },
];

function SlideCard({ slide }: { slide: CarouselSlide }) {
  return (
    <Card className="mx-auto h-[420px] max-w-xl border border-border/40 bg-gradient-to-br from-primary/10 via-background to-background shadow-xl">
      <CardHeader className="flex h-full flex-col justify-between gap-6 p-8">
        <div className="flex flex-col gap-4">
          <span className="text-primary text-xs font-semibold uppercase tracking-[0.3em]">
            {slide.eyebrow}
          </span>
          <CardTitle className="text-balance text-2xl font-semibold tracking-tight text-foreground">
            {slide.title}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {slide.description}
          </CardDescription>
        </div>
        <ul className="space-y-3 text-sm text-muted-foreground">
          {slide.bulletPoints.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-primary" aria-hidden />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </CardHeader>
    </Card>
  );
}

type SignInPageProps = {
  searchParams: Promise<{ redirect?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect: redirectParam } = await searchParams;
  const redirectTo = redirectParam;

  return (
    <div className="grid min-h-screen w-full grid-rows-[auto_1fr] bg-background md:grid-cols-[1.1fr_0.9fr] md:grid-rows-1">
      <div className="relative hidden items-center justify-center overflow-hidden bg-muted/50 p-12 md:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(82,63,255,0.18),_transparent_55%)]" />
        <Carousel
          className="relative w-full max-w-xl"
          opts={{ loop: true, align: "start" }}
          autoplay
          autoplayInterval={6000}
        >
          <CarouselContent>
            {carouselSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <SlideCard slide={slide} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="pointer-events-none absolute inset-x-0 bottom-12 flex w-full justify-center gap-2">
          {carouselSlides.map((_slide, index) => (
            <span key={index} className="h-1 w-6 rounded-full bg-primary/30" />
          ))}
        </div>
      </div>

      <div className="relative flex items-center justify-center px-6 py-12 md:px-12">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background via-background/60 to-transparent md:hidden" />
        <SignIn className="w-full" redirectTo={redirectTo ?? undefined} />
      </div>
    </div>
  );
}
