import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    list: [],
    unreadCount: 0,
  },
  reducers: {

    setNotifications: (state, action) => {
      state.list = action.payload?.data || [];
      state.unreadCount = state.list.filter(n => !n.isRead).length;
    },

    addNotification: (state, action) => {
      state.list.unshift({
        ...action.payload,
        isRead: false
      });
      state.unreadCount += 1;
    },

    markNotificationReadLocal: (state, action) => {
      const id = action.payload;

      const notification = state.list.find(n => n.id === id);

      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },

    clearUnread: (state) => {
      state.unreadCount = 0;
    }

  },
});

export const {
  setNotifications,
  addNotification,
  markNotificationReadLocal,
  clearUnread
} = notificationSlice.actions;


export default notificationSlice.reducer;
