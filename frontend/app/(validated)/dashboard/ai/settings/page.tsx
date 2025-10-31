export default function AiSettingsPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure providers, privacy controls, and automation thresholds for workspace
          intelligence.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        AI configuration coming soon. Expect toggles for embedding cadence, prompt templates, cost
        guards, and provider credentials.
      </div>
    </div>
  );
}
