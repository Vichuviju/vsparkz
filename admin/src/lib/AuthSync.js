// Auth state synchronization across browser tabs
export const AUTH_STORAGE_KEY = "scs_auth_state";

export const AuthStorageState = {
  user: null,
  isAuthenticated: false,
  timestamp: 0,
}

export const AuthSync = {
  // Save auth state to localStorage
  saveAuthState: (user, isAuthenticated) => {
    const authState = {
      user,
      isAuthenticated,
      timestamp: Date.now(),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  },

  // Get auth state from localStorage
  getAuthState: () => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return null;

      const authState = JSON.parse(stored);

      // Check if state is not too old (24 hours)
      const isExpired = Date.now() - authState.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
      }

      return authState;
    } catch {
      return null;
    }
  },

  // Clear auth state from localStorage
  clearAuthState: () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  // Listen for storage changes (tab synchronization)
  onStorageChange: (callback) => {
    const handleStorageChange = (e) => {
      if (e.key === AUTH_STORAGE_KEY) {
        // Offload work to avoid blocking the storage event handler
        setTimeout(() => {
          try {
            if (e.newValue) {
              const authState = JSON.parse(e.newValue);
              callback(authState);
            } else {
              callback(null);
            }
          } catch (error) {
            console.error("AuthSync: Sync error", error);
          }
        }, 0);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Return cleanup function
    return () => window.removeEventListener("storage", handleStorageChange);
  },
};
