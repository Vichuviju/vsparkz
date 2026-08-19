import { configureStore } from "@reduxjs/toolkit";
import userReducer from "@/services/auth/auth.slice";
import { baseApi } from "@/services/base/base.api";
import notificationReducer from "@/services/notification/notificationSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export default store;
