import {
  Button,
  Divider,
  Group,
  Loader,
  Space,
  TextInput,
  Title,
} from "@mantine/core";
import {
  useReservationCounts,
  useReservations,
} from "../hooks/use-reservations";
import { Text } from "@mantine/core";
import { usePatchReservationMutation } from "../hooks/use-patch-reservation.mutation";
import styles from "../styles/reservationsRequests.module.css";
import ReservationRequestCard from "../components/ReservationRequestCard";
import { CalendarRangeIcon, SearchIcon } from "lucide-react";
import { useState } from "react";

const ReservationsRequests = () => {
  const { data, isLoading } = useReservations(null, "PENDING");
  const mutation = usePatchReservationMutation();
  const { data: counts } = useReservationCounts();
  const [searchQuery, setSearchQuery] = useState("");

  console.log("Reservations: ", data);

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

  if (!data || data.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Group>
          <Text size="lg" fw={500}>
            Nessuna prenotazione al momento
          </Text>
          <Loader size="sm" />
        </Group>
      </div>
    );
  }

  const normalizedQuery = searchQuery.toLowerCase().trim();

  const filteredData = data
    .map((group) => {
      const groupDate = new Date(group.date)
        .toLocaleDateString("it-IT", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
        .toLowerCase();

      const filteredReservations = group.reservations.filter((r) => {
        const fullName = `${r.patient.name} ${r.patient.surname}`.toLowerCase();
        const cf = r.patient.cf?.toLowerCase() ?? "";
        const type = r.visitType?.toLowerCase() ?? "";

        return (
          fullName.includes(normalizedQuery) ||
          cf.includes(normalizedQuery) ||
          type.includes(normalizedQuery) ||
          groupDate.includes(normalizedQuery)
        );
      });

      return {
        ...group,
        reservations: filteredReservations,
      };
    })
    .filter((group) => group.reservations.length > 0);

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <div className={styles.header}>
          <div>
            <Title order={2}> Richieste di prenotazione </Title>
            <Text>Richieste in attesa: {counts?.total}</Text>
          </div>
          <Space h={"xl"} />
          <div>
            <TextInput
              placeholder="Cerca per nome, cognome, codice fiscale, tipo visita o data..."
              size="md"
              leftSection={<SearchIcon size={20} />}
              className={styles.searchInput}
              variant="filled"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
            ></TextInput>
          </div>

          <Space h={"xl"} />
        </div>
        {filteredData.map((r, index) => (
          <div key={index}>
            <Divider
              labelPosition="left"
              label={
                <>
                  <CalendarRangeIcon style={{ marginRight: "0.5em" }} />
                  {new Date(r.date).toLocaleDateString("it-IT", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </>
              }
            ></Divider>
            <Space h={"lg"} />
            {r.reservations.map((reservation, index) => (
              <div key={index}>
                <ReservationRequestCard
                  reservation={reservation}
                  onAccept={mutation.mutate}
                  onDecline={mutation.mutate}
                  isLoading={isLoading}
                />
                <Space h={"lg"} />
              </div>
            ))}
            <Space h={"lg"} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReservationsRequests;
