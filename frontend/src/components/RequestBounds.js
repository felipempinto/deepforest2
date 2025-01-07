import './RequestBounds.css';
import {  Snackbar, Alert, TextField, Tooltip, Button, Typography, 
  Box, Select, MenuItem, FormControl, InputLabel, Container 
} from "@mui/material";
import HelpIcon from '@mui/icons-material/Help';
import React, { useCallback, useEffect,useRef,useState } from 'react';
import {useDispatch, useSelector } from 'react-redux';
import { MapContainer,
  TileLayer,
  ZoomControl,
  LayersControl,
  GeoJSON,
  useMap,
  FeatureGroup,
  // Popup
        } from 'react-leaflet';
import 'leaflet-draw/dist/leaflet.draw.css';
import { EditControl } from 'react-leaflet-draw';
import NavbarContainer from './includes/Navbar'
import { useNavigate } from 'react-router-dom';
import { models } from '../features/products';
import L from 'leaflet';
import {request} from '../features/products'
import axios from 'axios';
import { 
  Navigate,
  // Link
} from 'react-router-dom';
import tileLayersData from './tileLayers.json';
// import { loadingPage } from './Loading';
var parse = require('wellknown');


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

      if (response.status === 200  || response.status === 204) {
          return response;
      } else {
          console.error('Error fetching data:', response.status, response.statusText);
      }
  } catch (error) {
      console.error('Error making request:', error);
  }
};

const handleRequest = (pth,bounds,data,userId,dispatch,navigate,setSubmitDisabled) => {
  if (!pth || !bounds || !data || !userId) {
    console.log(bounds,data,pth,userId);
    alert('Please complete all fields');
    return;
  }
  const files = []
  data.features.map((file)=>{
    files.push(file.properties.Name)
  })
  console.log(pth,bounds,files,userId);
  dispatch(request({ pth, bounds, files, userId }))
  .then((response) => {
    if (response.error) {
      alert('An error occurred while processing your request');
      console.log(response)
    } else {
      navigate('/requests');
    }
  }).catch((error) => {
    console.error('An error occurred:', error);
    alert('An error occurred while processing your request');
  });
}


