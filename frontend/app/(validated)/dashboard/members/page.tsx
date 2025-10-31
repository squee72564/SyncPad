export default function MembersPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members &amp; Roles</h1>
        <p className="text-sm text-muted-foreground">
          Review workspace membership, assign roles, and track invitations tied to each seat.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Member management UI coming soon. This view will surface owners, admins, editors,
        commenters, and viewers from the workspace roster.
      </div>
    </div>
  );
}
