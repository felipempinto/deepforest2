import { configureStore } from '@reduxjs/toolkit';
import userReducer from './features/user';
import mainReducer from './features/main'
import forestmaskReducer from './features/forestmask'

export const store = configureStore({
	reducer: {
		user: userReducer,
		main: mainReducer,
		forestmask: forestmaskReducer,
	},
	devTools: process.env.NODE_ENV !== 'production',
});

