import {
  Button,
  // useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";

export default function Demo() {
  // -> colorScheme is 'auto' | 'light' | 'dark'
  const { colorScheme, setColorScheme } = useMantineColorScheme({
    keepTransitions: true,
  });

  // -> computedColorScheme is 'light' | 'dark', argument is the default value
  // const computedColorScheme = useComputedColorScheme("light");

  // Incorrect color scheme toggle implementation
  // If colorScheme is 'auto', then it is not possible to
  // change color scheme correctly in all cases:
  // 'auto' can mean both light and dark
  const toggleColorScheme = () => {
    setColorScheme(colorScheme === "dark" ? "light" : "dark");
  };

  return <Button onClick={() => toggleColorScheme()}>🌙</Button>;
}
