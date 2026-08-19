import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAuth } from "../../context/AuthContext";
import { setUser } from "../../services/auth/auth.slice";

export function HRMSAuthSync({ children }) {
  const { user, isAuthenticated } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) {
      dispatch(
        setUser({
          user,
          isAuthenticated: true,
        })
      );
    }
  }, [user, dispatch]);

  return <>{children}</>;
}
