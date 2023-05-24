import React, { 
  useEffect, 
  // useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import NavbarComponent from './includes/Navbar';
import Footer from './includes/Footer';

import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { homepage } from '../features/main'
import M from 'materialize-css/dist/js/materialize.min.js';

import './Homepage.css'


const Homepage = () => {

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(homepage());
  }, [dispatch]);

  useEffect(() => {
    let parallaxElems = document.querySelectorAll('.parallax');
    M.Parallax.init(parallaxElems);
    
  }, []);

  const products = useSelector((state) => state.main.products);
  const isAuthenticated = useSelector(state => state.user.isAuthenticated); // Get isAuthenticated from the Redux state

  const text1 = 'Texto 1 vai ser alguma explicação'
  return (
    <div className="home">
    <NavbarComponent />

    <div className="parallax-container">
      <div className="parallax">
        <img alt="img1" src="michele-purin-uWJo5rEhvo4-unsplash.jpg" />
      </div>
      <div className="center-align valign-wrapper parallax-text-container">
        <h1 className="white-text">Deep Forest</h1>
        <p className="professional-text">
          Unlock the Power of Deep Learning for Forestry
        </p>
        <a href="/request" className="waves-effect waves-light btn explore-button">
          Explore
        </a>
      </div>
    </div>

    <div className="section how-it-works-section">
      <div className='container'>
        <h2>How it works</h2>
        <p>{text1}</p>
      </div>
    </div>

    <div className="parallax-container">
      <div className="parallax">
        <img alt="img2" src="IMG_2694.JPG" />
      </div>
    </div>

    <Footer />
  </div>
  );
};

export default Homepage;
