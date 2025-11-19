import { useMemo, useState } from "react";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { Variants, Transition } from "framer-motion";

type AuthView = "signin" | "signup";

function Sign() {
  const [authView, setAuthView] = useState<AuthView>("signin");
  const prefersReducedMotion = useReducedMotion();

  const toggleAuthView = () =>
    setAuthView((v) => (v === "signin" ? "signup" : "signin"));

  const baseSpring: Transition = {
    type: "spring",
    stiffness: 320,
    damping: 28,
    mass: 0.9,
  };

  const variants: Variants = useMemo(
    () => ({
      start: { opacity: 0, y: -10 },
      enter: { opacity: 1, y: 0, transition: baseSpring },
      exit: { opacity: 0, y: 10, transition: { ...baseSpring, damping: 30 } },
    }),
    [baseSpring, prefersReducedMotion]
  );

  return (
    <div className="bg-sky-100/40 h-screen">
      <div className="container-mid h-full py-8 flex justify-center items-center">
        <main
          className="border border-slate-300 w-full max-w-md aspect-4/5 bg-white rounded-2xl p-8 shadow-md"
          aria-live="polite"
        >
          <AnimatePresence mode="wait" initial={false}>
            {authView === "signin" ? (
              <motion.div
                key="signin"
                className="w-full h-full grid grid-rows-[1fr_auto]"
                variants={variants}
                initial="start"
                animate="enter"
                exit="exit"
              >
                <SignIn toggleAuthView={toggleAuthView} />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                className="w-full h-full grid grid-rows-[1fr_auto]"
                variants={variants}
                initial="start"
                animate="enter"
                exit="exit"
              >
                <SignUp toggleAuthView={toggleAuthView} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default Sign;
