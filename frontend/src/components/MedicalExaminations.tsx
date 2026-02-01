import { Button, Loader } from "@mantine/core";
import { useMedicalExamination } from "../hooks/use-medical-examinations";
import styles from "../styles/medicalExaminations.module.css";

type MedicalExaminationProps = {
  patientId: string;
};

export default function MedicalExaminations({
  patientId,
}: MedicalExaminationProps) {
  console.log("Sono dentro medical examination");
  const {
    data,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    isLoading,
    error,
    status,
    fetchStatus,
  } = useMedicalExamination(patientId);

  console.log("Data: ", data);
  console.log("isLoading: ", isLoading); // ⭐ Log dello stato
  console.log("status: ", status); // ⭐ Log dello status
  console.log("fetchStatus: ", fetchStatus); // ⭐ Log del fetch status
  console.log("error: ", error); // ⭐ Log degli errori

  console.log("DATA: ", data);

  const allExaminations = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading || status === "pending") return <Loader />;

  if (error) {
    console.log("Showing error:", error.message);
    return <div> Errore: {error.message}</div>;
  }

  console.log("Rendering examinations:", allExaminations.length);

  console.log("Data", allExaminations);

  return (
    <>
      <div className={styles.container}>
        {allExaminations.map((examination) => (
          <div key={examination.id}>
            <p>ID: {examination.id}</p>
            {/* <p>DATE: {examination.date.toISOString()}</p> */}
            <p>NOTE: {examination.note}</p>
            <p>MOTIVATION: {examination.motivation}</p>
          </div>
        ))}

        {isFetchingNextPage && <div> Caricamento altre visite.. </div>}

        {!hasNextPage && allExaminations.length > 0 && (
          <div> Non ci sono altre visite mediche </div>
        )}

        {hasNextPage && <Button onClick={() => fetchNextPage()}></Button>}
      </div>
    </>
  );
}
