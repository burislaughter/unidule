import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { IconContext } from "react-icons";
import { Authenticator } from "@aws-amplify/ui-react";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <Authenticator.Provider>
    <IconContext.Provider value={{ color: "#ccc", size: "44px" }}>
      <App />
    </IconContext.Provider>
  </Authenticator.Provider>
);
