import React from 'react';
import {
    MapContainer,
    TileLayer,
    ZoomControl,
    LayersControl,
    GeoJSON,
    ImageOverlay,
    ScaleControl,
    Popup,
  } from 'react-leaflet';
import './MapComponent.css';
import tileLayersData from './tileLayers.json';
import M from 'materialize-css/dist/js/materialize.min.js';
import { useEffect, useState } from "react";

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes'
  
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

const SideNav = ({data,setData})=>{

    const [isSideNavOpen,setIsSideNavOpen] = useState(true)

    useEffect(()=>{
        const initializeMaterialize = () => {
            var options = {};
            const sidenav = document.querySelectorAll('.sidenav');
            M.Sidenav.init(sidenav, options);
    
            const collapsible = document.querySelectorAll('.collapsible');
            M.Collapsible.init(collapsible, options);
        };
    
        // Delay initialization by 500 milliseconds
        setTimeout(initializeMaterialize, 500);
    },[]);

    const handleToggleButton = ()=>{
        const elem = document.getElementById("slide-out");
        var instance = M.Sidenav.getInstance(elem);
        

        if (isSideNavOpen){
            instance.close();
            setIsSideNavOpen(false)
        }
        else{
            instance.open();
            setIsSideNavOpen(true)
        }
        
    }

    const handleRasterCheckboxChange = (id, checked) => {
        setData(data.map(item => {
            if (item.id === id) {
                return { ...item, rasterEnabled: checked };
            }
            return item;
        }));
    };

    const handleGeojsonCheckboxChange = (id, checked) => {
        setData(data.map(item => {
            if (item.id === id) {
                return { ...item, geojsonEnabled: checked };
            }
            return item;
        }));
    };
    return (
        <div>
            <ul id="slide-out" className="sidenav  sidenav-container">
                <h5>Your data:</h5>
                {data &&
                    data.map((item, index) => (
                        <React.Fragment key={`collapsible-${index}`}>
                            <div className="collapsible">
                                <li key={`list-item-${index}`}>
                                    <div className="collapsible-header">
                                        <i className="material-icons">filter_drama</i>
                                        {item.id}
                                    </div>
                                    <div className="collapsible-body">
                                        <table>
                                            <tbody>
                                                <tr>
                                                    <td>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={item.rasterEnabled}
                                                                onChange={e => handleRasterCheckboxChange(item.id, e.target.checked)} />
                                                            <span>Raster</span>
                                                        </label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td>
                                                        <label>
                                                            <input
                                                                type="checkbox"
                                                                checked={item.geojsonEnabled}
                                                                onChange={e => handleGeojsonCheckboxChange(item.id, e.target.checked)} />
                                                            <span>GeoJSON</span>
                                                        </label>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </li>
                            </div>
                        </React.Fragment>
                    ))}
            </ul>
            <a
                id="sidenav-toggle"
                href="#"
                onClick={handleToggleButton}
                data-target="slide-out"
                className="sidenav-trigger sidenav-button btn"
            >
                <i className="material-icons">menu</i>
            </a>
        </div>
    );

//     return (
//     <div>
//         <ul id="slide-out" className="sidenav  sidenav-container">
//             <h5>Your data:</h5>
//             { data &&
//                 data.map((item,index)=>{
//                     return(
//                     <>
//                         <div className="collapsible">
//                             <li key={index}>
//                                 <div 
//                                     className="collapsible-header">
//                                     <i className="material-icons">filter_drama</i>
//                                     {item.id}
//                                 </div>
//                                 <div 
//                                     className="collapsible-body">
//                                     <table >
//                                         <tbody>
//                                             <tr>
//                                                 <td>
//                                                     <label>
//                                                         <input 
//                                                             type="checkbox" 
//                                                             checked={item.rasterEnabled}
//                                                             onChange={e => handleRasterCheckboxChange(item.id, e.target.checked)}/>
//                                                         <span>Raster</span>
//                                                     </label>
//                                                 </td>
//                                             </tr>
//                                             <tr>
//                                                 <td>
//                                                     <label>
//                                                         <input 
//                                                             type="checkbox" 
//                                                             checked={item.geojsonEnabled}
//                                                             onChange={e => handleGeojsonCheckboxChange(item.id, e.target.checked)}/>
//                                                         <span>GeoJSON</span>
//                                                     </label>
//                                                 </td>
//                                             </tr>
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </li>
//                         </div>
//                     </>
//                 )}
//                 )
//             }
            
//         </ul>
//         <a 
//             id="sidenav-toggle" 
//             href="#" 
//             onClick={handleToggleButton}
//             data-target="slide-out" 
//             className="sidenav-trigger sidenav-button btn"
//             >
//             <i className="material-icons">menu</i>
//         </a>
//     </div>
// )
}

// const MapComponent = ({rasters,geojsons,setRasters,setGeoJSONs,data,setData})=>{
const MapComponent = ({data,setData})=>{

    const tileLayers = tileLayersData.map((layer) => ({
        key: layer.key,
        name: layer.name,
        url: layer.url,
      }));

    return <>
    <MapContainer 
            className='map-container' 
            center={[51.505, -0.09]} 
            zoom={5} 
            zoomControl={false}
            maxZoom={20} 
            minZoom={2}>
            <LayersControl position="bottomright">
            {tileLayers.map((layer, index) => (
                <LayersControl.BaseLayer checked name={layer.name} key={index}>
                <TileLayer url={layer.url} key={index}/>
                </LayersControl.BaseLayer>
            ))}
            </LayersControl>

            {data && data.map((item, i) => (
                <React.Fragment key={`map-item-${i}`}>
                    {item.rasterEnabled && (
                        <ImageOverlay
                            url={item.raster}
                            bounds={item.rasterBounds}
                            zIndex={1000}
                            key={`raster-${i}`}
                        />
                    )}
                    {item.geojsonEnabled && (
                        <GeoJSON
                            id={`geojson-${i}`}
                            key={`geojson-${i}`}
                            data={item.geojson}
                        />
                    )}
                    
                </React.Fragment>
            ))}
        <SideNav
            data={data}
            setData={setData}
        />
        </MapContainer>
    </>
}


export default MapComponent;