import React, { 
    useEffect, 
    // useRef,
  } from 'react';
  import { 
    useDispatch, 
    useSelector 
  } from 'react-redux';
  import NavbarComponent from './includes/Navbar';
  import Footer from './includes/Footer';
  import { homepage } from '../features/main'
  // import M from 'materialize-css/dist/js/materialize.min.js';
  import M from 'materialize-css';
  
  import './Homepage.css'
  
  const Homepage = () => {
  
    const dispatch = useDispatch();
    const products = useSelector((state) => state.main.products);
  
    useEffect(() => {
      dispatch(homepage());
    }, [dispatch]);
  
    useEffect(() => {
      let parallaxElems = document.querySelectorAll('.parallax');
      M.Parallax.init(parallaxElems);
  
    }, [
      // products
    ]);
  
    // const isAuthenticated = useSelector(state => state.user.isAuthenticated); // Get isAuthenticated from the Redux state
    // console.log(products)  
  
    const text1 = `This website has been developed with the primary objective of implementing deep 
    learning models specifically tailored for analyzing satellite images, with a particular focus 
    on forests. The website is currently undergoing various phases of development, and the version 
    you are currently accessing is 0.0.2. Kindly take note of this as you navigate through the site.
    `
  
    const versions = {
      'Version 0.0.1': `In this initial version, the website offers a single product known as the "Forest Mask." To utilize this product, users are required to input a satellite image captured by Sentinel 2, consisting of four bands (B, G, R, NIR). This version represents the simplest iteration of the website and does not necessitate the search for input images to execute the model. The website has been constructed entirely using Django, with the incorporation of Materialize CSS to enhance the aesthetics of the webpages.`,
      'Version 0.0.2': `With the introduction of version 0.0.2, a second product known as "Land Cover" has been added, which incorporates four distinct classes. Notably, users are now only required to specify the desired location from which they would like to retrieve the dataset. However, please be aware that due to the nascent stage of these products, there are certain limitations on processing large datasets.`,
      'Future versions':`In upcoming versions, the objective is to enable the processing of substantial datasets based on input vector files provided by clients. This will enhance the versatility and scalability of the website's capabilities.`,
      "Version 1.0.0":`The forthcoming official release, denoted as 1.0.0, will encompass comprehensive precision calculations for all products. Additionally, prices will be implemented to facilitate payments on the website, ensuring a seamless user experience.`
    };

    // const products = []
  
  
    return (
      <div className="home">
      <NavbarComponent />
  
      <div className="parallax-container">
        <div className="parallax">
          {/* <img alt="img1" src="michele-purin-uWJo5rEhvo4-unsplash.jpg" /> */}
          <img alt="img1" src={process.env.PUBLIC_URL+"/michele-purin-uWJo5rEhvo4-unsplash.jpg"}/>
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
          <div className="row">
              {Object.entries(versions).map(([key, value]) => (
                <div key={key} className={"col s12 m3"}>
                  <div className={`card ${key === 'Version 0.0.2' ? 'blue-grey darken-3 z-depth-5' : 'blue-grey darken-1'}`}>
                    <div className="card-content white-text" >
                      <span className="card-title">{key}</span>
                      <p>{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </div>
      </div>
  
      <div className="parallax-container">
        <div className="parallax">
          {/* <img alt="img2" src="IMG_2694.JPG" /> */}
          <img alt="img1" src={process.env.PUBLIC_URL+"/IMG_2694.JPG"}/>
        </div>
      </div>
  
      <div className='section container'>
        <h1 className='center'>Products:</h1>
        <div className="row">
        {products.map((product)=>{
          return(
          <div key={product.id} className="col s12 m6">
            <div className="card">
              <div className="card-image waves-effect waves-block waves-light">
                <a href='/products'>
                  <img alt='img3' className='img-card' src={product.image}   />  
                </a>
              </div>
              <div className="card-content">
                <span className="card-title activator grey-text text-darken-4">{product.name}<i className="material-icons right">more_horiz</i></span>
              </div>
              <div className="card-reveal">
                <span className="card-title grey-text text-darken-4">{product.name}<i className="material-icons right">close</i></span>
                <p>
                  {/* {product} */}
                  {product.description}
                </p>
              </div>
            </div>
                
        </div>
        )})}
      </div>
    </div>
      <Footer />
    </div>
    );
  };
  
  export default Homepage;
  