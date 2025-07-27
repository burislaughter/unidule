/** @jsxImportSource @emotion/react */
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Main from "./Main";
import Admin from "./admin/Admin";
import VoiceButton from "./special/voiceButton/VoiceButton";
// import Roulette from "./special/roulette/Roulette";

import Box from "@mui/material/Box";
import MyPage from "./myPage/MyPage";

import AuthButton from "./AuthButton";
import Login from "./Login";
import ViewTest from "./viewTest/view";

import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

function App() {
  return (
    <Box>
      {/* アプリメイン部分 */}
      <Box>
        <DndProvider backend={HTML5Backend}>
          <BrowserRouter>
            <Routes>
              <Route path="/view" element={<ViewTest />} />

              <Route path="/" element={<Main />} />

              <Route path="/login" element={<Login />} />

              <Route path="/mypage" element={<MyPage />} />

              <Route path="/admin" element={<Admin />} />
              <Route path="sp">
                <Route path="voice_button" element={<VoiceButton />} />
                {/* <Route path="roulette" element={<Roulette />} /> */}
              </Route>
            </Routes>
          </BrowserRouter>
        </DndProvider>
      </Box>
      <Box sx={{ position: "fixed ", top: "6px", right: "10px" }}>
        <AuthButton />
      </Box>
    </Box>
  );
}

export default App;
