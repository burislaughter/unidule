import { createTheme } from "@material-ui/core/styles";

// サイトのベースとなる独自のテーマを作成する
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", //サイト内で使える任意のprimary color
    },
    secondary: {
      main: "#dc004e", //サイト内で使える任意のsecondary color
    },
    background: {
      default: "#fffafa", // 背景色を設定出来る。何も設定しなければ白
    },
  },
  typography: {
    fontFamily: ["'M PLUS 1p'"].join(","),
    fontSize: 12,
    h1: {
      fontSize: "1.75rem",
    },
    h2: {
      fontSize: "1.5rem",
    },
    h3: {
      fontSize: "1.25rem",
    },
    h4: {
      fontSize: "1.125rem",
    },
    h5: {
      fontSize: "1rem",
    },
    h6: {
      fontSize: "1rem",
    },
  },
});

export default theme;
