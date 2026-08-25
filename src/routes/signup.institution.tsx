import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — institutional onboarding now starts at /institutions/join. */
export const Route = createFileRoute("/signup/institution")({
  beforeLoad: () => {
    throw redirect({ to: "/institutions/join", replace: true });
  },
  component: () => null,
});
