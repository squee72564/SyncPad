export default function InvitesPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invites &amp; Access</h1>
        <p className="text-sm text-muted-foreground">
          Monitor pending invitations and audit share links that grant temporary workspace access.
        </p>
      </div>
      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
        Invitation management coming soon. Expect controls for resending, expiring, and elevating invite
        roles, plus visibility into external share tokens.
      </div>
    </div>
  );
}
