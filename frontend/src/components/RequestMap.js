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
import { tiles } from '../features/main'
var parse = require('wellknown');


function SideNavComponent({ products, geojsons, geojsonColors, setGeojsonColors }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const [activeTab, setActiveTab] = useState("tab1");

  useEffect(() => {
    const tabs = document.querySelector('.tabs');
    M.Tabs.init(tabs);
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  }

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

  const dispatch = useDispatch();

  const handleProductChange = (event) => {
    const productId = parseInt(event.target.value);
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product);
  };

  useEffect(() => {
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

  const handleFormSubmit = (event) => {
    event.preventDefault();

    if (!selectedProduct) {
      alert("You need to select the product first!")
    } else {

    const formData = {
        product: selectedProduct.name,
        date1: startDateRef.current.value,
        date2: endDateRef.current.value
    };

    dispatch(tiles(formData));

  }
};

  const tab1 = <>
    <div className='section'>
      <form onSubmit={handleFormSubmit}>
        <div className="container section">
          <h2>Search for free products:</h2>

          <label htmlFor="product-select">Select a product:</label>
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
        <button type="submit" className="waves-effect waves-light btn align-center" id="submit-button">
          Submit
        </button>
      </form>
    </div>
  </>

  var tab2 = <>
   <div className="collection">
   {geojsons.map((geojson, i) => (
        <a 
          key={i} 
          href={geojson.mask_url} 
          className="collection-item" 
          download
          onMouseOver={() => handleMouseOver(geojson.id)}
          onMouseOut={() => handleMouseOut(geojson.id)}
          >
          <span className="badge">
            <p>({formatBytes(geojson.size)})</p>
          </span>
          {geojson.date_image}
        </a>
            ))}
  </div>
  </>

return (
  <div className='container'>
    <div>
      <ul className="tabs">
        <li className={`tab col s6 ${activeTab === 'tab1' ? 'active' : ''}`}>
          <a href="#tab1" onClick={() => handleTabClick("tab1")}>Search</a>
        </li>
        <li className={`tab col s6 ${activeTab === 'tab2' ? 'active' : ''} ${geojsons.length===0?'disabled':''}`}>
          <a href="#tab2" onClick={() => handleTabClick("tab2")}>Dataset</a>
        </li>
      </ul>
    </div>
    <div id="tab1" className={`col s12 ${activeTab === 'tab1' ? 'active' : ''}`}>
      {tab1}
    </div>
    <div id="tab2" className={`col s12 ${activeTab === 'tab2' ? 'active' : ''}`}>
      {tab2}
    </div>
  </div>
);
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

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
        <MapContainer className='map-container' center={[51.505, -0.09]} zoom={5} zoomControl={false} maxZoom={20} minZoom={2}>
              <LayersControl position="bottomright">
              {tileLayers.map((layer, index) => (
                <LayersControl.BaseLayer checked name={layer.name} key={index}>
                  <TileLayer url={layer.url} key={index}/>
                </LayersControl.BaseLayer>
              ))}
            </LayersControl>
            
            {geojsons.map((geojson, i) => (
              // console.log(geojson)))
              <GeoJSON 
                  id={`geojson-${tiles[i].id}`}
                  key={tiles[i].id} 
                  data={geojson} 
                  style={{ color: geojsonColors[tiles[i].id] }}
              >
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
                    <a 
                      className="btn waves-effect waves-light my-btn-class" 
                      href={geojson.properties.mask_url} 
                      download
                    >
                      Download
                    </a>
                  }
                </div>
              </Popup>
              </GeoJSON>
            ))
            }
            <ZoomControl position="bottomright"/>
        </MapContainer> 

        <div className={`sidebar ${showSidebar ? 'active' : ''}`}>
        
            <SideNavComponent 
                products={products} 
                geojsons={tiles} 
                geojsonColors={geojsonColors} 
                setGeojsonColors={setGeojsonColors} 
                />
        </div>
        <button onClick={handleBackClick} className="waves-effect waves-light btn" id="back-button">Back</button>
        <button onClick={toggleSidebar} className="waves-effect waves-light btn" id="button-toggle-side-nav"><i className="material-icons">menu</i></button>
    </>
  );
}

export default RequestMap;

