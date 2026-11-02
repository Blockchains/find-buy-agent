import { useState } from "react";
import { Button, Field } from "@/components/ui/kit";
import { joinWaitlist } from "@/lib/waitlist";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Shopper");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="stack"
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        setError("");
        setMessage("");
        void joinWaitlist({ data: { email, role } })
          .then(() => {
            setMessage("Saved. FindBuyAgent stored the email and the role only, not a wallet. This site does not send mail, so there is no second message to click.");
            setEmail("");
          })
          .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not save that address."))
          .finally(() => setPending(false));
      }}
    >
      <Field label="Email">
        <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </Field>
      <Field label="Role">
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option>Shopper</option>
          <option>Merchant</option>
          <option>Developer</option>
        </select>
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Join the list"}
      </Button>
      <p className="fine-note">Privacy: the address is stored to tell you if pricing changes. No wallet address is stored with it.</p>
      {message ? <p role="status">{message}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
