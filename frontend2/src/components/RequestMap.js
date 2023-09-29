import 'materialize-css/dist/css/materialize.min.css';
import M from 'materialize-css/dist/js/materialize.min.js';
import React, { useState,useEffect,useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
var parse = require('wellknown');


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
  console.log("REPEAT")

  useEffect(() => {
    M.Collapsible.init(collapsibleRef.current, {});

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
  }, []);

  const handleBackClick = ()=>{
    setFormSubmitted(false);
    dispatch(resetTiles())
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
    <div className='section'>
      <form onSubmit={handleFormSubmit}>
        <div className="container section">
          <h2>Search for free products:</h2>

          <label htmlFor="product-select">Select a product:</label>
          <select id="product-select" className="select-class" value={selectedProduct ? selectedProduct.id : ''} onChange={handleProductChange}>
            <option value="">-- Select a product --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <div className='date-section'>
          <div>
            <label htmlFor="start-date-picker">Start Date:</label>
            <input ref={startDateRef} type="text" className="datepicker my-datepicker" />
          </div>
          <div>
            <label htmlFor="end-date-picker">End Date:</label>
            <input ref={endDateRef} type="text" className="datepicker my-datepicker" />
          </div>
          </div>
        </div>
        <button 
            type="submit" 
            className="waves-effect waves-light btn align-center" 
            id="submit-button" 
            disabled={formSubmitted}>
              Submit
        </button>
      </form>
      {geojsons.length === 0 && formSubmitted && (
      <div className='center'>
        <p className='center' style={{ color: 'red' }}>
          No images found.
        </p>
        <button 
            className="waves-effect waves-light btn white" 
            onClick={() => setFormSubmitted(false)}>
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
              <i class="material-icons">download</i>
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

export default RequestMap;

