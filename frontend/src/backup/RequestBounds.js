
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
import axios from 'axios';
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


const getFootprints = async (date1, date2, bbox) => {
  const url = `${process.env.REACT_APP_API_URL}/api/products/get_data`;
  const formData = new FormData();
  formData.append('date1', date1);
  formData.append('date2', date2);
  formData.append('bbox', bbox);

  try {
      const response = await axios.post(
        url, 
        formData,{
          headers:{
            'Content-Type': 'multipart/form-data',

          }
        }
      );

      if (response.status === 200) {
          console.log('Data fetched successfully:', response.data);
          return response.data;
      } else if (response.status === 204) {
          console.warn('No images found for the provided period.');
      } else {
          console.error('Error fetching data:', response.status, response.statusText);
      }
  } catch (error) {
      console.error('Error making request:', error);
  }
};



// const handleRequest = ({bounds,date1,date2,setSubmitDisabled}) => {
//   // setSubmitDisabled(true); //TODO: uncomment after testing
//   // const pth = filteredProduct.id;
//   // const bounds = polygon;
//   // const date1 = dateRef1.current.value;
//   // const date2 = dateRef2.current.value;
//   // const userId = user.id;
//   // if (!pth || !bounds || !date1 || !date2 || !userId) {
//   if (!bounds || !date1 || !date2) {
//     console.log(bounds,date1,date2);
//     alert('Please complete all fields');
//     // setSubmitDisabled(false)//TODO: uncomment after testing
//     return;
//   }
//   var response = getFootprints(date1,date2,bounds)
//   return response
//   // console.log(pth,bounds,date1,date2,userId);
//   // dispatch(request({pth,bounds,date,userId}))
//   // navigate('/requests');
// }





const MiniMap = ({
  filteredProduct,
  // polygon,
  setPolygon,
  // featureGroupRef,
  // geojsonPolygon,
  // geojsonEnabled,
  // tileLayers,
  // // onPolygonCreated,
  // geojsonData,
  
})=>{
  const [geojsonEnabled, setGeojsonEnabled] = useState(true);
  const wktPolygon = filteredProduct?.poly;
  const geojsonPolygon = wktPolygon ? parse(wktPolygon) : null;
  // const fileInputRef = useRef(null);
  // const [polygon, setPolygon] = useState('');
  const [geojsonData, ] = useState(null);
  const featureGroupRef = useRef(null);

  // const [polygon, setPolygon] = useState('');


  const handleToggleGeojson = () => {
    setGeojsonEnabled((prevEnabled) => !prevEnabled);
  };


  const onPolygonCreated = (e) => {
    const { layer } = e;

    if (featureGroupRef.current && featureGroupRef.current.getLayers().length > 1) {
      M.toast({
        html: 'Only single geometries are allowed.',
        classes: 'red rounded',
        displayLength: 5000
      });
  
      if (featureGroupRef.current) {
        featureGroupRef.current.removeLayer(layer);
      }
  
      return; 
    }


    const areaMetersSquared = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]); // Calculate area in square meters
    const areaKilometersSquared = areaMetersSquared / 1000000; // Convert to square kilometers
    
    const maxArea = 110 * 110; // Maximum area in square kilometers
    if (areaKilometersSquared > maxArea) {
      const maxsize = `${110}x${110}`; // Max size string
      const areasqkm = areaKilometersSquared.toFixed(2); // Rounded to 2 decimal places
      M.toast({
        html: `Area is larger than the maximum ${maxsize}, area requested: ${areasqkm} km²`,
        classes: 'red rounded',
        displayLength: 5000
      });

      if (featureGroupRef.current) {
          featureGroupRef.current.clearLayers();
        }
  
      return; // Stop execution
    }

    const wktPolygon = layer.toGeoJSON().geometry;
    const wktString = parse.stringify(wktPolygon);
    setPolygon(wktString);
  };



  const fitBounds = useCallback((map) => {
    if (geojsonPolygon && map) {
      const bounds = L.geoJSON(geojsonPolygon).getBounds();
      map.fitBounds(bounds);
    }
  },[geojsonPolygon]);

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


  const textLocationTrain = 'Locations used during the training phase'

  return (
    <>
    <button 
        className='btn tooltipped' 
        data-position="top" 
        data-tooltip={textLocationTrain} 
        onClick={handleToggleGeojson}
      >
    {geojsonEnabled ? 'Disable locations' : 'Enable locations'}
  </button>

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
  </>
  )
}



