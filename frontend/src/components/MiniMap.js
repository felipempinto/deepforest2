import React, { useCallback, useEffect,useRef,useState } from 'react';
import { MapContainer,
    TileLayer,
    ZoomControl,
    LayersControl,
    GeoJSON,
    useMap,
    FeatureGroup,
    
    // Popup
} from 'react-leaflet';
import L from 'leaflet';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import BorderAllIcon from '@mui/icons-material/BorderAll';
import BorderClearIcon from '@mui/icons-material/BorderClear';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import ClearIcon from '@mui/icons-material/Clear';
import {  
    Snackbar, 
    Alert, 
    Box,
    Button,
    Tooltip,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    Typography,
} from "@mui/material";
import tileLayersData from './tileLayers.json';
import * as wellknown from 'wellknown';
var parse = require('wellknown');



const tileLayers = tileLayersData.map((layer) => ({
    key: layer.key,
    name: layer.name,
    url: layer.url,
}));


const MiniMap = ({ filteredProduct, setPolygon, data }) => {
    const [geojsonEnabled, setGeojsonEnabled] = useState(true);
    const [notification, setNotification] = useState({ open: false, message: "", severity: "error" });
    const [isMaximized, setIsMaximized] = useState(false);
    const [drawnPolygons, setDrawnPolygons] = useState([]);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [geoJsonData, setGeoJsonData] = useState({ type: "FeatureCollection", features: [] });
    const wktPolygon = filteredProduct?.poly;
    const geojsonPolygon = wktPolygon ? parse(wktPolygon) : null;
    const featureGroupRef = useRef(null);
    const mapRef = useRef(null);

    const handleToggleGeojson = () => {
        setGeojsonEnabled((prevEnabled) => !prevEnabled);
    };

    const updateDrawnPolygons = (newFeatures) => {
        setDrawnPolygons((prev) => {
            const updatedNewFeatures = newFeatures.map((feature, index) => ({
                ...feature,
                properties: {
                    ...feature.properties,
                    id: `feature-${prev.length + index + 1}`,
                },
            }));
    
            const updatedFeatures = [...prev, ...updatedNewFeatures];
    
            setGeoJsonData({ type: "FeatureCollection", features: updatedFeatures });
    
            return updatedFeatures;
        });
    };
    
    

    const validateGeometry = (geometry) => {
        console.log(geometry)
        if (geometry.type !== "Polygon") {
            setNotification({
                open: true,
                message: "Only single polygons are allowed.",
                severity: "error",
            });
            return false;
        }
        return true;
    };

    const onEachFeatureGeojsonData = (feature, layer) => {
        const id = feature.properties.id;
    
        const popupContent = `
            <div>
                <p>ID: ${id}</p>
            </div>
        `;
    
        layer.bindPopup(popupContent);
    
        layer.on('click', () => {
            layer.setStyle({ color: 'yellow' });
    
        });
    };
    
    

    const onPolygonCreated = (e) => {
        const { layer } = e;

        if (featureGroupRef.current) {
            featureGroupRef.current.clearLayers(); 
        }

        const geoJSON = layer.toGeoJSON();
        const { geometry } = geoJSON;

        if (!validateGeometry(geometry)) {
            featureGroupRef.current.removeLayer(layer);
            return;
        }

        if (
            featureGroupRef.current && 
            featureGroupRef.current.getLayers().length > 1
        ) {
            featureGroupRef.current.removeLayer(layer);
            setNotification({
                open: true,
                message: "Only single geometries are allowed.",
                severity: "warning",
            });
            return;
        }

        const areaMetersSquared = L.GeometryUtil.geodesicArea(
            layer.getLatLngs()[0]);
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
        setGeoJsonData({
            type: "FeatureCollection",
            features: [geoJSON], 
        });
        setDrawnPolygons((prev) => [...prev, geoJSON]);
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

    const handleUpload = (event) => {
        const file = event.target.files[0];
    
        if (file && geoJsonData.features.length===0) {
            const reader = new FileReader();
            reader.onload = function (e) {
                try {
                    const geoJSON = JSON.parse(e.target.result);
                    if (geoJSON.features.length>100){
                        setNotification({
                            open: true,
                            message: `Too many geometries to load, choose a smaller file. (${geoJSON.features.length} geometries, maximum allowed is 100)`,
                            severity: "error",
                        });
                        return 
                    }
                    const newFeatures = geoJSON.features.filter(
                        (feature) => feature.geometry.type === "Polygon"
                    );
    
                    if (newFeatures.length === 0) {
                        setNotification({
                            open: true,
                            message: "No valid polygons found in the file.",
                            severity: "warning",
                        });
                        return;
                    }
    
                    updateDrawnPolygons(newFeatures);

                    if (newFeatures.length === 1) {
                        const singlePolygonWKT = wellknown.stringify(
                            newFeatures[0].geometry
                        );
                        setPolygon(singlePolygonWKT); 
                    }
    
                    // const newPolygonsWKT = newFeatures.map((feature) =>
                    //     wellknown.stringify(feature.geometry)
                    // );
                    // setPolygon((prev) => [...prev, ...newPolygonsWKT]);
    
                    setNotification({
                        open: true,
                        message: "GeoJSON file loaded successfully!",
                        severity: "success",
                    });

                    const bounds = L.geoJSON(geoJSON).getBounds();
                    if (mapRef.current) {
                        mapRef.current.fitBounds(bounds); 
                    }
                } catch (error) {
                    console.log(error)
                    setNotification({
                        open: true,
                        message: "Failed to load the GeoJSON file. Please check the file format.",
                        severity: "error",
                    });
                }
            };
    
            reader.readAsText(file);
        }
    };

    const handleFeatureSelect = (event) => {
        setSelectedFeature(event.target.value);
    };

    const handleChooseGeometry = () => {
        if (selectedFeature !== null) {
            const selectedGeoJsonFeature = geoJsonData.features.find(
                (feature) => feature.properties.id === selectedFeature
            );
            if (selectedGeoJsonFeature) {
                const wktPolygon = selectedGeoJsonFeature.geometry;
                const wktString = parse.stringify(wktPolygon);
    
                setPolygon(wktString);
                setGeoJsonData({
                    type: "FeatureCollection",
                    features: [selectedGeoJsonFeature],
                });
                setSelectedFeature(null);
                setNotification({
                    open: true,
                    message: "Geometry selected successfully!",
                    severity: "success",
                });
            }
        } else {
            setNotification({
                open: true,
                message: "No geometry selected. Please select a geometry first.",
                severity: "warning",
            });
        }
    };
    

    const handleErase = ()=>{
        setDrawnPolygons([])
        setGeoJsonData({ type: "FeatureCollection", features: [] })
        setPolygon(null)
    }

    console.log(geoJsonData)


    return (
        <>
            <Box position={isMaximized ? "absolute": "relative"} 
                height={isMaximized ? "100%" : "400px"} 
                width="100%"
                top={isMaximized?"0px":""}
                left={isMaximized?"0px":""}
                zIndex={isMaximized?1000:""}
            >
            <Tooltip title={isMaximized?"Minimize":"Maximize"} placement="right">
                <Button
                    variant="text"
                    onClick={() => setIsMaximized(!isMaximized)}
                    sx={{ 
                        color:"white",
                        position: "absolute", 
                        top: 10, 
                        left: 10, 
                        zIndex: 1000 
                    }}
                    >
                    {isMaximized ? <FullscreenExitIcon/>: <FullscreenIcon/>}
                </Button>
            </Tooltip>
            <Tooltip title="Locations used during training phase" placement="right">
                <Button
                    variant="text"
                    onClick={handleToggleGeojson}
                    sx={{ 
                        color:"white",
                        position: "absolute", 
                        top: 40, 
                        left: 10, 
                        zIndex: 1000, 
                    }}
                    >
                    {geojsonEnabled ? <BorderClearIcon/>:<BorderAllIcon/>}
                </Button>
            </Tooltip>
            
            <Tooltip title="Erase geometries" placement="right">
                <Button
                    variant="text"
                    onClick={handleErase}
                    sx={{ 
                        color:"white",
                        position: "absolute", 
                        top: 70, 
                        left: 10, 
                        zIndex: 1000, 
                    }}
                    >
                    <ClearIcon/>
                </Button>
            </Tooltip>

            {geoJsonData.features.length===0?
            <Tooltip title="Upload Geometry" placement="right">
                <Button
                    variant="text"
                    component="label"
                    sx={{
                        color: "white",
                        position: "absolute",
                        top: 100,
                        left: 10,
                        zIndex: 1000,
                    }}
                >
                    <FileUploadIcon />
                    <input type="file" accept=".geojson" hidden onChange={handleUpload} />
                </Button>
            </Tooltip>:null}

            <MapContainer
                className="map-container map-container-request"
                center={[51.505, -0.09]}
                zoom={5}
                zoomControl={false}
                maxZoom={20}
                minZoom={2}
                style={{ 
                        height: "100%",
                        width: "100%" 
                    }}
                ref={mapRef} 
            >
                <LayersControl position="bottomright">
                    {tileLayers.map((layer) => (
                        <LayersControl.BaseLayer 
                            checked 
                            name={layer.name} 
                            key={layer.key}
                        >
                            <TileLayer url={layer.url} />
                        </LayersControl.BaseLayer>
                    ))}
                </LayersControl>

                {geojsonPolygon && geojsonEnabled && (
                    <GeoJSON 
                        id="locations" 
                        data={geojsonPolygon} 
                        style={{ color: "red" }} 
                    />
                )}
                {data?.features?.length > 0 && (
                    <GeoJSON
                        id="data"
                        data={data}
                        style={{ color: "yellow" }}
                        onEachFeature={onEachFeature}
                    />
                )}

                {geoJsonData.features.length > 0 && (
                    <GeoJSON
                        id="user-drawn"
                        key={JSON.stringify(geoJsonData)}
                        data={geoJsonData}
                        style={{ color: "blue" }}
                        onEachFeature={onEachFeatureGeojsonData}
                    />
                )}

                <ZoomControl position="bottomright" />
                {/* <MapComponent /> */}
                {geoJsonData.features.length===0?
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
                :null}
            </MapContainer>
            </Box>

            {geoJsonData.features.length>1?
                <Box sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        Select a Geometry
                    </Typography>
                    <FormControl component="fieldset">
                        <RadioGroup
                            aria-label="geojson-features"
                            value={selectedFeature}
                            onChange={handleFeatureSelect}
                        >
                            {geoJsonData.features.map((feature) => (
                                <FormControlLabel
                                    key={feature.properties.id}
                                    value={feature.properties.id}
                                    control={<Radio />}
                                    label={`Feature ID: ${feature.properties.id}`}
                                />
                            ))}
                        </RadioGroup>
                    </FormControl>
                    <Box sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleChooseGeometry}
                            disabled={selectedFeature === null}
                        >
                            Choose this geometry
                        </Button>
                    </Box>
                </Box>
            :null}
            
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


export default MiniMap;