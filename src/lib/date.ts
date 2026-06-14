export function currentMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end)
  };
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function endOfDayIso(dateValue: string) {
  return `${dateValue}T23:59:59.999Z`;
}

export function formatBrDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short"
  }).format(date);
}
