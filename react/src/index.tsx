import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { IconContext } from "react-icons";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <IconContext.Provider value={{ color: "#ccc", size: "44px" }}>
    <App />
  </IconContext.Provider>
);
