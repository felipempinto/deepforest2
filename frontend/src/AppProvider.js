import React from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ProductProvider } from './ProductContext';
// import { AuthProvider } from './contexts/AuthContext'; // Import the AuthProvider
import userReducer from './reducers/userReducer';
import AuthProvider from './contexts/AuthContext';
const store = configureStore({
  reducer: {
    user: userReducer
  }
});

const AppProvider = ({ children }) => {
  return (
    <Provider store={store}>
      <AuthProvider> 
        <ProductProvider>
        {/* Wrap the ProductProvider with AuthProvider */}
          {children}
        </ProductProvider>
      </AuthProvider>
    </Provider>
  );
};

export default AppProvider;