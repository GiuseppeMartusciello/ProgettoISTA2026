import { addDays, format } from "date-fns";
import { useMedicalDetection } from "../hooks/use-medical-detection";
import { MedicalDetectionType } from "../types/medical-detection-type";
import { useCallback, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Box, Space, Title } from "@mantine/core";
import styles from "../styles/medicalDetectionChart.module.css";

interface Props {
  patientId: string;
  type: MedicalDetectionType;
  startDate?: string;
  endDate?: string;
}

type DetectionLabel = {
  label: string;
  unit: string;
  color: string;
};

export function MedicalDetection({
  patientId,
  type,
  startDate = new Date().toISOString(),
  endDate = addDays(new Date(), 7).toISOString(),
}: Props) {
  const { data: detections, isLoading } = useMedicalDetection(
    patientId,
    type,
    startDate,
    endDate
  );

  const label = useCallback((type: MedicalDetectionType): DetectionLabel => {
    const labels: Record<MedicalDetectionType, DetectionLabel> = {
      HR: { label: "Battito cardiaco", unit: "bpm", color: "orange" },
      SPO2: { label: "SPO2", unit: "%", color: "red" },
      WEIGHT: { label: "Peso corporeo", unit: "kg", color: "green" },
      TEMPERATURE: { label: "Temperatura corporea", unit: "°C", color: "blue" },
      ALL: { label: "CIAOOO", unit: "", color: "black" },
    };

    return labels[type] ?? { label: "Sconosciuto", unit: "" };
  }, []);

  useEffect(() => {
    console.log(detections);
  }, [detections]);

  const chartData = useMemo(() => {
    if (!detections) return [];

    return detections.detections.map((detection) => ({
      date: format(new Date(detection.date), "dd/MM"),
      value: Number(detection.value),
      rawDate: detection.date,
    }));
  }, [detections]);

  if (
    !detections ||
    chartData.length === 0 ||
    detections.detections.length <= 0
  ) {
    {
      console.log("DIO CANE ");
    }
    return <div>Nessuna rilevazione</div>;
  }

  const {
    label: detectionLabel,
    unit: detectionUnit,
    color: detectionColor,
  } = label(detections.detections[0].type);

  console.log(`Rilevazioni ${detectionLabel}`, detections);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "white",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ margin: 0, fontWeight: "bold" }}>{`Data: ${label}`}</p>
          <p style={{ margin: 0, color: detectionColor }}>
            {`${detectionLabel}: ${payload[0].value} ${detectionUnit}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className={styles.container}>
        <Title order={4} mt="xl" mb="sm">
          {detectionLabel}
        </Title>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              label={{
                value: detectionUnit,
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={detectionColor}
              strokeWidth={2}
              dot={{ fill: detectionColor, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* <Space h={"lg"} /> */}
    </>
  );
}
