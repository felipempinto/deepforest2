import React, { useState, useEffect, useRef } from 'react';
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { 
  Box,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button, Typography } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Select from '@mui/material/Select';
import { homepage } from '../features/main'
import './RequestMap.css';
import { tiles, resetTiles } from '../features/main'
import tileLayersData from './tileLayers.json';
var parse = require('wellknown');

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function SideNavComponent({ products, geojsons, geojsonColors, setGeojsonColors }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  // const collapsibleRef = useRef(null);
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

  const handleBackClick = () => {
    setFormSubmitted(false);
    startDateRef.current = null;
    endDateRef.current = null;
    dispatch(resetTiles())
  }

  const handleFormSubmit = (event) => {
    event.preventDefault();
    if (selectedProduct && geojsons.length > 0) {
      setFormSubmitted(true);
    }

    if (!selectedProduct) {
      alert("You need to select the product first!")
    } else {
      console.log(selectedProduct)
      const formData = {
        product: selectedProduct.id,
        date1: startDateRef.current.value,
        date2: endDateRef.current.value
      };

      dispatch(tiles(formData));
      setFormSubmitted(true);
    }
  };

  function cvtDate(dateString) {
    if (!dateString) {
      return "Invalid date";
    }
  
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
  
      const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const formattedTime = date.toLocaleTimeString('en-GB', { hour12: false });
  
      return `${formattedDate} ${formattedTime}`;
    } catch (error) {
      return "Invalid date";
    }
  }
  

  console.log(geojsons)

  const tab1 = (
    <div className="tab-container">
      <Box component="form"
        onSubmit={handleFormSubmit} 
        className="form-container"
      >
        <Typography variant="h5" className="form-title">
          Download Products for Free
        </Typography>
  
        <Select
          id="product-select"
          className="select-class"
          value={selectedProduct ? selectedProduct.id : ''}
          onChange={handleProductChange}
          displayEmpty
        >
          <MenuItem value="" disabled>
            -- Select a Product --
          </MenuItem>
          {products.map((product) => (
            <MenuItem key={product.id} value={product.id}>
              {product.name}
            </MenuItem>
          ))}
        </Select>
  
        <div className="date-picker-container">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker 
              label="Start Date" 
              ref={startDateRef} 
              className="date-picker"
            />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker 
              label="End Date" 
              ref={endDateRef} 
              className="date-picker"
            />
          </LocalizationProvider>
        </div>
  
        <Button 
          type="submit" 
          className="submit-button" 
          variant="contained" 
          color="primary" 
          disabled={formSubmitted}
        >
          Submit
        </Button>
      </Box>
  
      {geojsons.length === 0 && formSubmitted && (
        <div className="no-results-container">
          <Typography variant="body1" className="error-message">
            No images found.
          </Typography>
          <Button
            variant="outlined"
            color="secondary"
            className="dismiss-button"
            onClick={() => setFormSubmitted(false)}
          >
            Dismiss
          </Button>
        </div>
      )}
    </div>
  );

  const tab2 = (
    <div className="container">
      <Typography variant="h5" className="center-align">
        Products Based on Your Search
      </Typography>
  
      <Button
        onClick={handleBackClick}
        className="back-button"
        variant="contained"
        startIcon={<ArrowBackIcon />}
      >
        Back to Search
      </Button>
  
      <div 
        className="accordion-container" 
        >
        {geojsons.map((geojson) => (
          <Accordion 
              onMouseOver={() => handleMouseOver(geojson.id)}
              onMouseOut={() => handleMouseOut(geojson.id)}
              key={geojson.id} 
              className="geojson-accordion">
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel-${geojson.id}-content`}
              id={`panel-${geojson.id}-header`}
            >
              <Typography>{cvtDate(geojson.date_image)}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                <strong>Name: </strong>{geojson.name}
              </Typography>
              <Typography>
                <strong>Product: </strong>{geojson.product}
              </Typography>
              <Typography>
                <strong>Size: </strong>{formatBytes(geojson.size)}
              </Typography>
              <Button
                className="download-button"
                href={geojson.mask_url}
                download={`${geojson.name}.png`}
                variant="outlined"
                startIcon={<DownloadIcon />}
              >
                Download
              </Button>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    </div>
  );
  
  

  return (
    <>
      {geojsons.length === 0 ? tab1 : tab2}
    </>

  );
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
    const polyCoords = parse(tile.poly).coordinates[0][0].map(([lat, lng]) => [lat, lng]);

    const geojson = {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [polyCoords]
      },
      "properties": {
        "name": tile.name,
        "product": tile.product,
        "mask_url": tile.mask_url,
        "date_image": tile.date_image,
        // "last_modified": tile.last_modified,
        "size": tile.size
      }
    }
    return geojson;
  });

  useEffect(() => {
    if (tiles.length) {
      const initialColors = tiles.reduce((acc, tile) => {
        acc[tile.id] = 'red'; // Set the default color to 'red'
        return acc;
      }, {});
      setGeojsonColors(initialColors);
    }
  }, [tiles]);

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
              <TileLayer url={layer.url} key={index} />
            </LayersControl.BaseLayer>
          ))}
        </LayersControl>

        {geojsons.map((geojson, i) => (
          <GeoJSON 
            id={`geojson-${tiles[i].id}`} 
            key={tiles[i].id} 
            data={geojson} 
            style={{ color: geojsonColors[tiles[i].id] }}>
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
        <ZoomControl position="bottomright" />
      </MapContainer>
      <div className={`sidebar ${showSidebar ? 'active' : ''}`}>
        <SideNavComponent 
          products={products} 
          geojsons={tiles} 
          geojsonColors={geojsonColors} 
          setGeojsonColors={setGeojsonColors} 
          />
      </div>
      {/* <button onClick={handleBackClick} 
          className="waves-effect waves-light btn" 
          id="back-button">Back
      </button> */}
      <Button id="back-button" onClick={handleBackClick}>
        homepage
      </Button>
      <button
        onClick={toggleSidebar}
        className="waves-effect waves-light btn"
        id="button-toggle-side-nav"><i className="material-icons">menu</i></button>
    </>
  );
}

export default RequestMap;





{/* <form onSubmit={handleFormSubmit} className="form-container">
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
      </form> */}