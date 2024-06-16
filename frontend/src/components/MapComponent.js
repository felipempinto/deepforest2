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


const SideNav = ({data,setData,mapInstance})=>{

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

    const zoomToLayer = (item) => {  
        mapInstance.flyToBounds(convertBounds(item.bounds_png));
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
                                <li className='row' key={`list-item-${index}`}>
                                    <div className="col s10 collapsible-header">
                                        <i className="material-icons">filter_drama</i>
                                        {item.name}
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
                                                                onChange={
                                e => handleRasterCheckboxChange(item.id, e.target.checked)} />
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
                                                                onChange={
                                e => handleGeojsonCheckboxChange(item.id, e.target.checked)} />
                                                            <span>GeoJSON</span>
                                                        </label>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <a onClick={()=>zoomToLayer(item)} className='col s2' ><i className='material-icons'>zoom_out_map</i></a>
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
}

const convertBounds = (boundsStr) => {
    const boundsArray = boundsStr.split(',').map(Number);
    return [
        [boundsArray[1], boundsArray[0]], 
        [boundsArray[3], boundsArray[2]]  
    ];
};

const MapComponent = ({userRequests})=>{

    const [data,setData] = useState([])
    const [dataCreated,setDataCreated] = useState(false)
    const [mapInstance, setMapInstance] = useState(null);

    useEffect(() => {
        if (!dataCreated && userRequests.length>0) {
            const filteredRequests = userRequests
                .filter((item) => item.png)
                .map((item) => ({
                    ...item,
                    rasterEnabled: false,
                    geojsonEnabled: false
                }));
            console.log(filteredRequests)
            setData(filteredRequests);
            setDataCreated(true);

        }
    }, [dataCreated, userRequests]);

    const tileLayers = tileLayersData.map((layer) => ({
        key: layer.key,
        name: layer.name,
        url: layer.url,
      }));

    return <>
    {dataCreated &&
        <MapContainer 
        className='map-container' 
        ref={(map) => {
            if (map && !mapInstance) {
              setMapInstance(map);
            }
          }}
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

        {data && data.length>0 && data.map((item, i) => (
            <React.Fragment key={`map-item-${i}`}>
                {item.rasterEnabled && (
                        <ImageOverlay
                            url={item.png}
                            bounds={convertBounds(item.bounds_png)}
                            // zIndex={1000}
                            key={`raster-${i}`}
                        />

                )}
                {item.geojsonEnabled && (

                        <GeoJSON
                            id={`geojson-${i}`}
                            key={`geojson-${i}`}
                            data={JSON.parse(item.geojson)}
                            style={{ zIndex: 20000 }}
                        />
                )}
                
            </React.Fragment>
        ))}
        <SideNav
        data={data}
        setData={setData}
        mapInstance={mapInstance}
        />
        </MapContainer>
    }
    </>
}


export default MapComponent;