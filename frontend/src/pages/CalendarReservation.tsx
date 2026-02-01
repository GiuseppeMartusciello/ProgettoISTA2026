import { Calendar, View, Views } from "react-big-calendar";
import { EventWrapperWithPopover } from "../components/EventWrapperWIthPopover";

import { Loader } from "@mantine/core";
import { useMemo, useCallback, useState, useEffect } from "react";

import { ReservationCalendarEvent } from "../types/reservation-calendar-events";
import { Range, useReservations } from "../hooks/use-reservations";
import React from "react";

import { useSearchParams } from "react-router-dom";

import { CustomToolbar } from "../components/CustomToolBar";
import { getRangeFromDateAndView, formats, localizer } from "../utils/calendar";
import { Status } from "../types/status";
import { useQueryClient } from "@tanstack/react-query";

export default function CalendarReservations() {
  const [range, setRange] = useState<Range | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get("status") as Status;
  const status = rawStatus === "ALL" ? "ALL" : "CONFIRMED";

  const queryClient = useQueryClient();

  const { data: reservationsData, isLoading } = useReservations(range, status);

  const [currentView, setCurrentView] = useState<View>(Views.WEEK);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedEvent, setSelectedEvent] = useState<
    ReservationCalendarEvent | undefined
  >();

  const events: ReservationCalendarEvent[] = useMemo(() => {
    if (!reservationsData) {
      return [];
    }

    console.log("Reservations: ", reservationsData);

    const fetched: ReservationCalendarEvent[] =
      reservationsData?.flatMap((group) =>
        group.reservations.map((slot) => ({
          id: slot.id,
          createdAt: slot.createdAt,
          start: new Date(slot.startTime),
          end: new Date(slot.endTime),

          status: slot.status,
          visitType: slot.visitType,
          patient: {
            name: slot.patient.name,
            surname: slot.patient.surname,
            id: slot.patient.id,
            gender: slot.patient.gender,
            cf: slot.patient.cf,
          },
        }))
      ) ?? [];

    return fetched;
  }, [reservationsData]);

  const handleNavigate = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      const newRange = getRangeFromDateAndView(date, currentView);
      setRange(newRange);

      setSearchParams({
        status,
        start: newRange.start.toISOString(),
        end: newRange.end.toISOString(),
      });
    },
    [currentView, status, setSearchParams]
  );

  useEffect(() => {
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");
    const status = searchParams.get("status") as Status;

    if (startParam && endParam) {
      const start = new Date(startParam);
      const end = new Date(endParam);
      setRange({ start, end });
    } else {
      const now = new Date();
      const fallbackRange = getRangeFromDateAndView(now, currentView);
      setRange(fallbackRange);
      setSearchParams({
        status,
        start: fallbackRange.start.toISOString(),
        end: fallbackRange.end.toISOString(),
      });
    }
  }, []);

  const handleSelectEvent = useCallback(
    (event: ReservationCalendarEvent, _e: React.SyntheticEvent) => {
      console.log("Event: ", event);

      setSelectedEvent(event);
    },
    []
  );

  useEffect(() => {
    console.log(selectedEvent);
  }, [selectedEvent]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("status", status);
    if (range) {
      params.set("start", range.start.toISOString());
      params.set("end", range.end.toISOString());
    }
    setSearchParams(params);
  }, [status, range]);

  if (isLoading)
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh", // occupa tutto lo schermo
        }}
      >
        <Loader size="xl" />
      </div>
    );

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
      }}
    >
      <Calendar
        selectable={false}
        date={currentDate}
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={[Views.WEEK, Views.DAY]}
        view={currentView}
        onView={(view) => setCurrentView(view)}
        onSelectEvent={handleSelectEvent}
        formats={formats}
        components={{
          eventWrapper: (props) => (
            <EventWrapperWithPopover
              {...props}
              selectedEvent={selectedEvent}
              setSelectedEvent={setSelectedEvent}
            />
          ),
          toolbar: (props) => (
            <CustomToolbar
              {...props}
              views={[Views.WEEK, Views.DAY]}
              invalidate={() => {
                if (!range) return;
                queryClient.invalidateQueries({
                  queryKey: ["reservations", range, status],
                });
              }}
              toggleFilter={{
                label: "Mostra richieste",
                param: "status",
                options: ["ALL", "CONFIRMED"],
              }}
            />
          ),
        }}
        onNavigate={handleNavigate}
        culture="it"
        eventPropGetter={(event) => {
          if (event.status === "PENDING") {
            return {
              className: "pendingEvent",
            };
          }
          return {};
        }}
      />
    </div>
  );
}
