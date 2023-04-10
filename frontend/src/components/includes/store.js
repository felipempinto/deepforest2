import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isLoggedIn: false, // Default value is false
    // Other properties...
  },
  reducers: {
    // Other reducers...
  },
});

export const { /* Other reducers... */ } = authSlice.actions;

export default authSlice.reducer;