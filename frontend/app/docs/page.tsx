export default function DocsPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <div className="space-y-3">
        <span className="text-primary text-xs font-semibold uppercase tracking-[0.35em]">
          Documentation
        </span>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          SyncPad product documentation
        </h1>
        <p className="text-sm text-muted-foreground">
          The full developer guide is in progress. Review the quickstart below and reach out for
          early access to detailed architecture notes and API previews.
        </p>
      </div>
      <div className="grid gap-6 rounded-2xl border bg-card/60 p-6 shadow-sm">
        <section>
          <h2 className="text-lg font-semibold">Quickstart</h2>
          <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Clone &amp; install.</span> Run
              <code className="mx-1 rounded bg-muted px-1 py-0.5">pnpm install</code> at the repo
              root to sync dependencies.
            </li>
            <li>
              <span className="font-medium text-foreground">Set environment files.</span> Copy the
              sample <code>.env</code>
              templates for both the backend and frontend packages.
            </li>
            <li>
              <span className="font-medium text-foreground">Launch dev servers.</span> Use
              <code className="mx-1 rounded bg-muted px-1 py-0.5">
                pnpm --filter ./backend start:dev
              </code>{" "}
              and
              <code className="mx-1 rounded bg-muted px-1 py-0.5">
                pnpm --filter ./frontend dev
              </code>
              .
            </li>
            <li>
              <span className="font-medium text-foreground">Review contributor guide.</span> Check
              <code className="mx-1 rounded bg-muted px-1 py-0.5">AGENTS.md</code> for testing and
              workflow notes.
            </li>
          </ol>
        </section>
        <section>
          <h2 className="text-lg font-semibold">Roadmap snapshot</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>• Workspace membership management with fine-grained roles.</li>
            <li>• Realtime editor powered by CRDTs and presence indicators.</li>
            <li>• AI job orchestration for embeddings, summaries, and Q&amp;A.</li>
            <li>• Cloud-native deployment patterns via AWS CDK and Terraform.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
