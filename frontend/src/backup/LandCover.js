import React,{ 
    useEffect 
} from 'react';
import { useDispatch,useSelector } from 'react-redux';
import NavbarComponent from '../components/includes/Navbar';

import { Navigate } from 'react-router-dom';
import { imagelocations } from '../features/forestmask';
import { MapContainer, 
    TileLayer, 
    Polygon,
   } from 'react-leaflet';

var parse = require('wellknown');

function MapComponent({ data }) {
    
    const polygons = data.map(({ name, poly }) => {
        const coordinates = parse(poly).coordinates[0][0].map(([lng,lat]) => [lat,lng]);
        return <Polygon key={name} pathOptions={{ color: 'red' }} positions={coordinates} />;
      });

    return (
        <MapContainer center={[-27, -50]} zoom={6} style={{ height: '500px' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {polygons}
        </MapContainer>
      );
  }

const LandCover = () => {
    
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(imagelocations());
      }, [dispatch]);


    const data = useSelector(state => state.forestmask.products);
    const isAuthenticated = useSelector(state => state.user.isAuthenticated); 

    if (!isAuthenticated) {
        return <Navigate to='/login'/>;
      }
  
    return (
    <>
      <NavbarComponent/>
      <div className='container'>
        <h1>Land Cover</h1>
        <h2>Locations used to train the model:</h2>
        <MapComponent data={data} />
      </div>
    </>
    );
  }
  
  export default LandCover;