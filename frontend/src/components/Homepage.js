import React, {   
                useContext, 
                // useEffect 
              } from 'react';
// import M from 'materialize-css';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { ProductContext } from '../ProductContext';

const Homepage = () => {
  const [products] = useContext(ProductContext);

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
    <div className="container">
      <h1 className="center-align">Products</h1>
      <Slider {...settings}>
        {products.map((product) => (
          <div key={product.id}>
            <a href={product.url}>
              <img src={product.image} alt={product.name} />
            </a>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default Homepage;