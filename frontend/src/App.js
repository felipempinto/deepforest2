import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { checkAuth } from './features/user';

import Home from './components/Homepage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard'
import RequestMap from './components/RequestMap';
import RequestBounds from './components/RequestBounds';
import Requests from './components/Requests';

import { useCookies } from 'react-cookie';
import Products from './components/Products';
import VisualizeMap from './components/VisualizeData';

function App() {
  const [
    cookies, 
    // setCookie
  ] = useCookies(['access_token', 'refresh_token'])

  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(
      checkAuth(cookies.refresh_token)
      ).catch((error) => {
      if (error.message !== '400') {
        console.error('Error:', error);
      }
    });
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/" exact element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/request" exact element={<RequestBounds />} />
        <Route path="/map" exact element={<RequestMap />} />
        <Route path="/requests" exact element={<Requests />}/>
        <Route path="/products" exact element={<Products />}/>
        <Route path="/viewdata" exact element={<VisualizeMap />}/>
      </Routes>
    </Router>
  );
}

export default App;