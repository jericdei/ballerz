export function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function combineDateAndTime(date: string, time: string) {
  const scheduledAt = new Date(`${date}T${time}`);

  if (Number.isNaN(scheduledAt.getTime())) {
    return null;
  }

  return scheduledAt;
}

export function formatScheduledAt(scheduledAt: Date | null) {
  if (!scheduledAt) {
    return "—";
  }

  return scheduledAt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function defaultScheduleValues() {
  const scheduledAt = new Date();
  scheduledAt.setMinutes(0, 0, 0);
  scheduledAt.setHours(scheduledAt.getHours() + 1);

  return {
    scheduledDate: toDateInputValue(scheduledAt),
    scheduledTime: toTimeInputValue(scheduledAt),
  };
}
