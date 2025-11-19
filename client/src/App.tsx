import "./App.css";
import { lazy, useEffect, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { setAuthHeader, clearToken } from "./services/auth.service"; 
import { Spiral } from "ldrs/react";
import "ldrs/react/Spiral.css";

const ChatPage = lazy(() => import("./pages/Chatpage/Chatpage"))
const Sign = lazy(() => import("./pages/Sign/Sign"))

function App() {
  useEffect(() => {
    setAuthHeader();
  }, []);

  useEffect(() => {
    const EXPIRE_MS = 60 * 60 * 1000;
    const ts = Number(localStorage.getItem("tokenSaveAt"));
    const now = Date.now();

    if (!ts || now - ts > EXPIRE_MS) {
      clearToken();
    } else {
      const timeout = setTimeout(() => {
        clearToken();
      }, EXPIRE_MS - (now - ts));

      return () => clearTimeout(timeout);
    }
  }, []);
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense
        fallback={
          <div className="h-screen flex justify-center items-center">
            <Spiral size="70" speed="0.95" color="black" />
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Sign />} />
          <Route path="/chat" element={<ChatPage />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
