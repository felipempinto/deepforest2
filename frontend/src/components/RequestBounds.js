import React, { useEffect} from 'react';
import {useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, ZoomControl,LayersControl} from 'react-leaflet';
import NavbarContainer from './includes/Navbar'
import { models } from '../features/products';

import 'materialize-css/dist/css/materialize.min.css';
import './RequestBounds.css';
import "react-datepicker/dist/react-datepicker.css";

function RequestBounds() {
    const dispatch = useDispatch();

    useEffect(() => {
      dispatch(models());
    }, [dispatch]);
  
    const products = useSelector((state) => state.product.models);
  
    useEffect(() => {
      if (products.length > 0) {
        console.log(products);
      } else {
        console.log(products);
      }
    }, [products]);

    const tileLayers = [
      {
        key:1,
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      },
      {
        key:2,
        name: 'Stamen Terrain',
        url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png',
      },
      {
        key:3,
        name:"World Imagery ArcGIS",
        url:"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      }
    ];

  return (
    <>
    <NavbarContainer/>
    <div className='container'>
      <h1 className='center'>Request new basemap</h1>
        
        <MapContainer 
            className='map-container' 
            center={[51.505, -0.09]} 
            zoom={5} 
            zoomControl={false} 
            maxZoom={20} 
            minZoom={2}
        >
              <LayersControl position="bottomright">
              {tileLayers.map((layer, index) => (
                <LayersControl.BaseLayer checked name={layer.name} key={index}>
                  <TileLayer url={layer.url} key={index}/>
                </LayersControl.BaseLayer>
              ))}
            </LayersControl>
            
            
            <ZoomControl position="bottomright"/>
        </MapContainer> 
    </div>
    </>
  );
}

export default RequestBounds;