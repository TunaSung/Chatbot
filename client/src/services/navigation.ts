import { useSyncExternalStore } from "react";

const subscribe = (listener: () => void) => {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
};

const getPathname = () => window.location.pathname;

export function usePathname(): string {
  return useSyncExternalStore(subscribe, getPathname, () => "/");
}

export function navigate(path: string, options?: { replace?: boolean }) {
  if (options?.replace) {
    window.history.replaceState(null, "", path);
  } else {
    window.history.pushState(null, "", path);
  }
  window.dispatchEvent(new PopStateEvent("popstate"));
}
