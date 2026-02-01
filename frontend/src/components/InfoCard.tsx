import { Group, Text, Paper } from "@mantine/core";
import { ReactNode } from "react";
import styles from "../styles/infoCard.module.css";

type InfoCardProps = {
  label: string;
  value: string | string[];
  icon: ReactNode;
};

const InfoCard = ({ label, value, icon }: InfoCardProps) => {
  return (
    <Paper radius="md" p="md" className={styles.paper}>
      <Group align="center">
        <Text className={styles.label}>{label}</Text>
        {icon}
      </Group>
      {Array.isArray(value) ? (
        <ul className={styles.list}>
          {value.map((item, index) => (
            <li key={index} className={styles.value}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <Text className={styles.value}>{value}</Text>
      )}{" "}
    </Paper>
  );
};

export default InfoCard;
