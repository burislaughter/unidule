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
import Box from "@mui/material/Box";
import MyPage from "./MyPage/MyPage";
import LogoutCallback from "./LogoutCallback";
import { Typography } from "@mui/material";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import AuthButton from "./AuthButton";

const topPadding = "0";
function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AuthProvider {...oidcConfig}>
        {true && (
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
        )}

        {/* アプリメイン部分 */}
        <Box sx={{ paddingTop: topPadding }}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Main />} />

              <Route path="/auth" element={<Auth />} />

              <Route path="/mypage" element={<MyPage />} />

              <Route path="/admin" element={<Admin />} />
              <Route path="sp">
                <Route path="voice_button" element={<VoiceButton />} />
              </Route>
              <Route path="/callback" element={<AuthCallback />} />
              <Route path="/logoutcallback" element={<LogoutCallback />} />
            </Routes>
          </BrowserRouter>
        </Box>
      </AuthProvider>
    </Box>
  );
}

export default App;
