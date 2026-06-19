export function guardDialogOpenChange(
  isPending: boolean,
  setOpen: (open: boolean) => void,
) {
  return (open: boolean) => {
    if (!isPending) {
      setOpen(open);
    }
  };
}
