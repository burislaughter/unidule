/** @jsxImportSource @emotion/react */
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Main from "./Main";
import Admin from "./Admin";
import MaruButton from "./special/MaruButton";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="sp">
          <Route path="maru_button" element={<MaruButton />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
