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
import MenuIcon from '@mui/icons-material/Menu';
import CircularProgress from '@mui/material/CircularProgress';
import { 
  Box,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button, 
  IconButton,
  Typography,
  Alert,
  Snackbar
} from '@mui/material';
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

function SideNavComponent({ 
  products, 
  geojsons, 
  geojsonColors, 
  setGeojsonColors,
  showSuccessSnack,
  showErrorSnack
}) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [date1,setDate1] = useState(null)
  const [date2,setDate2] = useState(null)
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
    setDate1(null)
    setDate2(null)
    dispatch(resetTiles())
  }

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (selectedProduct && geojsons.length > 0) {
      setFormSubmitted(true);
    }

    if (!selectedProduct) {
      showErrorSnack("You need to select the product first!")
      setFormSubmitted(false);
    } else if (!date1 || !date2){
      showErrorSnack("You need to select the dates!")
      setFormSubmitted(false);
    } else {
      const formData = {
        product: selectedProduct.id,
        date1: date1,
        date2: date2,
      };

      setFormSubmitted(true);
      const response = await dispatch(tiles(formData));
      if (response.type==="tiles/rejected"){
        console.log("ERROR:",response.payload.error)
      } else if ( response.type==="tiles/fulfilled" ) {
        console.log(response.payload.length)
        if (response.payload.length===0){
          showErrorSnack('No images found')
        } else {
          showSuccessSnack(`${response.payload.length} images found`)
        }
      }
      setFormSubmitted(false);
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

  const tab1 = (
    <div>
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
              className="date-picker"
              value={date1}
              onChange={e=>setDate1(e)}
            />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker 
              label="End Date" 
              className="date-picker"
              value={date2}
              onChange={e=>setDate2(e)}
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
          {formSubmitted?<CircularProgress />:null}
          Submit
        </Button>
      </Box>
    </div>
  );

  const tab2 = (
    <>
      <Button
        onClick={handleBackClick}
        className="back-button"
        variant="contained"
        startIcon={<ArrowBackIcon />}
      >
        Back to Search
      </Button>
        {geojsons.map((geojson) => (
          <Accordion 
              onMouseOver={() => handleMouseOver(geojson.id)}
              onMouseOut={() => handleMouseOut(geojson.id)}
              key={geojson.id} 
              >
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
    </>
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
  const [open, setOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [geojsonColors, setGeojsonColors] = useState({});
  const [showSidebar, setShowSidebar] = useState(true);
  const navigate = useNavigate();

  const tiles = useSelector((state) => state.main.tiles);
  const products = useSelector((state) => state.main.products);

  const showSuccessSnack = (message) => {
    setSnackbarSeverity('success');
    setSnackbarMessage(message);
    setOpen(true);
  };
  
  const showErrorSnack = (message) => {
    setSnackbarSeverity('error');
    setSnackbarMessage(message);
    setOpen(true);
  };
  
  const handleCloseSnack = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
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
        "size": tile.size
      }
    }
    return geojson;
  });

  useEffect(() => {
    if (tiles.length) {
      const initialColors = tiles.reduce((acc, tile) => {
        acc[tile.id] = 'red';
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
          showSuccessSnack={showSuccessSnack}
          showErrorSnack={showErrorSnack}
          />
      </div>
      <IconButton
          href="/"
          style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px',
              zIndex:"10000" 
          }}
          color="primary"
      >
          {/* <Home /> */}
          <img
          src={process.env.PUBLIC_URL + '/Logo.png'}
          alt="Deep Forest Logo"
          style={{ height: '40px' }}
      />
      </IconButton>
      <Button 
        onClick={toggleSidebar}
        className="waves-effect waves-light btn"
        id="button-toggle-side-nav"
      >
        <MenuIcon/>
      </Button>
      <Snackbar 
        open={open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnack}
      >
        <Alert
          onClose={handleCloseSnack}
          severity={snackbarSeverity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </>
  );
}

export default RequestMap;