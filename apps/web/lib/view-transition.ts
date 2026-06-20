export function viewTransitionNavigate(navigate: () => void | Promise<void>) {
  if (
    typeof document !== "undefined" &&
    "startViewTransition" in document &&
    typeof document.startViewTransition === "function"
  ) {
    document.startViewTransition(() => {
      navigate();
    });
    return;
  }

  void navigate();
}
