import 'materialize-css/dist/css/materialize.min.css';
import M from 'materialize-css/dist/js/materialize.min.js';
import React, { useState,useEffect,useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { visualization } from '../features/products.js';
import { useNavigate } from 'react-router-dom';
import MapComponent from './MapComponent.js'
import { 
    MapContainer, 
    TileLayer, 
    ZoomControl,
    GeoJSON,
    LayersControl,
    Popup 
} from 'react-leaflet';

import { homepage } from '../features/main'
import './RequestMap.css';
import "react-datepicker/dist/react-datepicker.css";
import { tiles,resetTiles } from '../features/main'
import tileLayersData from './tileLayers.json';
// var parse = require('wellknown');
var parse = require('wellknown');

export const parseGeoJSON = (data) => {
  return data.map(item => ({
    type: 'Feature',
    geometry: parse(item.geojson.split(';')[1]),
    properties: {
      id: item.id,
      name: item.name,
      attributes: item.attributes,
    },
  }));       
};



function SideNavComponent({ products, geojsons, geojsonColors, setGeojsonColors }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const collapsibleRef = useRef(null);
  const dispatch = useDispatch();

  const handleMouseOver = (id) => {
    const newColors = { ...geojsonColors };
    Object.keys(newColors).forEach(key => {
      if (newColors[key] === 'blue' && key !== id) {
        newColors[key] = 'red';
      }
    });
    newColors[id] = 'blue';
    setGeojsonColors(newColors);
  }
  const handleMouseOut = (id) => {
    const newColors = { ...geojsonColors };
    newColors[id] = 'red';
    setGeojsonColors(newColors);
  }

  const handleProductChange = (event) => {
    const productId = parseInt(event.target.value);
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product);
  };

  const initDatePickers = ()=>{
    M.Datepicker.init(startDateRef.current, {
      format: 'yyyy-mm-dd',
      container:document.body,
      autoClose: true, 
      setDefaultDate: true,
      maxDate: new Date(), 
      minDate: new Date(1900, 0, 1),
    });
  
    M.Datepicker.init(endDateRef.current, {
      format: 'yyyy-mm-dd',
      container:document.body,
      autoClose: true, 
      setDefaultDate: true,
      maxDate: new Date(), 
      minDate: new Date(1900, 0, 1),
    });
  }

  useEffect(() => {
    M.Collapsible.init(collapsibleRef.current, {});

    initDatePickers()
    
  }, []);

  const handleBackClick = ()=>{
    setFormSubmitted(false);
    startDateRef.current = null;
    endDateRef.current = null;
    initDatePickers();
    dispatch(resetTiles())
    console.log("AAAAAAAAAAAAAAAAAAAAAAAA")
  }

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (selectedProduct && geojsons.length>0) {
    setFormSubmitted(true);
    }

    if (!selectedProduct) {
      alert("You need to select the product first!")
    } else {

    const formData = {
        product: selectedProduct.name,
        date1: startDateRef.current.value,
        date2: endDateRef.current.value
    };

    dispatch(tiles(formData));
    setFormSubmitted(true);
  }
};

  function cvtDate(dateString) {
    const date = new Date(dateString);
    const formattedDate = `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString()}`;
    return formattedDate;
  }

  const tab1 = <>
  <div className=''>
    <form onSubmit={handleFormSubmit} className="form-container">
      <div className="">
        <h4 className="form-heading">Search for Free Products:</h4>

        <select
          id="product-select"
          className="select-class"
          value={selectedProduct ? selectedProduct.id : ''}
          onChange={handleProductChange}
        >
          <option value="">-- Select a product --</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        
        <div className='date-section'>
          <div className="date-input">
            <label htmlFor="start-date-picker">Start Date:</label>
            <input 
                   ref={startDateRef} 
                   type="text" 
                   className="datepicker my-datepicker" 
                   />
          </div>
          <div className="date-input">
            <label htmlFor="end-date-picker">End Date:</label>
            <input ref={endDateRef} type="text" className="datepicker my-datepicker" />
          </div>
        </div>
      </div>
      
      <button
        type="submit"
        className="submit-button"
        disabled={formSubmitted}
      >
        Submit
      </button>
    </form>

    {geojsons.length === 0 && formSubmitted && (
      <div className='center'>
        <p className='error-message'>
          No images found.
        </p>
        <button
          className="dismiss-button"
          onClick={() => setFormSubmitted(false)}
        >
          Dismiss
        </button>
      </div>
    )}
  </div>
