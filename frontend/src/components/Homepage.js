import React, { 
  useEffect,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './includes/Navbar';
import Footer from './includes/Footer';

import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { homepage } from '../features/main'


const Homepage = () => {

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(homepage());
  }, [dispatch]);

  const products = useSelector((state) => state.main.products);
  const loading = useSelector((state) => state.main.loading);
  const error = useSelector((state) => state.main.error);

  const isAuthenticated = useSelector(state => state.user.isAuthenticated); // Get isAuthenticated from the Redux state
  // console.log(isAuthenticated)

  const settings = {
    autoplay: true,
    autoplaySpeed: 3000,
    adaptativeHeight:true,
    centerMode:true,
    centerPadding:'100px',
    dots: true,
    fade:true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  return (
  <>
    <Navbar />
    <div className="container">
      <h1 className="center-align">Products</h1>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>{error}</p>
      ) : isAuthenticated ? (
        <Slider {...settings}>
          {products.map((product) => (
            <div key={product.id}>
              <a href={product.url}>
                <img src={product.image} alt={product.name} />
              </a>
            </div>
          ))}
        </Slider>
      ) : (
        <p>Please log in to view products</p>
      )}
    </div>
    <Footer />
  </>
  );
};

export default Homepage;