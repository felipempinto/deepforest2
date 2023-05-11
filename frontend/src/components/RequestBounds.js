
import 'materialize-css/dist/css/materialize.min.css';
import './RequestBounds.css';
import "react-datepicker/dist/react-datepicker.css";

import React, { useEffect,useRef,useState } from 'react';
import {useDispatch, useSelector } from 'react-redux';
import { MapContainer, TileLayer, ZoomControl,LayersControl,GeoJSON} from 'react-leaflet';
import NavbarContainer from './includes/Navbar'
import { models } from '../features/products';
import M from 'materialize-css/dist/js/materialize.min.js';

var parse = require('wellknown');
function RequestBounds() {
    const dispatch = useDispatch();
    const [selectedProduct, setSelectedProduct] = useState("");
    const [selectedVersion, setSelectedVersion] = useState("");

    const selectProductRef = useRef(null);
    const selectVersionRef = useRef(null);
    const mapRef = useRef(null);

    const handleProductSelect = (event) => {
      const selectedProduct = event.target.value;
      setSelectedProduct(selectedProduct);
      setSelectedVersion("");
      //console.log("Selected Product:", selectedProduct)
    };
    
    useEffect(() => {
      dispatch(models());
    }, [dispatch]);

    useEffect(()=>{
      M.FormSelect.init(selectProductRef.current, {});
      // M.FormSelect.init(selectVersionRef.current, {});
    })
  
    const products = useSelector((state) => state.product.models);
    const filteredVersions = products.filter(
      (product) => product.product === selectedProduct
      );
   // console.log(products[0],selectedProduct)
    //console.log("Filtered Versions:", filteredVersions);
  
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

  const selectVersion = (
    <div className="input-field col s12">
      <select
        value={selectedVersion}
        onChange={(event) => setSelectedVersion(event.target.value)}
        ref={selectVersionRef}
      >
        <option value="" disabled>Choose the version</option>
        {filteredVersions.map((product) => (
          <option key={product.id} value={product.version}>{product.version}</option>
        ))}
      </select>
    </div>
  );
  useEffect(() => {
    M.FormSelect.init(selectVersionRef.current, {});
  }, [filteredVersions]);

  const filteredProduct = filteredVersions.find((product) => product.version === selectedVersion);

  const wktPolygon = filteredProduct?.poly; // Get the WKT polygon from the filtered product
  const geojsonPolygon = wktPolygon ? parse(wktPolygon) : null; // Convert the WKT polygon to GeoJSON

  useEffect(() => {
    if (geojsonPolygon && mapRef.current) {
      const bounds = GeoJSON(geojsonPolygon).getBounds(); // Get the bounds of the GeoJSON object
      mapRef.current.fitBounds(bounds); // Fit the map to the bounds
    }
  }, [geojsonPolygon]);


  const map = 
  <>
  <h3 className='center'>Locations used for training:</h3>
  <MapContainer  ref={mapRef} className='map-container map-container-request' center={[51.505, -0.09]} zoom={5} zoomControl={false} maxZoom={20} minZoom={2}>
        <LayersControl position="bottomright">
        {tileLayers.map((layer, index) => (
          <LayersControl.BaseLayer checked name={layer.name} key={index}>
            <TileLayer url={layer.url} key={index}/>
          </LayersControl.BaseLayer>
        ))}
      </LayersControl>
      {geojsonPolygon && (
    <GeoJSON data={geojsonPolygon} />
  )}
      
      <ZoomControl position="bottomright"/>
  </MapContainer> 
  </>


  return (
    <>
    <NavbarContainer/>
    <div className='container'>
      <h1 className='center'>Request new basemap</h1>

      <div class="input-field col s12">
        <select onChange={handleProductSelect}  ref={selectProductRef}>
          <option value="" disabled selected>Choose the product</option>

          {products.map(
            (product, i) => (
              <option value={product.product}>{product.product}</option>
          ))}
        </select>
      </div>

      {selectedProduct && (<>{selectVersion}</>)}
        
      {selectedVersion && (  
        map
      )}
    </div>
    </>
  );
}

export default RequestBounds;