const MiniMap = ({ filteredProduct, setPolygon, data }) => {
  const [geojsonEnabled, setGeojsonEnabled] = useState(true);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "error" });
  const wktPolygon = filteredProduct?.poly;
  const geojsonPolygon = wktPolygon ? parse(wktPolygon) : null;
  const featureGroupRef = useRef(null);

  const handleToggleGeojson = () => {
    setGeojsonEnabled((prevEnabled) => !prevEnabled);
  };

  const onPolygonCreated = (e) => {
    const { layer } = e;

    if (featureGroupRef.current && featureGroupRef.current.getLayers().length > 1) {
      featureGroupRef.current.removeLayer(layer);
      setNotification({
        open: true,
        message: "Only single geometries are allowed.",
        severity: "warning",
      });
      return;
    }

    const areaMetersSquared = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0]);
    const areaKilometersSquared = areaMetersSquared / 1000000;
    const maxArea = 110 * 110;

    if (areaKilometersSquared > maxArea) {
      const areasqkm = areaKilometersSquared.toFixed(2);
      featureGroupRef.current.clearLayers();
      setNotification({
        open: true,
        message: `Area exceeds maximum allowed (12100 km²). Requested: ${areasqkm} km².`,
        severity: "error",
      });
      return;
    }

    const wktPolygon = layer.toGeoJSON().geometry;
    const wktString = parse.stringify(wktPolygon);
    setPolygon(wktString);
  };

  const fitBounds = useCallback(
    (map) => {
      if (geojsonPolygon && map) {
        const bounds = L.geoJSON(geojsonPolygon).getBounds();
        map.fitBounds(bounds);
      }
    },
    [geojsonPolygon]
  );

  useEffect(() => {
    const map = featureGroupRef.current?._map;
    if (map) fitBounds(map);
  }, [fitBounds]);

  const MapComponent = () => {
    const map = useMap();
    fitBounds(map);
    return null;
  };

  const onEachFeature = (feature, layer) => {
    if (feature.properties) {
      const { Name, OriginDate, ContentLength, Footprint } = feature.properties;
      const popupContent = `
        <div>
          <p>${Name}</p>
          <p><strong>Date:</strong> ${new Date(OriginDate).toLocaleString()}</p>
          <p><strong>Footprint:</strong> ${Footprint}</p>
          <p><strong>Content Length:</strong> ${ContentLength}</p>
        </div>
      `;
      layer.bindPopup(popupContent);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color={geojsonEnabled ? "primary" : "secondary"}
        onClick={handleToggleGeojson}
      >
        {geojsonEnabled ? "Disable Locations" : "Enable Locations"}
      </Button>

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
          <GeoJSON id="locations" data={geojsonPolygon} style={{ color: "red" }} />
        )}
        {data?.features?.length > 0 && (
          <GeoJSON
            id="data"
            data={data}
            style={{ color: "yellow" }}
            onEachFeature={onEachFeature}
          />
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

      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert onClose={() => setNotification({ ...notification, open: false })} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

const Map = ({ filteredProduct }) => {
  const dateRef1 = useRef(null);
  const dateRef2 = useRef(null);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [data, setData] = useState([]);
  const [polygon, setPolygon] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  const handleGetData = useCallback(async () => {
    setData([]);
    setSubmitDisabled(true);

    const bounds = polygon;
    const date1 = dateRef1.current.value;
    const date2 = dateRef2.current.value;
    if (!bounds || !date1 || !date2) {
      alert('Please complete all fields');
      setSubmitDisabled(false);
      return;
    }

    const response = await getFootprints(date1, date2, bounds);
    if (response.status === 204) {
      window.alert('No images found for this period');
      setSubmitDisabled(false);
      return;
    }

    const obj = JSON.parse(response.data);
    console.log(obj);
    setData(obj);
    setSubmitDisabled(false);
  }, [polygon, dateRef1, dateRef2]);

  const textLocation = 'You can draw a polygon by selecting the polygon icon in the top right corner of the map';

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField
          label="Date1"
          type="date"
          inputRef={dateRef1}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
        <TextField
          label="Date2"
          type="date"
          inputRef={dateRef2}
          InputLabelProps={{ shrink: true }}
          fullWidth
        />
      </Box>

      <Box textAlign="center" mb={2}>
        <Typography variant="h5">
          Select a location
          <Tooltip title={textLocation} placement="bottom">
            <HelpIcon/>
          </Tooltip>
        </Typography>
      </Box>

      <MiniMap setPolygon={setPolygon} filteredProduct={filteredProduct} data={data} />

      {data && data.features && data.features.length > 0 ? (
        <Box textAlign="center" mt={2}>
          <Button variant="contained" color="secondary" onClick={() => setData([])}>
            Clear Search
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() =>
              handleRequest(
                filteredProduct.id,
                polygon,
                data,
                user.id,
                dispatch,
                navigate,
                setSubmitDisabled
              )
            }
            disabled={submitDisabled}
            sx={{ ml: 2 }}
          >
            Submit
          </Button>
        </Box>
      ) : (
        <Box textAlign="center" mt={2}>
          <Button
            variant="contained"
            onClick={handleGetData}
            disabled={submitDisabled}
          >
            {submitDisabled ? 'Searching...' : 'Search'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

function RequestBounds() {
    const dispatch = useDispatch();
    const { isAuthenticated, user, loading } = useSelector(state => state.user);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [selectedVersion, setSelectedVersion] = useState("");
    // const [footprints, setFootprints] = useState([]);

    useEffect(() => {
        dispatch(models());
    }, [dispatch]);

    const products = useSelector((state) => state.product.models);
    const filteredVersions = products.filter(
        (product) => product.product === selectedProduct
    );

    const uniqueProducts = [...new Set(
      products.map(product => product.product
      ))];  
    const filteredProduct = filteredVersions.find((product) => product.version === selectedVersion);
    
    console.log(products)
    console.log(uniqueProducts)
    if (!isAuthenticated && !loading && user === null)
        return <Navigate to='/login'/>;

    return (
        <>
        <NavbarContainer />
          <Container>
            <div className='container'>
                <h1 className='center'>Request new basemap</h1>

                <FormControl fullWidth>
                    <InputLabel>Choose the product</InputLabel>
                    <Select
                        value={selectedProduct}
                        onChange={(event) => setSelectedProduct(
                          event.target.value
                        )}
                    >
                        <MenuItem value="" disabled>
                            Choose the product
                        </MenuItem>
                        {uniqueProducts.map((product, i) => (
                            <MenuItem key={i} value={product}>{
                              product
                            }</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {selectedProduct && (
                    <FormControl fullWidth style={{ marginTop: "20px" }}>
                        <InputLabel>Choose the version</InputLabel>
                        <Select
                            value={selectedVersion}
                            onChange={(event) => setSelectedVersion(
                              event.target.value
                            )}
                        >
                            <MenuItem value="" disabled>
                                Choose the version
                            </MenuItem>
                            {filteredVersions.map((product) => (
                                <MenuItem key={product.id} value={
                                  product.version}>
                                    {product.version}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}

                {selectedVersion && 
                    <Map key={filteredProduct?.id} filteredProduct={
                      filteredProduct
                    } />
                }
            </div>
            </Container>
        </>
    );
}

export default RequestBounds;