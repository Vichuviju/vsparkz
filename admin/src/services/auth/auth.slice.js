import { createSlice } from "@reduxjs/toolkit";
import { AuthSync } from "../../lib/AuthSync.js";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      // Set user data - if user is provided, use it; if null/undefined, clear it
      if (action.payload.user !== undefined) {
        state.user = action.payload.user;
      }
      // Set authentication status
      if (action.payload.isAuthenticated !== undefined) {
        state.isAuthenticated = action.payload.isAuthenticated;
      }
      // Save to localStorage if authenticated and user exists
      if (state.isAuthenticated && state.user) {
        AuthSync.saveAuthState(state.user, state.isAuthenticated);
      } else if (!state.isAuthenticated) {
        // Clear localStorage if not authenticated
        AuthSync.clearAuthState();
      }
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Update localStorage
        if (state.isAuthenticated) {
          AuthSync.saveAuthState(state.user, state.isAuthenticated);
        }
      }
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      // Clear localStorage
      AuthSync.clearAuthState();
      // Clear access token from localStorage
      localStorage.removeItem("access_token");
      localStorage.removeItem("rememberMe");
    },
    // Add more user-related reducers here as needed
  },
});

export const { setUser, updateUser, setLoading, logout } = userSlice.actions;
export default userSlice.reducer;

