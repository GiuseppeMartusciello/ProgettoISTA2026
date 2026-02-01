import { MantineProvider, createTheme } from "@mantine/core";
import { useColorScheme } from "@mantine/hooks";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface ThemeContextType {
  colorScheme: string;
  toggleScheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const preferredColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<"light" | "dark">(
    preferredColorScheme
  );

  useEffect(() => {
    console.log("ColorScheme: ", colorScheme);
  }, [colorScheme]);

  const toggleScheme = useCallback(() => {
    setColorScheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const theme = createTheme({
    fontFamily: "Inter, sans-serif",
  });
  return (
    <ThemeContext.Provider
      value={{
        colorScheme: colorScheme,
        toggleScheme: toggleScheme,
      }}
    >
      <MantineProvider
        theme={theme}
        defaultColorScheme={colorScheme}
        forceColorScheme={colorScheme}
        withCssVariables
      >
        {children}
      </MantineProvider>
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const themeContext = useContext(ThemeContext);
  if (!themeContext)
    throw new Error("useTheme must be used within a ThemeProvider");

  return themeContext;
}
