/** @jsxImportSource @emotion/react */
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Main from "./Main";
import Admin from "./admin/Admin";
import VoiceButton from "./special/VoiceButton";
import Box from "@mui/material/Box";
import MyPage from "./myPage/MyPage";

import AuthButton from "./AuthButton";
import Login from "./Login";

function App() {
  return (
    <Box>
      {/* アプリメイン部分 */}
      <Box>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Main />} />

            <Route path="/login" element={<Login />} />

            <Route path="/mypage" element={<MyPage />} />

            <Route path="/admin" element={<Admin />} />
            <Route path="sp">
              <Route path="voice_button" element={<VoiceButton />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </Box>
      <Box sx={{ position: "fixed ", top: "6px", right: "10px" }}>
        <AuthButton />
      </Box>
    </Box>
  );
}

export default App;
