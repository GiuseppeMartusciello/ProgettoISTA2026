import { dateFnsLocalizer, View } from "react-big-calendar";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
} from "date-fns";
import { parse } from "date-fns/parse";
import { format } from "date-fns/format";
import { Range } from "../hooks/use-reservations";
import { it } from "date-fns/locale";
import { getDay } from "date-fns/getDay";

export function getRangeFromDateAndView(date: Date, view: View): Range {
  switch (view) {
    case "day":
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      };
    case "week":
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case "month":
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
    default:
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      };
  }
}

export const formats = {
  timeGutterFormat: "HH:mm",

  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, "HH:mm", { locale: it })} – ${format(end, "HH:mm", {
      locale: it,
    })}`,
  selectRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, "HH:mm", { locale: it })} – ${format(end, "HH:mm", {
      locale: it,
    })}`,

  dayFormat: (date: Date) => format(date, "d", { locale: it }),
  weekdayFormat: (date: Date) => format(date, "EEEEEE", { locale: it }),
  dayHeaderFormat: (date: Date) => format(date, "EEEE d MMMM", { locale: it }),
  agendaDateFormat: (date: Date) => format(date, "EEEE d MMMM", { locale: it }),
  agendaTimeFormat: "HH:mm",
  agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, "HH:mm", { locale: it })} – ${format(end, "HH:mm", {
      locale: it,
    })}`,

  monthHeaderFormat: (date: Date) => format(date, "MMMM yyyy", { locale: it }),
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${format(start, "d MMM", { locale: it })} – ${format(end, "d MMM yyyy", {
      locale: it,
    })}`,
};

const locales = {
  it: it,
};

export const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Formato compatto

// Output: "sab 5 lug"

// Formato personalizzato

export const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("it-IT");
};
