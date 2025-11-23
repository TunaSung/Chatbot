import "./App.css";
import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Spiral } from "ldrs/react";
import "ldrs/react/Spiral.css";

const ChatPage = lazy(() => import("./pages/Chatpage/Chatpage"))
const Sign = lazy(() => import("./pages/Sign/Sign"))

function App() {
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
