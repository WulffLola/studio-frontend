import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import { extendTheme } from "@chakra-ui/react";
import { components } from "./components";
import { colors, fonts, semanticTokens, shadows, styles, textStyles } from "./foundations";

const theme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  fonts,
  colors,
  semanticTokens,
  shadows,
  textStyles,
  styles,
  components,
});

export default theme;
