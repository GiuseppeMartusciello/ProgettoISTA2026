import { ToolbarProps, View } from "react-big-calendar";
import { Button, Divider, Group, Menu, Text, Title } from "@mantine/core";
import { useSearchParams } from "react-router-dom";
import styles from "../styles/customToolbar.module.css";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

interface CustomToolbarProps<T extends object> extends ToolbarProps<T> {
  invalidate?: () => void;
  views: View[];
  toggleFilter?: {
    label: string;
    param: string;
    options: [string, string];
  };
}

export function CustomToolbar<T extends object>({
  label,
  onNavigate,
  view,
  onView,
  views,
  invalidate,
  toggleFilter,
}: CustomToolbarProps<T>) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentToggleValue = toggleFilter
    ? searchParams.get(toggleFilter.param) ?? toggleFilter.options[1]
    : undefined;

  const handleToggle = (nextValue: string) => {
    if (!toggleFilter) return;

    const updatedParams = new URLSearchParams(searchParams);
    updatedParams.set(toggleFilter.param, nextValue);
    setSearchParams(updatedParams);

    invalidate?.();
  };

  return (
    <div className={styles.container}>
      <Group>
        <Button className={styles.button} onClick={() => onNavigate("PREV")}>
          <ChevronLeft />
        </Button>
        <Button className={styles.button} onClick={() => onNavigate("TODAY")}>
          Oggi
        </Button>
        <Button className={styles.button} onClick={() => onNavigate("NEXT")}>
          <ChevronRight />
        </Button>
      </Group>

      <Title className={styles.label} order={3}>
        {label}
      </Title>

      <Group>
        {toggleFilter && (
          <>
            <Text> Mostra:</Text>
            <Menu>
              <Menu.Target>
                <Button
                  className={styles.filter}
                  leftSection={<Filter size={16} />}
                >
                  {currentToggleValue === "ALL" ? "Tutte" : "Solo confermate"}
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item onClick={() => handleToggle("ALL")}>Tutte</Menu.Item>
                <Menu.Item onClick={() => handleToggle("CONFIRMED")}>
                  Solo confermate
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Divider orientation="vertical" />
          </>
        )}
        {/* <Space /> <Space /> */}

        {views.map((v) => (
          <Button
            key={v}
            onClick={() => onView(v)}
            className={
              view === v ? `${styles.button} ${styles.active}` : styles.button
            }
          >
            {v === "week" ? "Settimana" : v === "day" ? "Giorno" : "Mese"}
          </Button>
        ))}
      </Group>
    </div>
  );
}
