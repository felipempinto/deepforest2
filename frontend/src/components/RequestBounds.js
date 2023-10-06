
import 'materialize-css/dist/css/materialize.min.css';
import './RequestBounds.css';
import "react-datepicker/dist/react-datepicker.css";

import React, { useCallback, useEffect,useRef,useState } from 'react';
import {useDispatch, useSelector } from 'react-redux';
import { MapContainer,
         TileLayer, 
         ZoomControl,
         LayersControl,
         GeoJSON,
         useMap,
         FeatureGroup
        } from 'react-leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { EditControl } from 'react-leaflet-draw';
import NavbarContainer from './includes/Navbar'
import { useNavigate } from 'react-router-dom';
import { models } from '../features/products';
import M from 'materialize-css/dist/js/materialize.min.js';
import L from 'leaflet';
import {request} from '../features/products'
import { 
  Navigate,
  // Link
} from 'react-router-dom';
import tileLayersData from './tileLayers.json';
var parse = require('wellknown');
// import { geojsondata } from '../features/products';
// var parse = require('wellknown');

const tileLayers = tileLayersData.map((layer) => ({
  key: layer.key,
  name: layer.name,
  url: layer.url,
}));

const Map = ({ filteredProduct }) => {
  const [geojsonEnabled, setGeojsonEnabled] = useState(true);
  const wktPolygon = filteredProduct?.poly;
  const geojsonPolygon = wktPolygon ? parse(wktPolygon) : null;
  // const fileInputRef = useRef(null);
  const [polygon, setPolygon] = useState('');
  const [submitDisabled,setSubmitDisabled] = useState(false)
  const [geojsonData, ] = useState(null);
  const featureGroupRef = useRef(null);
  const dateRef = useRef(null);
  const navigate = useNavigate();
  
  const dispatch = useDispatch();

  useEffect(() => {
    M.Datepicker.init(dateRef.current, {
      format: 'yyyy-mm-dd',
      container:document.body,
      autoClose: true,
      setDefaultDate: true,
      maxDate: new Date(),
      minDate: new Date(1900, 0, 1),
    });
    // const label = document.querySelector('label[for="date-picker"]');
    // M.Tooltip.init(label, { tooltip: 'We will select the closest ones if there is no image in the date selected' });
    const tooltips = document.querySelectorAll('.tooltipped');
    M.Tooltip.init(tooltips);
  // }, []);
  })

  const fitBounds = useCallback((map) => {
    if (geojsonPolygon && map) {
      const bounds = L.geoJSON(geojsonPolygon).getBounds();
      map.fitBounds(bounds);
    }
  },[geojsonPolygon]);

  const handleToggleGeojson = () => {
    setGeojsonEnabled((prevEnabled) => !prevEnabled);
  };

  const user = useSelector((state) => state.user.user); 

  const handleRequest = useCallback(() => {
    setSubmitDisabled(true);
    
    const pth = filteredProduct.id;
    const bounds = polygon;
    const date = dateRef.current.value;
    const userId = user.id;
    // console.log("AAAAA");
    // console.log(pth,bounds,date,userId);
    if (!pth || !bounds || !date || !userId) {
      console.log(pth,bounds,date,userId);
      // Show alert indicating missing information
      alert('Please complete all fields');
      setSubmitDisabled(false)
      return;
    }


    dispatch(request({pth,bounds,date,userId}))
    navigate('/requests');
  }, [dispatch, filteredProduct.id, polygon, dateRef, user.id,navigate]);
  // }, [dispatch]);
// }, [dispatch, filteredProduct.id, polygon, dateRef.current.value, user.id]);

  const onPolygonCreated = (e) => {
    const { layer } = e;
    // layer.addTo(featureGroupRef.current);
    const wktPolygon = layer.toGeoJSON().geometry;
    const wktString = parse.stringify(wktPolygon);
    // console.log(wktString);

    setPolygon(wktString);
    // console.log(polygon);
  };

  useEffect(() => {
    fitBounds();
  }, [fitBounds]);

  const MapComponent = () => {
    const map = useMap();
    fitBounds(map); 
    if (geojsonData) {
      L.geoJSON(geojsonData).addTo(map);
    }
    return null; 
  };

  const textLocation = 'You can draw a polygon by selecting the polygon icon in the top right corner of the map'
  const textLocationTrain = 'Locations used during the training phase'
  return (
    <div>
      <div>
        <label htmlFor="date-picker" data-tooltip="We will select the closest ones if there is no image in the date selected" >Select the date:</label>
        <input ref={dateRef} type="text" id="date-picker" className="datepicker"/>
      </div>
      <div className='section'>
      <h3 className="center">Select a location <i className='material-icons tooltipped' data-position="bottom" data-tooltip={textLocation}>help</i></h3>
      <button className='btn tooltipped' data-position="top" data-tooltip={textLocationTrain} onClick={handleToggleGeojson}>
        {geojsonEnabled ? 'Disable locations' : 'Enable locations'}
      </button>
      </div>
      <MapContainer
        className="map-container map-container-request"
        center={[51.505, -0.09]}
        zoom={5}
        zoomControl={false}
        maxZoom={20}
        minZoom={2}
      >
        <LayersControl position="bottomright">
          {tileLayers.map((layer) => (
            <LayersControl.BaseLayer checked name={layer.name} key={layer.key}>
              <TileLayer url={layer.url} />
            </LayersControl.BaseLayer>
          ))}
        </LayersControl>
        {geojsonPolygon && geojsonEnabled && (
        <GeoJSON data={geojsonPolygon} style={{ color: 'red' }} />
      )}
        <ZoomControl position="bottomright" />
        <MapComponent /> 
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            draw={{
              rectangle: false,
              circle: false,
              marker: false,
              polyline: false,
              circlemarker: false,
            }}
            featureGroup={featureGroupRef.current}
            onCreated={onPolygonCreated}
          />
        </FeatureGroup>
      </MapContainer>
      <div className='center section'>
        <button className='btn' onClick={handleRequest} disabled={submitDisabled}>
          {submitDisabled ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};


function RequestBounds() {
    const dispatch = useDispatch();
    const { isAuthenticated, user, loading } = useSelector(state => state.user);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [selectedVersion, setSelectedVersion] = useState("");

    const selectProductRef = useRef(null);
    const selectVersionRef = useRef(null);

    const handleProductSelect = (event) => {
      const selectedProduct = event.target.value;
      setSelectedProduct(selectedProduct);
      setSelectedVersion("");
    };
    
    useEffect(() => {
      dispatch(models());
    }, [dispatch]);

    useEffect(()=>{
      M.FormSelect.init(selectProductRef.current, {});
    })
  
    const products = useSelector((state) => state.product.models);
    const filteredVersions = products.filter(
      (product) => product.product === selectedProduct
      );

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

  const uniqueProducts = [...new Set(products.map(product => product.product))];  
  const filteredProduct = filteredVersions.find((product) => product.version === selectedVersion);
  useEffect(() => {
    M.FormSelect.init(selectVersionRef.current, {});
  }, [filteredVersions]);

  // TODO
  // create the way to check if user is authenticated

  // console.log(isAuthenticated,loading,user)
  if (!isAuthenticated && !loading && user === null)
      return <Navigate to='/login'/>;
  return (
    <>
    <NavbarContainer/>
    <div className='container'>
      <h1 className='center'>Request new basemap</h1>

      <div className="input-field col s12">
        <select defaultValue={""} onChange={handleProductSelect}  ref={selectProductRef}>
          <option value="" disabled>Choose the product</option>
          {
            uniqueProducts.map((product, i) => (
              <option key={i} value={product}>{product}</option>
            ))
          }
        </select>
      </div>

      {selectedProduct && (<>{selectVersion}</>)}
        
      {
        selectedVersion && 
        <Map key={filteredProduct?.id} filteredProduct={filteredProduct} />
      }
    </div>
    </>
  );
}

export default RequestBounds;