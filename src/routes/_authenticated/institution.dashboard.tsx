import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy path — the institutional workspace now lives at /institutions/dashboard. */
export const Route = createFileRoute("/_authenticated/institution/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/institutions/dashboard", replace: true });
  },
  component: () => null,
});
