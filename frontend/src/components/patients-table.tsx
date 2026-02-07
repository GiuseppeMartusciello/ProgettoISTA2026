import { usePatients } from "../hooks/use-patients";
import { PatientItem } from "../types/patient.interface";
import { ActionIcon, Box, Loader, Space } from "@mantine/core";
import { IconUser } from "@tabler/icons-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "@mantine/core/styles.css";

import {
  MantineReactTable,
  MRT_ColumnDef,
  useMantineReactTable,
} from "mantine-react-table";
import { useMemo } from "react";

export default function PatientsTable() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);
  const search = searchParams.get("search") || "";

  const pagination = useMemo(
    () => ({
      pageIndex: page - 1,
      pageSize: limit,
    }),
    [page, limit, search]
  );

  const { data, isLoading } = usePatients(page, limit, search);
  const navigate = useNavigate();

  console.log("Pagination:", pagination, "Search:", search);
  console.log("Data length:", data?.data?.length, "Total:", data?.total);

  const columns = useMemo<MRT_ColumnDef<PatientItem>[]>(
    () => [
      {
        header: "Codice Fiscale",
        accessorKey: "user.cf",
      },
      {
        header: "Nome",
        accessorKey: "user.name",
      },
      {
        header: "Cognome",
        accessorKey: "user.surname",
      },
      {
        header: "Email",
        accessorKey: "user.email",
      },
      {
        header: "Data di nascita",
        accessorKey: "user.birthDate",
      },
    ],
    []
  );

  console.log("Data:", data);

  const table = useMantineReactTable({
    data: data?.data ?? [],

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
    onPaginationChange: (pageFn) => {
      const _pagination =
        typeof pageFn === "function" ? pageFn(pagination) : pageFn;

      const urlParams: Record<string, string> = {
        page: (_pagination.pageIndex + 1).toString(),
        limit: _pagination.pageSize.toString(),
      };

      if (search) {
        urlParams.search = search;
      }

      setSearchParams(urlParams);
    },
    renderRowActions: ({ row }) => (
      <Box
        style={() => ({
          padding: "8px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            opacity: 0.85,
          },
        })}
        onClick={() => navigate(`/patients/${row.original.id}`)}
      >
        <ActionIcon
          variant="subtle"
          color="var(--accent-primary)"
          radius="xl"
          size="lg"
        >
          <IconUser size={22} />
        </ActionIcon>
        {/* <Text size="sm" c="blue.7" fw={500}>
          Visualizza profilo
        </Text> */}
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
        <Loader size="xl" />
      </div>
    );

  // if (!data || data.data.length === 0) {
  //   return (
  //     <div
  //       style={{
  //         display: "flex",
  //         justifyContent: "center",
  //         alignItems: "center",
  //         height: "100%",
  //       }}
  //     >
  //       <Group>
  //         <Text size="lg" fw={500}>
  //           Nessun paziente registrato nel sistema
  //         </Text>
  //         <Loader size="sm" />
  //       </Group>
  //     </div>
  //   );
  // }

  return (
    <Box>
      <MantineReactTable table={table} />
      <Space h={"lg"} />
    </Box>
  );
}
