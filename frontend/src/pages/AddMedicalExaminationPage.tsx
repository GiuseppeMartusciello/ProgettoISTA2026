import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ReservationsTable from "../components/ReservationTable";
import { useCallback } from "react";
import styles from "../styles/addMedicalExaminationPage.module.css";
import { Title } from "@mantine/core";
import BackButton from "../components/BackButton";

export default function AddMedicalExamination() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { patient } = useParams<{ patient: string }>();

  const navigate = useNavigate();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "12", 10);
  const search = searchParams.get("search") || "";

  const onSuccess = useCallback(() => {
    console.log(`Sto navigando a patients/${patient}`);
    navigate(`/patients/${patient}`);
  }, []);

  const handlePaginationChange = useCallback(
    ({ page: newPage, limit: newLimit }: { page: number; limit: number }) => {
      const urlParams: Record<string, string> = {
        page: newPage.toString(),
        limit: newLimit.toString(),
      };

      if (search) {
        urlParams.search = search;
      }

      setSearchParams(urlParams);
    },
    [search, setSearchParams]
  );

  console.log("Sono dentro ");

  if (!patient) return <div>Errore manca il patient Id</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <BackButton
          position="static"
          path={`/patients/${patient}`}
        ></BackButton>
        <Title className={styles.title} order={1}>
          Seleziona la prenotazione
        </Title>
      </div>

      <ReservationsTable
        patient={patient}
        search={search}
        page={page}
        limit={limit}
        onPaginationChange={handlePaginationChange}
        onSuccess={onSuccess}
      />
    </div>
  );
}
