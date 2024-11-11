/** @jsxImportSource @emotion/react */
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Main from "./Main";
import Admin from "./Admin";
import VoiceButton from "./special/VoiceButton";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="sp">
          <Route path="voice_button" element={<VoiceButton />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
