import React, { useEffect, useState } from 'react';
import {
    MapContainer,
    TileLayer,
    LayersControl,
    GeoJSON,
    ImageOverlay,
} from 'react-leaflet';
import {
    Drawer,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Checkbox,
    FormControlLabel,
    IconButton,
    Button,
} from '@mui/material';
import { Home, ExpandMore, ZoomOutMap, ArrowRight, ArrowLeft } from '@mui/icons-material';
import './MapComponent.css';
import tileLayersData from './tileLayers.json';

const convertBounds = (boundsStr) => {
    const boundsArray = boundsStr.split(',').map(Number);
    return [
        [boundsArray[1], boundsArray[0]],
        [boundsArray[3], boundsArray[2]],
    ];
};

const SideNav = ({ data, setData, mapInstance }) => {
    const [isSideNavOpen, setIsSideNavOpen] = useState(true);

    const handleToggleButton = () => {
        setIsSideNavOpen(!isSideNavOpen);
    };

    const handleRasterCheckboxChange = (id, checked) => {
        setData(data.map(item => (item.id === id ? { ...item, rasterEnabled: checked } : item)));
    };

    const handleGeojsonCheckboxChange = (id, checked) => {
        setData(data.map(item => (item.id === id ? { ...item, geojsonEnabled: checked } : item)));
    };

    const zoomToLayer = (item) => {
        mapInstance.flyToBounds(convertBounds(item.bounds_png));
    };

    return (
        <>
            <Drawer
                anchor="left"
                open={isSideNavOpen}
                onClose={handleToggleButton}
                variant="persistent"
                PaperProps={{
                    style: { width: '300px', padding: '10px' },
                }}
            >
                <h5 style={{ textAlign: 'center' }}>Your Data:</h5>
                {data &&
                    data.map((item, index) => (
                        <Accordion key={`accordion-${index}`}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                                {item.name}
                            </AccordionSummary>
                            <AccordionDetails>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={item.rasterEnabled}
                                            onChange={(e) =>
                                                handleRasterCheckboxChange(item.id, e.target.checked)
                                            }
                                        />
                                    }
                                    label="Raster"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={item.geojsonEnabled}
                                            onChange={(e) =>
                                                handleGeojsonCheckboxChange(item.id, e.target.checked)
                                            }
                                        />
                                    }
                                    label="GeoJSON"
                                />
                                <Button
                                    startIcon={<ZoomOutMap />}
                                    onClick={() => zoomToLayer(item)}
                                    style={{ marginTop: '10px' }}
                                >
                                    Zoom to Layer
                                </Button>
                            </AccordionDetails>
                        </Accordion>
                    ))}
            </Drawer>
            <IconButton
                onClick={handleToggleButton}
                style={{ 
                    position: 'absolute', 
                    top: "10px", 
                    left: !isSideNavOpen?'10px':"300px", 
                    zIndex:"10000",
                    backgroundColor:"white",
                    color:"black"
                }}
                color="primary"
            >
                {isSideNavOpen?
                <ArrowLeft/>:
                <ArrowRight/>
                }
                
            </IconButton>
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
        </>
    );
};

const MapComponent = ({ userRequests }) => {
    const [data, setData] = useState([]);
    const [dataCreated, setDataCreated] = useState(false);
    const [mapInstance, setMapInstance] = useState(null);

    useEffect(() => {
        if (!dataCreated && userRequests.length > 0) {
            const filteredRequests = userRequests
                .filter((item) => item.png)
                .map((item) => ({
                    ...item,
                    rasterEnabled: false,
                    geojsonEnabled: false,
                }));
            setData(filteredRequests);
            setDataCreated(true);
        }
    }, [dataCreated, userRequests]);

    const tileLayers = tileLayersData.map((layer) => ({
        key: layer.key,
        name: layer.name,
        url: layer.url,
    }));

    return (
        <>
            {dataCreated && (
                <MapContainer
                    className="map-container"
                    ref={(map) => {
                        if (map && !mapInstance) {
                            setMapInstance(map);
                        }
                    }}
                    center={[51.505, -0.09]}
                    zoom={5}
                    maxZoom={20}
                    minZoom={2}
                    zoomControl={false}
                >
                    <LayersControl position="bottomright">
                        {tileLayers.map((layer, index) => (
                            <LayersControl.BaseLayer checked name={layer.name} key={index}>
                                <TileLayer url={layer.url} key={index} />
                            </LayersControl.BaseLayer>
                        ))}
                    </LayersControl>

                    {data.map((item, i) => (
                        <React.Fragment key={`map-item-${i}`}>
                            {item.rasterEnabled && (
                                <ImageOverlay
                                    url={item.png}
                                    bounds={convertBounds(item.bounds_png)}
                                />
                            )}
                            {item.geojsonEnabled && (
                                <GeoJSON
                                    key={`geojson-${i}`}
                                    data={JSON.parse(item.geojson)}
                                    style={{ zIndex: 20000 }}
                                />
                            )}
                        </React.Fragment>
                    ))}

                    <SideNav data={data} setData={setData} mapInstance={mapInstance} />
                </MapContainer>
            )}
        </>
    );
};

export default MapComponent;