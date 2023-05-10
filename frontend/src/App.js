import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { checkAuth } from './features/user';

import Home from './components/Homepage';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard'
// import ForestMask from './components/ForestMask'
import RequestMap from './components/RequestMap';
// import LandCover from './components/LandCover';
import UpdateProfile from './components/UpdateProfile';
import RequestBounds from './components/RequestBounds';

function App() {
  const dispatch = useDispatch();

	useEffect(() => {
		dispatch(checkAuth());
	}, [dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/" exact element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* <Route path="/forestmask" exact element={<ForestMask />} />
        <Route path="/landcover" exact element={<LandCover />} /> */}
        <Route path="/request" exact element={<RequestBounds />} />
        <Route path="/map" exact element={<RequestMap />} />
        <Route path="/update" exact element={<UpdateProfile />}/>
      </Routes>
    </Router>
  );
}

export default App;