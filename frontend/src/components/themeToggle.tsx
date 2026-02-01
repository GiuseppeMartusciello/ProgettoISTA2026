import { useTheme } from "../context/ThemeContext";
import { ActionIcon } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

interface ThemeToggleProps {
  absolute?: boolean;
}

export const ThemeToggle = ({ absolute = true }: ThemeToggleProps) => {
  const colorSchemeContext = useTheme();

  const dark = colorSchemeContext.colorScheme === "dark";

  const button = (
    <ActionIcon
      variant="transparent"
      onClick={() => colorSchemeContext.toggleScheme()}
      title="Toggle color scheme"
    >
      {dark ? (
        <IconSun
          style={{
            width: 18,
            height: 18,
          }}
        />
      ) : (
        <IconMoon style={{ width: 18, height: 18 }} />
      )}
    </ActionIcon>
  );

  return absolute ? (
    <div
      style={{
        position: "absolute",
        top: "1rem",
        right: "1rem",
        cursor: "pointer",
        zIndex: "1000",
      }}
    >
      {button}
    </div>
  ) : (
    <div> {button}</div>
  );
};
