/** @jsxImportSource @emotion/react */
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Main from "./Main";
import Admin from "./Admin";
import VoiceButton from "./special/VoiceButton";
import { AuthProvider } from "react-oidc-context";
import { oidcConfig } from "./cognitoAuthConfig";
import AuthCallback from "./AuthCallback";
import RouteAuthGuard from "./RouteAuthGuard";
import Auth from "./Auth";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import AuthButton from "./AuthButton";

function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AuthProvider {...oidcConfig}>
        <AppBar position="fixed">
          <Toolbar sx={{ flexGrow: 1 }}>
            <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            {/* パディング兼 */}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}></Typography>
            <AuthButton />
          </Toolbar>
        </AppBar>

        {/* アプリメイン部分 */}
        <Box sx={{ paddingTop: "64px" }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Main />} />

              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="sp">
                <Route path="voice_button" element={<VoiceButton />} />
              </Route>
              <Route path="/callback" element={<AuthCallback />} />
            </Routes>
          </BrowserRouter>
        </Box>
      </AuthProvider>
    </Box>
  );
}

export default App;
