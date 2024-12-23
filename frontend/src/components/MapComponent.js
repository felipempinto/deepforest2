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
import { Menu, Home, ExpandMore, ZoomOutMap } from '@mui/icons-material';
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
                style={{ position: 'absolute', top: '10px', left: '10px' }}
                color="primary"
            >
                <Menu />
            </IconButton>
            <IconButton
                href="/"
                style={{ position: 'absolute', top: '10px', left: '60px' }}
                color="primary"
            >
                <Home />
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

// import React from 'react';
// import {
//     MapContainer,
//     TileLayer,
//     ZoomControl,
//     LayersControl,
//     GeoJSON,
//     ImageOverlay,
//     ScaleControl,
//     Popup,
//   } from 'react-leaflet';
// import './MapComponent.css';
// import tileLayersData from './tileLayers.json';
// import M from 'materialize-css/dist/js/materialize.min.js';
// import { useEffect, useState } from "react";

// const convertBounds = (boundsStr) => {
//     const boundsArray = boundsStr.split(',').map(Number);
//     return [
//         [boundsArray[1], boundsArray[0]], 
//         [boundsArray[3], boundsArray[2]]  
//     ];
// };


// const SideNav = ({data,setData,mapInstance})=>{

//     const [isSideNavOpen,setIsSideNavOpen] = useState(true)

//     useEffect(()=>{
//         const initializeMaterialize = () => {
//             var options = {};
//             const sidenav = document.querySelectorAll('.sidenav');
//             M.Sidenav.init(sidenav, options);
    
//             const collapsible = document.querySelectorAll('.collapsible');
//             M.Collapsible.init(collapsible, options);
//         };
    
//         // Delay initialization by 500 milliseconds
//         setTimeout(initializeMaterialize, 500);
//     },[]);

//     const handleToggleButton = ()=>{
//         setIsSideNavOpen(!isSideNavOpen)
//         // if (isSideNavOpen){
//         //     setIsSideNavOpen(false)
//         // }
//         // else{
//         //     setIsSideNavOpen(true)}
        
//     }

//     const handleRasterCheckboxChange = (id, checked) => {
//         setData(data.map(item => {
//             if (item.id === id) {
//                 return { ...item, rasterEnabled: checked };
//             }
//             return item;
//         }));
//     };

//     const zoomToLayer = (item) => {  
//         mapInstance.flyToBounds(convertBounds(item.bounds_png));
//       };

//     const handleGeojsonCheckboxChange = (id, checked) => {
//         setData(data.map(item => {
//             if (item.id === id) {
//                 return { ...item, geojsonEnabled: checked };
//             }
//             return item;
//         }));
//     };
//     return (
//         <div>
//             <div className={`side-bar-map-visual ${isSideNavOpen?'active':null}`}>
//                 <h5 className='center'>Your data:</h5>
//                 {data &&
//                     data.map((item, index) => (

//                         <ul className="collapsible">
//                             <li key={`list-item-${index}`}>
//                                 <div className="collapsible-header">
//                                     {item.name}
//                                 </div>
//                                 <div className="collapsible-body collapsible-body-style ">
//                                     <div className="collapsible-item">
//                                         <p>
//                                             <label>
//                                                 <input
//                                                     type="checkbox"
//                                                     checked={item.rasterEnabled}
//                                                     onChange={e => handleRasterCheckboxChange(item.id, e.target.checked)} />
//                                                 <span>Raster</span>
//                                             </label>
//                                         </p>
//                                     </div>
//                                     <div className="collapsible-item">
//                                         <p>
//                                             <label>
//                                                 <input
//                                                     type="checkbox"
//                                                     checked={item.geojsonEnabled}
//                                                     onChange={e => handleGeojsonCheckboxChange(item.id, e.target.checked)} />
//                                                 <span>GeoJSON</span>
//                                             </label>
//                                         </p>
//                                     </div>
//                                     <div className="collapsible-item">
//                                         <p>
//                                             <label>
//                                                 <a onClick={()=>zoomToLayer(item)}>
//                                                     <i className='material-icons'>
//                                                         zoom_out_map
//                                                     </i>
//                                                 </a>
//                                                 <span>Zoom to layer</span>
//                                             </label>
//                                         </p>
//                                     </div>
//                                 </div>
//                             </li>
//                         </ul>
//                     ))}
//             </div>
//             <a id="sidenav-toggle" href="#" onClick={handleToggleButton} className="sidenav-button btn"><i className="material-icons">menu</i></a>
//             <a href="/" className="sidenav-button-2 btn"><i className="material-icons">home</i></a>
//         </div>
//     );
// }

// const MapComponent = ({userRequests})=>{

//     const [data,setData] = useState([])
//     const [dataCreated,setDataCreated] = useState(false)
//     const [mapInstance, setMapInstance] = useState(null);

//     useEffect(() => {
//         if (!dataCreated && userRequests.length>0) {
//         // if (!dataCreated) {
//             if(userRequests.length>0){
//             const filteredRequests = userRequests
//                 .filter((item) => item.png)
//                 .map((item) => ({
//                     ...item,
//                     rasterEnabled: false,
//                     geojsonEnabled: false
//                 }));
//             console.log(filteredRequests)
//             setData(filteredRequests);
//             } else {
//                 window.alert("You dont have any requests yet, please, create a request and get back on this page.")
//             }
//             setDataCreated(true);

//         }
//     }, [dataCreated, userRequests]);

//     const tileLayers = tileLayersData.map((layer) => ({
//         key: layer.key,
//         name: layer.name,
//         url: layer.url,
//       }));

//     console.log(dataCreated)

//     return <>
//     {dataCreated &&
//         <MapContainer 
//         className='map-container' 
//         ref={(map) => {
//             if (map && !mapInstance) {
//               setMapInstance(map);
//             }
//           }}
//         center={[51.505, -0.09]} 
//         zoom={5} 
//         zoomControl={false}
//         maxZoom={20} 
//         minZoom={2}>
//         <LayersControl position="bottomright">
//         {tileLayers.map((layer, index) => (
//             <LayersControl.BaseLayer checked name={layer.name} key={index}>
//             <TileLayer url={layer.url} key={index}/>
//             </LayersControl.BaseLayer>
//         ))}
//         </LayersControl>

//         {data && data.length>0 && data.map((item, i) => (
//             <React.Fragment key={`map-item-${i}`}>
//                 {item.rasterEnabled && (
//                         <ImageOverlay
//                             url={item.png}
//                             bounds={convertBounds(item.bounds_png)}
//                             // zIndex={1000}
//                             key={`raster-${i}`}
//                         />

//                 )}
//                 {item.geojsonEnabled && (

//                         <GeoJSON
//                             id={`geojson-${i}`}
//                             key={`geojson-${i}`}
//                             data={JSON.parse(item.geojson)}
//                             style={{ zIndex: 20000 }}
//                         />
//                 )}
                
//             </React.Fragment>
//         ))}
//         <SideNav
//         data={data}
//         setData={setData}
//         mapInstance={mapInstance}
//         />
//         </MapContainer>
//     }
//     </>
// }


// export default MapComponent;