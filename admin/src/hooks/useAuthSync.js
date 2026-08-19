import { useEffect } from "react";
import { logout } from "../services/auth/auth.slice";
import { setUser } from "../services/auth/auth.slice";
import { AuthSync } from "../lib/AuthSync.js";
import { useDispatch } from "react-redux";

export const useAuthSync = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Listen for storage changes from other tabs
    const cleanup = AuthSync.onStorageChange((authState) => {
      if (authState) {
        // Another tab logged in, sync this tab
        dispatch(setUser({ user: authState.user, isAuthenticated: authState.isAuthenticated }));
      } else {
        // Another tab logged out, sync this tab
        dispatch(logout());
      }
    });

    return cleanup;
  }, []);
};
