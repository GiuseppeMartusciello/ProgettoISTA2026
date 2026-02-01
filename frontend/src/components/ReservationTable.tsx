import {
  MantineReactTable,
  MRT_ColumnDef,
  useMantineReactTable,
} from "mantine-react-table";
import { useCallback, useMemo, useState } from "react";
import { useReservationsTable } from "../hooks/use-reservations";
import { ReservationItem } from "../types/reservation-item";
import { ActionIcon, Box, Loader, Text, Group, Tooltip } from "@mantine/core";
import { format } from "date-fns";
import { CirclePlus } from "lucide-react";
import { useDisclosure } from "@mantine/hooks";

import AddVisitModal from "./AddMedicalExaminationModal";

type ReservationsTableProps = {
  patient: string;
  search: string;
  page: number;
  limit: number;
  onSuccess: () => void;
  onPaginationChange: (params: { page: number; limit: number }) => void;
};

export default function ReservationsTable({
  patient,
  search,
  page,
  limit,
  onSuccess,
  onPaginationChange,
}: ReservationsTableProps) {
  // Prenotazione selezionata
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | undefined
  >(undefined);

  // Gestione chiusura/apertura Modal per visita
  const [opened, handler] = useDisclosure(false);

  // Get delle prenotazioni
  const { data, isLoading } = useReservationsTable(
    patient,
    page,
    limit,
    search
  );

  const pagination = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize: limit,
    }),
    [page, limit, search]
  );

  // Gestione chiusra Modal
  const handleModalClose = useCallback(() => {
    handler.close();
  }, [handler]);

  const handlePaginationChange = useCallback(
    (pageFn: any) => {
      const _pagination =
        typeof pageFn === "function" ? pageFn(pagination) : pageFn;

      onPaginationChange({
        page: _pagination.pageIndex + 1,
        limit: _pagination.pageSize,
      });
    },
    [pagination, onPaginationChange]
  );

  const columns = useMemo<MRT_ColumnDef<ReservationItem>[]>(
    () => [
      {
        header: "Giorno",
        accessorFn: (row) => row.startTime,
        id: "day",
        Cell: ({ cell }) => (
          <Text>{format(new Date(cell.getValue<string>()), "dd/MM/yyyy")}</Text>
        ),
      },

      {
        header: "Inizio",
        accessorKey: "startTime",
        Cell: ({ cell }) => (
          <Text>{format(new Date(cell.getValue<string>()), "HH:mm")}</Text>
        ),
      },
      {
        header: "Fine ",
        accessorKey: "endTime",
        Cell: ({ cell }) => (
          <Text>{format(new Date(cell.getValue<string>()), "HH:mm")}</Text>
        ),
      },

      {
        header: "Tipo di visita",
        accessorKey: "visitType",
        Cell: ({ cell }) => {
          const visitType = cell.getValue<string>();
          return (
            <Text>
              {visitType === "FIRST_VISIT" ? "Prima visita" : "Controllo"}
            </Text>
          );
        },
      },
    ],
    []
  );

  console.log("Data reservations: ", data);

  const table = useMantineReactTable({
    data: data?.reservations ?? [],

    columns,
    enableRowActions: true,
    enableTopToolbar: false,
    enablePagination: true,
    manualPagination: true,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    positionPagination: "bottom",
    paginationDisplayMode: "pages",
    rowCount: data?.total ?? 0,

    mantinePaginationProps: {
      showRowsPerPage: false,
    },

    state: { pagination },
    onPaginationChange: handlePaginationChange,
    renderRowActions: ({ row }) => (
      <Box
        onClick={() => {
          setSelectedReservationId(row.original.id);
          handler.open();
        }}
      >
        <Tooltip label="Aggiungi report visita" withArrow>
          <ActionIcon
            variant="subtle"
            color="var(--accent-primary)"
            radius="xl"
            size="lg"
          >
            <CirclePlus size={22} />
          </ActionIcon>
        </Tooltip>
      </Box>
    ),
  });

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
        <Loader size="sm" />
      </div>
    );

  if (!data || data.reservations.length === 0) {
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
            Nessuna prenotazione registrata nel sistema
          </Text>
          <Loader size="sm" />
        </Group>
      </div>
    );
  }

  return (
    <Box>
      <MantineReactTable table={table} />
      <AddVisitModal
        onClose={handleModalClose}
        opened={opened}
        onSuccess={onSuccess}
        reservationId={selectedReservationId}
      />
    </Box>
  );
}
