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
import {  
    Snackbar, 
    Alert, 
    Box,
    Button,
    Tooltip,
} from "@mui/material";
import tileLayersData from './tileLayers.json';
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
    const wktPolygon = filteredProduct?.poly;
    const geojsonPolygon = wktPolygon ? parse(wktPolygon) : null;
    const featureGroupRef = useRef(null);
    const mapRef = useRef(null);

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

    const handleUpload = ()=>{
        
    }

    const MapComponent = () => {
        const map = useMap();
        // fitBounds(map);
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
            <Tooltip title="Upload Geometry" placement="right">
                <Button
                    variant="text"
                    onClick={handleUpload}
                    sx={{ 
                        color:"white",
                        position: "absolute", 
                        top: 70, 
                        left: 10, 
                        zIndex: 1000, 
                    }}
                    >
                    <FileUploadIcon/>
                </Button>
            </Tooltip>

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
            </Box>

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