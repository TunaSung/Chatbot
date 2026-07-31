import "./App.css";
import { lazy, Suspense } from "react";
import { ToastContainer } from "react-toastify";
import { Spiral } from "ldrs/react";
import "ldrs/react/Spiral.css";
import { usePathname } from "./services/navigation";

const ChatPage = lazy(() => import("./pages/Chatpage/Chatpage"))
const Sign = lazy(() => import("./pages/Sign/Sign"))

function App() {
  const pathname = usePathname();
  const Page = pathname === "/chat" ? ChatPage : Sign;

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense
        fallback={
          <div className="h-screen flex justify-center items-center">
            <Spiral size="70" speed="0.95" color="black" />
          </div>
        }
      >
        <Page />
      </Suspense>
    </>
  );
}

export default App;
