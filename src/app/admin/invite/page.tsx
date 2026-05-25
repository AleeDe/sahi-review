import { InviteForm } from "./invite-form";

export default function InvitePage() {
  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invite tenant</h1>
        <p className="text-sm text-zinc-500">
          Sends a magic-link email and pre-creates the business.
        </p>
      </div>
      <InviteForm />
    </div>
  );
}