</>

  var tab2 = <>
  <div className='container'>
  <h5 className="center-align">Products based on your search</h5>
  <button onClick={handleBackClick} className="waves-effect waves-light btn align-center">
    
    <i className="material-icons">arrow_back</i> Back to search
  </button>
    <ul className="collapsible expandable ul-collapsible" ref={collapsibleRef}>
      {geojsons.map((geojson,i) => (
        <li className='li-collapsible' key={geojson.id}>
          <div 
            className="collapsible-header" 
            onMouseOver={() => handleMouseOver(geojson.id)}
            onMouseOut={() => handleMouseOut(geojson.id)}>
              {cvtDate(geojson.date_image)}
          </div>
          <div className="collapsible-body">
            <p><strong>Name: </strong>{geojson.name}</p>
            <p><strong>Product: </strong>{geojson.product}</p>
            <p><strong>Last Modified: </strong>{cvtDate(geojson.last_modified)}</p>
            <p><strong>Size: </strong>{formatBytes(geojson.size)}</p>
            <a className='center-align' href={geojson.mask_url} download={`${geojson.name}.png`}>
              <i className="material-icons">download</i>
            </a>
          </div>
        </li>
      )
      )}
    </ul>
  </div>
  </>

return (
  <>
    {geojsons.length===0?tab1:tab2} 
  </>
  
);
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function RequestMap() {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(homepage());
    }, [dispatch]);

    const [geojsonColors, setGeojsonColors] = useState({});
    const [showSidebar, setShowSidebar] = useState(true);
    const navigate = useNavigate();

    const tiles = useSelector((state) => state.main.tiles);
    const products = useSelector((state) => state.main.products);

    const handleBackClick = () => {
        navigate('/');
            };

    const toggleSidebar = () => {
        setShowSidebar(!showSidebar);
    };

    const geojsons = tiles.map(tile => {
      const polyCoords = parse(tile.poly).coordinates[0][0].map(([lat,lng]) => [lat,lng]);

      const geojson = {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [polyCoords]
        },
        "properties": {
          "name": tile.name,
          "product": tile.product,
          "mask_url":tile.mask_url,
          "date_image": tile.date_image,
          "last_modified": tile.last_modified,
          "size": tile.size
        }
      }
      return geojson;
    });
    
    const tileLayers = tileLayersData.map((layer) => ({
      key: layer.key,
      name: layer.name,
      url: layer.url,
    }));

  return (
    <>
      <MapContainer className='map-container' center={[51.505, -0.09]} zoom={5} zoomControl={false} maxZoom={20} minZoom={2}>
        <LayersControl position="bottomright">
          {tileLayers.map((layer, index) => (
            <LayersControl.BaseLayer checked name={layer.name} key={index}>
              <TileLayer url={layer.url} key={index}/>
            </LayersControl.BaseLayer>
          ))}
        </LayersControl>
          
        {geojsons.map((geojson, i) => (
          <GeoJSON id={`geojson-${tiles[i].id}`} key={tiles[i].id} data={geojson} style={{ color: geojsonColors[tiles[i].id] }}>
            <Popup>
              <div className="popup-content">
                <table>
                  <tbody>
                    <tr>
                      <td>Name:</td>
                      <td>{geojson.properties.name}</td>
                    </tr>
                    <tr>
                      <td>Product:</td>
                      <td>{geojson.properties.product}</td>
                    </tr>
                    <tr>
                      <td>Date:</td>
                      <td>{geojson.properties.date_image}</td>
                    </tr>
                    <tr>
                      <td>Size:</td>
                      <td>{formatBytes(geojson.properties.size)}</td>
                    </tr>
                  </tbody>
                </table>
                {geojson.properties.mask_url &&
                  <a className="btn waves-effect waves-light my-btn-class" href={geojson.properties.mask_url} download>
                    Download
                  </a>}
              </div>
            </Popup>
          </GeoJSON>
        ))}
        <ZoomControl position="bottomright"/>
      </MapContainer> 
      <div className={`sidebar ${showSidebar ? 'active' : ''}`}>
        <SideNavComponent products={products} geojsons={tiles} geojsonColors={geojsonColors} setGeojsonColors={setGeojsonColors}/>
      </div>
      <button onClick={handleBackClick} className="waves-effect waves-light btn" id="back-button">Back</button>
      <button onClick={toggleSidebar} className="waves-effect waves-light btn" id="button-toggle-side-nav"><i className="material-icons">menu</i></button>
    </>
  );
}


const VisualizeMap = ()=>{
    const dispatch = useDispatch();
    const [data,setData] = useState([]);

    useEffect(() => {
        dispatch(visualization())
            .then(dataset => {
              
              const dataMap = {};
                dataset.payload.forEach(item => {
                    const { id, png, request: { bounds: geojsonBounds }, bounds: rasterBounds } = item;
                    if (!dataMap[id]) {
                        dataMap[id] = {};
                    }
                    const tileCoordinates = rasterBounds.split(',').map(Number);

                    const [xmin, ymin, xmax, ymax] = tileCoordinates;
                    const bounds = [[ymin, xmin], [ymax, xmax]];

                    dataMap[id] = {
                        id: id,
                        raster: png, 
                        rasterBounds: bounds,
                        rasterEnabled:true,
                        geojson: parse(geojsonBounds),
                        geojsonEnabled: true,
                    };
                });

                const dataArray = Object.values(dataMap);
                setData(dataArray);
            })
            .catch(error => {
                console.error('Error fetching visualization data:', error);
            });
    }, [dispatch]);



    return (
        <>
            <MapComponent
                data={data}
                setData={setData}
            />
        </>
    )
}

export default VisualizeMap;

