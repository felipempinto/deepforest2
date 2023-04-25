import React,{ 
    useEffect 
} from 'react';
import { useDispatch,useSelector } from 'react-redux';
import Navbar from './includes/Navbar';

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

// function ForestMask() {
const ForestMask = () => {
    
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(imagelocations());
      }, [dispatch]);


    const data = useSelector(state => state.forestmask.products);
    const isAuthenticated = useSelector(state => state.user.isAuthenticated); 

    // if (!isAuthenticated && !loading && user === null)
    //   return <Navigate to='/login'/>;

    // console.log("AUTH -> FORESMASK");
    // console.log(isAuthenticated);
    if (!isAuthenticated) {
        return <Navigate to='/login'/>;
      }
      

    // {isAuthenticated ? authlinks : guestLinks}
  
    return (
    <>
      <Navbar/>
      <div className='container'>
        <h1>Forest Mask</h1>
        <h2>Locations used to train the model:</h2>
        <MapComponent data={data} />
      </div>
    </>
    );
  }
  
  export default ForestMask;