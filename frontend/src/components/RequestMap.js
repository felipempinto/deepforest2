import React, { useState,useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
    MapContainer, 
    TileLayer, 
    ZoomControl,
    GeoJSON
    // Marker, 
    // Popup 
} from 'react-leaflet';
import { homepage } from '../features/main'
import './RequestMap.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { tiles } from '../features/main'
var parse = require('wellknown');

function SideNavComponent({ products }) {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const dispatch = useDispatch();

  const handleProductChange = (event) => {
    const productId = parseInt(event.target.value);
    const product = products.find((p) => p.id === productId);
    setSelectedProduct(product);
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();

    // Create an object with the form data
    const formData = {
        product_id: selectedProduct.id,
        start_date: startDate,
        end_date: endDate
    };

    // // Call the tiles function with the form data
    dispatch(tiles(formData));
    // dispatch(tiles(formData))
    // .then((data) => {
    //   console.log(data);
    // });

    // Clear the form fields
    setSelectedProduct(null);
    setStartDate(null);
    setEndDate(null);
};

  return (
    <form onSubmit={handleFormSubmit}>
      <div className="container section">
        <h2>Search for free products:</h2>

        <label htmlFor="product-select">Select a product:</label>
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
        {selectedProduct && (
          <div>
            <h3>{selectedProduct.name}</h3>
            <p>{selectedProduct.description}</p>
          </div>
        )}
        {selectedProduct && (
          <p>Selected product: {selectedProduct.name}</p>
        )}

        <div>
          <label htmlFor="start-date-picker">Start Date:</label>
          <DatePicker
            id="start-date-picker"
            selected={startDate}
            onChange={handleStartDateChange}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            dateFormat="dd/MM/yyyy"
            placeholderText="Select a start date"
          />
        </div>
        <div>
          <label htmlFor="end-date-picker">End Date:</label>
          <DatePicker
            id="end-date-picker"
            selected={endDate}
            onChange={handleEndDateChange}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            dateFormat="dd/MM/yyyy"
            placeholderText="Select an end date"
            minDate={startDate}
          />
        </div>
        {startDate && endDate && (
          <div>
            <p>
              Selected date range:{" "}
              {startDate.toLocaleDateString()} -{" "}
              {endDate.toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
      <button type="submit" className="waves-effect waves-light btn" id="submit-button">
        Submit
      </button>
    </form>
  );
}


function RequestMap() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(homepage());
    }, [dispatch]);


    const [showSidebar, setShowSidebar] = useState(false);
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
      const polyCoords = parse(tile.poly).coordinates[0][0].map(([lng,lat]) => [lat,lng]);

      const geojson = {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [polyCoords]
        },
        "properties": {
          "name": tile.name,
          "product": tile.product,
          "date_image": tile.date_image,
          "last_modified": tile.last_modified,
          "size": tile.size
        }
      }
  
      return geojson;
    });

  return (
    <>
        <MapContainer className='map-container' center={[51.505, -0.09]} zoom={13} zoomControl={false} >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {geojsons.map((geojson, i) => (
              <GeoJSON key={tiles[i].id} data={geojson} style={{ color: 'red' }} />
            ))}
            <ZoomControl position="bottomright"/>
        </MapContainer> 

        <div className={`sidebar ${showSidebar ? 'active' : ''}`}>
            <SideNavComponent products={products}/>
        </div>
        <button onClick={handleBackClick} className="waves-effect waves-light btn" id="back-button">Back</button>
        <button onClick={toggleSidebar} className="button-toggle-side-nav waves-effect waves-light btn"><i className="material-icons">menu</i></button>
    </>
  );
}

export default RequestMap;

