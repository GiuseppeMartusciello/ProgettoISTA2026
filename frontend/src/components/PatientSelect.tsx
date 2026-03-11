import { useEffect, useMemo, useState } from "react";
import {
  Combobox,
  TextInput,
  ScrollArea,
  Loader,
  Group,
  Text,
} from "@mantine/core";
import { useCombobox } from "@mantine/core";
import { PatientItem } from "../types/patient.interface";
import { useInfinitePatients } from "../hooks/use-infinite-patients";
import { IconUser } from "@tabler/icons-react";


function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function PatientSelect({
  value,
  onChange,
}: {
  value: PatientItem | null;
  onChange: (p: PatientItem | null) => void;
}) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const [query, setQuery] = useState("");
  const search = useDebouncedValue(query, 300);

  const LIMIT = 20;

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePatients(LIMIT, search);

  const items: PatientItem[] = useMemo(() => {
    const pages = data?.pages ?? [];

    if (pages.length > 0 && pages[0] && "data" in pages[0]) {
      return pages.flatMap((p: any) => p.data);
    }

    return pages.flatMap((p: any) => p);
  }, [data]);

  const options = useMemo(
    () =>
      items.map((p) => (
        // p.id && p?.user?.cf && p?.user?.name && p?.user?.surname
        //   &&
           <Combobox.Option value={p.id} key={p.id} style={{ background: p?.id === value?.id ? "var(--bg-tertiary)" : "" }}>
              <Group gap="xs">
                <IconUser size={16} />
                <Text size="sm">
                  {p?.user?.name} {p?.user?.surname}
                </Text>
                <Text size="xs" c="dimmed">
                  {p?.user?.cf}
                </Text>
              </Group>
            </Combobox.Option>
      )),
    [items, value],
  );

  function onDropdownScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;

    if (nearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }

  return (
    <Combobox
      store={combobox}
      withinPortal={false}
      onOptionSubmit={(id) => {
        const selected = items.find((x) => x.id === id) ?? null;
        onChange(selected);
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <TextInput
          label="Patient"
          placeholder="Search patient..."
          value={value ? `${value?.user?.name} ${value?.user?.surname} - ${value?.user?.cf}` : query}
          onChange={(event) => {
            onChange(null);
            setQuery(event.currentTarget.value);
            combobox.openDropdown();
          }}
          onFocus={() => combobox.openDropdown()}
          rightSection={
            isLoading || isFetchingNextPage ? <Loader size="xs" /> : null
          }
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <ScrollArea.Autosize mah={240} onScrollCapture={onDropdownScroll}>
          <Combobox.Options>
            {isError && (
              <Combobox.Empty>
                Errore: {(error as Error)?.message ?? "Errore"}
              </Combobox.Empty>
            )}

            {!isError && !isLoading && options.length === 0 && (
              <Combobox.Empty>Nessun paziente</Combobox.Empty>
            )}

            {options}

            {isFetchingNextPage && (
              <Combobox.Empty>Caricamento…</Combobox.Empty>
            )}

            {!hasNextPage && options.length > 0 && (
              <Combobox.Empty>Fine lista</Combobox.Empty>
            )}
          </Combobox.Options>
        </ScrollArea.Autosize>
      </Combobox.Dropdown>
    </Combobox>
  );
}