const Map = ({ filteredProduct }) => {
  // const [geojsonEnabled, setGeojsonEnabled] = useState(true);
  // const wktPolygon = filteredProduct?.poly;
  // const geojsonPolygon = wktPolygon ? parse(wktPolygon) : null;
  // // const fileInputRef = useRef(null);
  // // const [polygon, setPolygon] = useState('');
  // const [submitDisabled,setSubmitDisabled] = useState(false)
  // const [geojsonData, ] = useState(null);
  // const featureGroupRef = useRef(null);



  const dateRef1 = useRef(null);
  const dateRef2 = useRef(null);
  const [submitDisabled,setSubmitDisabled] = useState(false)
  const [polygon, setPolygon] = useState('');
  // const navigate = useNavigate();
  
  // const dispatch = useDispatch();

  // const user = useSelector((state) => state.user.user); 

  const handleSubmit = ()=>{

    
  }

  useEffect(() => {
    M.Datepicker.init(dateRef1.current, {
      format: 'yyyy-mm-dd',
      container:document.body,
      autoClose: true,
      setDefaultDate: true,
      maxDate: new Date(),
      minDate: new Date(1900, 0, 1),
    });

    M.Datepicker.init(dateRef2.current, {
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

  const handleGetData = useCallback(() => {
    // setSubmitDisabled(true); //TODO: uncomment after testing
    
    // const pth = filteredProduct.id;
    const bounds = polygon;
    const date1 = dateRef1.current.value;
    const date2 = dateRef2.current.value;
    // const userId = user.id;
    if (!bounds || !date1 || !date2) {
      console.log(bounds,date1,date2);
      alert('Please complete all fields');
      // setSubmitDisabled(false)//TODO: uncomment after testing
      return;
    }
    var response = getFootprints(date1,date2,bounds)
    console.log(response)
    // console.log(pth,bounds,date1,date2,userId);
    // dispatch(request({pth,bounds,date,userId}))
    // navigate('/requests');
  }, [
      // dispatch, 
      filteredProduct.id, 
      polygon, 
      dateRef1, 
      dateRef2, 
      // navigate
    ]);


  // const fitBounds = useCallback((map) => {
  //   if (geojsonPolygon && map) {
  //     const bounds = L.geoJSON(geojsonPolygon).getBounds();
  //     map.fitBounds(bounds);
  //   }
  // },[geojsonPolygon]);

  // const handleToggleGeojson = () => {
  //   setGeojsonEnabled((prevEnabled) => !prevEnabled);
  // };

  // const handleGetData = ()=>{}
    // var response = getFootprints(date1,date2,bounds)



  // const handleRequest = useCallback(() => {
  //   // setSubmitDisabled(true); //TODO: uncomment after testing
    
  //   const pth = filteredProduct.id;
  //   const bounds = polygon;
  //   const date1 = dateRef1.current.value;
  //   const date2 = dateRef2.current.value;
  //   const userId = user.id;
  //   if (!pth || !bounds || !date1 || !date2 || !userId) {
  //     console.log(pth,bounds,date1,date2,userId);
  //     alert('Please complete all fields');
  //     // setSubmitDisabled(false)//TODO: uncomment after testing
  //     return;
  //   }
  //   var response = getFootprints(date1,date2,bounds)
  //   console.log(response)
  //   // console.log(pth,bounds,date1,date2,userId);
  //   // dispatch(request({pth,bounds,date,userId}))
  //   // navigate('/requests');
  // }, [
  //     dispatch, 
  //     filteredProduct.id, 
  //     polygon, 
  //     dateRef1, 
  //     dateRef2, 
  //     user.id,navigate
  //   ]);
  // }, [dispatch]);

  // const onPolygonCreated = (e) => {
  //   const { layer } = e;

  //   if (featureGroupRef.current && featureGroupRef.current.getLayers().length > 1) {
  //     M.toast({
  //       html: 'Only single geometries are allowed.',
  //       classes: 'red rounded',
  //       displayLength: 5000
  //     });
  
  //     if (featureGroupRef.current) {
  //       featureGroupRef.current.removeLayer(layer);
  //     }
  
  //     return; 
  //   }


  //   const areaMetersSquared = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]); // Calculate area in square meters
  //   const areaKilometersSquared = areaMetersSquared / 1000000; // Convert to square kilometers
    
  //   const maxArea = 110 * 110; // Maximum area in square kilometers
  //   if (areaKilometersSquared > maxArea) {
  //     const maxsize = `${110}x${110}`; // Max size string
  //     const areasqkm = areaKilometersSquared.toFixed(2); // Rounded to 2 decimal places
  //     M.toast({
  //       html: `Area is larger than the maximum ${maxsize}, area requested: ${areasqkm} km²`,
  //       classes: 'red rounded',
  //       displayLength: 5000
  //     });

  //     if (featureGroupRef.current) {
  //         featureGroupRef.current.clearLayers();
  //       }
  
  //     return; // Stop execution
  //   }

  //   const wktPolygon = layer.toGeoJSON().geometry;
  //   const wktString = parse.stringify(wktPolygon);
  //   setPolygon(wktString);
  // };

  // useEffect(() => {
  //   fitBounds();
  // }, [fitBounds]);

  // const MapComponent = () => {
  //   const map = useMap();
  //   fitBounds(map); 
  //   if (geojsonData) {
  //     L.geoJSON(geojsonData).addTo(map);
  //   }
  //   return null; 
  // };

  const textLocation = 'You can draw a polygon by selecting the polygon icon in the top right corner of the map'
  return (
    <div>
      <div className='row'>
        <div className='col s6'>
          <label htmlFor="date-picker-1">Date1:</label>
          <input 
            ref={dateRef1} 
            type="text" 
            id="date-picker-1" 
            className="datepicker"/>
        </div>
        <div className='col s6'>
          <label htmlFor="date-picker-2">Date2:</label>
          <input 
            ref={dateRef2} 
            type="text" 
            id="date-picker-2" 
            className="datepicker"
            />
        </div>
      </div>
      <div className='section'>
      <h3 
        className="center">
            Select a location 
            <i className='material-icons tooltipped' 
               data-position="bottom"
               data-tooltip={textLocation}>help
            </i>
      </h3>
      {/* <button 
        className='btn tooltipped' 
        data-position="top" 
        data-tooltip={textLocationTrain} 
        onClick={handleToggleGeojson}
      >
        {geojsonEnabled ? 'Disable locations' : 'Enable locations'}
      </button> */}
      </div>
      <MiniMap
        setPolygon={setPolygon}
        filteredProduct={filteredProduct}
      />

      {/* // featureGroupRef={featureGroupRef}
      // geojsonPolygon={geojsonPolygon}
      // geojsonEnabled={geojsonEnabled}
      // tileLayers={tileLayers}
      // // onPolygonCreated={onPolygonCreated}
      // geojsonData={geojsonData} */}
      
      {/* <MapContainer
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
      </MapContainer> */}
      <div className='center section'>
        <button 
          className='btn' 
          onClick={handleGetData}//handleRequest} 
          disabled={submitDisabled}
        >
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
    const [footprints,setFootprints] = useState([])

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

    // console.log(filteredProduct)

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