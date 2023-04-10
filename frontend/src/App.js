import './App.css';
import { BrowserRouter as Router, Routes , Route } from 'react-router-dom';
import Homepage from './components/Homepage'
import ForestMask from './components/ForestMask'
import Navbar from './components/includes/Navbar';
import Footer from './components/includes/Footer';
import Login from './components/Login';
// import M from 'materialize-css/dist/js/materialize.min.js';

function App() {
// document.addEventListener('DOMContentLoaded', function() {
//   M.AutoInit();
// });
  return (
    <Router>
      <Navbar />
      <div className="App">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/forestmask" element={<ForestMask />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
