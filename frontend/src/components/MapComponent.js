import { 
    MapContainer,
    LayersControl,
    TileLayer,
    GeoJSON,
    Popup
        } from "react-leaflet"
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

const SideNav = ({data})=>{
    // console.log(data)

    const [isSideNavOpen,setIsSideNavOpen] = useState(true)

    useEffect(()=>{
        var options = {}
        const sidenav = document.querySelectorAll('.sidenav');
        M.Sidenav.init(sidenav, options);

        const collapsible = document.querySelectorAll('.collapsible');
        M.Collapsible.init(collapsible, options);
    },[])

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

    return (
    <div>
        <ul id="slide-out" className="sidenav  sidenav-container">
            <h5>Your data:</h5>
            { data &&
                data.map((item,index)=>{
                    return(
                    <>
                    <div className="collapsible">
                        <li key={index}>
                            <div 
                                className="collapsible-header">
                                <i className="material-icons">filter_drama</i>
                                {item.name}
                            </div>
                            <div 
                                className="collapsible-body">
                                    <span>Lorem ipsum dolor sit amet.</span>
                            </div>
                        </li>
                        </div>
                    </>
                )}
                )
            }
            
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
)
}

const MapComponent = ({rasters,geojsons,setRasters,setGeoJSONs})=>{

    const tileLayers = tileLayersData.map((layer) => ({
        key: layer.key,
        name: layer.name,
        url: layer.url,
      }));

    
    const data = [
        {id:1,name:"Data 1"},
        {id:2,name:"Data 2"},
    ]

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
            {geojsons && geojsons.map((geojson, i) => (
                <GeoJSON 
                    id={`geojson-${i}`} 
                    key={i} 
                    data={geojson} 
                    // style={{ color: geojsonColors[tiles[i].id] }}
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
                        <a className="btn waves-effect waves-light my-btn-class" href={geojson.properties.mask_url} download>
                            Download
                        </a>}
                    </div>
                    </Popup>
                </GeoJSON>
        ))}

        {rasters}
        <SideNav
            data={data}
        />
        </MapContainer>
    </>
}


export default MapComponent;