import { Calendar, View, Views, EventWrapperProps } from "react-big-calendar";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { getRangeFromDateAndView, formats, localizer } from "../utils/calendar";
import { useAvailability } from "../hooks/use-availability";
import {
  Button,
  Loader,
  Modal,
  Popover,
  Space,
  TextInput,
} from "@mantine/core";
import styles from "../styles/calendar.module.css";
import { useMemo, useCallback, useState, useEffect } from "react";
import { useAddAVailabilityMutation } from "../hooks/use-add-availabilty.mutation";
import { CalendarEvent } from "../types/calendar-event";
import { useDeleteAvailabilityMutation } from "../hooks/use-delete-availability.mutation";
import React from "react";
import { Range } from "../hooks/use-reservations";
import { useSearchParams } from "react-router-dom";
import { CustomToolbar } from "../components/CustomToolBar";
import { useQueryClient } from "@tanstack/react-query";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { toast } from "react-toastify";

interface EventWrapperWithChildrenProps
  extends EventWrapperProps<CalendarEvent> {
  children?: React.ReactNode;
}

export default function CalendarAvailability() {
  const initialRange: Range = getRangeFromDateAndView(new Date(), Views.WEEK);

  const [range, setRange] = useState<Range>(initialRange);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const { data: availabilityData, isLoading } = useAvailability(range);
  const [currentView, setCurrentView] = useState<View>(Views.WEEK);
  const mutation = useAddAVailabilityMutation(range);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [opened, handler] = useDisclosure(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
  } | null>(null);

  const deleteAvailability = useDeleteAvailabilityMutation();

  const form = useForm({
    initialValues: {
      title: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (range) {
      params.set("start", range.start.toISOString());
      params.set("end", range.end.toISOString());
    }
    setSearchParams(params);
  }, [range]);

  useEffect(() => {
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    if (startParam && endParam) {
      const start = new Date(startParam);
      const end = new Date(endParam);
      setRange({ start, end });
    } else {
      const now = new Date();
      const fallbackRange = getRangeFromDateAndView(now, currentView);
      setRange(fallbackRange);
      setSearchParams({
        start: fallbackRange.start.toISOString(),
        end: fallbackRange.end.toISOString(),
      });
    }
  }, []);

  const handleDeleteEvent = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!selectedEventId) return;

      setIsDeleting(true);
      deleteAvailability.mutate(selectedEventId, {
        onSuccess: () => {
          setSelectedEventId(null);
          setIsDeleting(false);
        },
        onError: () => {
          setIsDeleting(false);
        },
      });
    },
    [selectedEventId, deleteAvailability]
  );

  const events: CalendarEvent[] = useMemo(() => {
    return (
      availabilityData?.flatMap((group) =>
        group.slots.map((slot) => ({
          id: slot.id,
          title: slot.title,
          start: new Date(slot.startTime),
          end: new Date(slot.endTime),
        }))
      ) ?? []
    );
  }, [availabilityData]);

  const handleAddAvailability = useCallback(
    (values: { title: string }) => {
      if (isDeleting || !selectedSlot) return;

      mutation.mutate(
        {
          title: values.title,
          start: selectedSlot.start.toISOString(),
          end: selectedSlot.end.toISOString(),
        },
        {
          onSuccess: () => {
            handler.close();
            form.reset();
            setSelectedSlot(null);
          },
          onError: (error) => {
            toast.error("Errore nell'aggiunta della disponibilità:" + error);
          },
        }
      );
    },
    [mutation, isDeleting, selectedSlot, handler, form]
  );

  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date }) => {
      if (isDeleting) return;

      setSelectedSlot({ start: slotInfo.start, end: slotInfo.end });
      handler.open();
    },
    [isDeleting, handler]
  );

  const handleModalClose = useCallback(() => {
    handler.close();
    form.reset();
    setSelectedSlot(null);
  }, [handler, form]);

  const handleNavigate = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      const newRange = getRangeFromDateAndView(date, currentView);
      setRange(newRange);

      setSearchParams({
        start: newRange.start.toISOString(),
        end: newRange.end.toISOString(),
      });
    },
    [currentView, setSearchParams]
  );

  const EventWrapperWithPopover: React.FC<EventWrapperWithChildrenProps> = ({
    event,
    children,
  }) => {
    const isOpen = selectedEventId === event.id;

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setSelectedEventId(isOpen ? null : event.id);
    };

    const handlePopoverClick = (e: React.MouseEvent) => {
      // Impedisci che i click all'interno del popover si propaghino al calendario
      e.stopPropagation();
      e.preventDefault();
    };

    if (!React.isValidElement(children)) return <>{children}</>;

    const cloned = React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      style: {
        ...(children as React.ReactElement<any>).props.style,
        cursor: "pointer",
        position: "relative",
      },
    });

    return (
      <Popover
        opened={isOpen}
        onClose={() => setSelectedEventId(null)}
        withArrow
        trapFocus={false}
        position="bottom-start"
        withinPortal={true}
        offset={5}
      >
        <Popover.Target>{cloned}</Popover.Target>
        <Popover.Dropdown onClick={handlePopoverClick}>
          <Button color="red" onClick={handleDeleteEvent}>
            Elimina
          </Button>
        </Popover.Dropdown>
      </Popover>
    );
  };

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
    <div className={styles.container}>
      <Calendar
        // style={{ height: "100vh" }}
        date={currentDate}
        selectable={currentView != Views.MONTH ? true : false}
        onSelectSlot={handleSelectSlot}
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        view={currentView}
        onView={(view) => setCurrentView(view)}
        onNavigate={handleNavigate}
        formats={formats}
        titleAccessor="title"
        culture="it"
        components={{
          eventWrapper: EventWrapperWithPopover,
          toolbar: (props) => (
            <CustomToolbar
              {...props}
              views={[Views.DAY, Views.WEEK, Views.MONTH]}
              invalidate={() => {
                if (!range) return;
                queryClient.invalidateQueries({
                  queryKey: ["availabilities", range],
                });
              }}
              toggleFilter={undefined}
            />
          ),
        }}
      />
      <Modal
        opened={opened}
        onClose={handleModalClose}
        title={null}
        size="md"
        radius="lg"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        centered={true}
        withCloseButton={false}
      >
        <div className={styles.modalContainer}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2
                style={{
                  marginBottom: "0.5rem",
                  fontSize: "1.5rem",
                  color: "var(--text-primary)",
                }}
              >
                Inserisci disponibilità
              </h2>

              {selectedSlot && (
                <div className={styles.modalDates}>
                  <p className={styles.customDates}>
                    <strong>Dal</strong>

                    {selectedSlot.start.toLocaleString("it-IT")}
                  </p>
                  <Space w={"xl"} />
                  <Space w={"xl"} />
                  <p className={styles.customDates}>
                    <strong>Al</strong>{" "}
                    {selectedSlot.end.toLocaleString("it-IT")}
                  </p>
                </div>
              )}
            </div>

            <div className={styles.formContainerModal}>
              <form
                className={styles.formModal}
                onSubmit={form.onSubmit(handleAddAvailability)}
              >
                <TextInput
                  size="lg"
                  {...form.getInputProps("title")}
                  placeholder="Dai un titolo a questa disponibilità..."
                  w={"400px"}
                  style={{ marginBottom: "1rem" }}
                  required
                />
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    justifyContent: "center",
                  }}
                >
                  <Button
                    type="submit"
                    loading={mutation.isPending}
                    className="button"
                    disabled={!selectedSlot}
                  >
                    Aggiungi
                  </Button>
                  <Space w={"xl"} />
                  <Button
                    className="button"
                    onClick={handleModalClose}
                    disabled={mutation.isPending}
                  >
                    Annulla
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
