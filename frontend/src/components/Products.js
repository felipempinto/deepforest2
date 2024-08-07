import React, {useEffect,useRef,useState } from 'react';
import NavbarContainer from './includes/Navbar'
import { useDispatch, useSelector } from "react-redux";
import { homepage } from "../features/main";
import { modelsCsv } from "../features/products";
import M from "materialize-css";
import Papa from 'papaparse';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { 
  Navigate,
  // Link
} from 'react-router-dom';
import merge from 'lodash/merge';


const Products = () => {
  const combinedData = [];
  const [data1, setData1] = useState([]);
  const [data2, setData2] = useState([]);
  const [data, setData] = useState([]);
  const [window,setWindow] = useState(10);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");

  const selectProductRef = useRef(null);
  const selectVersionRef = useRef(null);
  const windowRef = useRef(null);

  const dispatch = useDispatch();
  const productsData = useSelector((state) => state.product.modelsCSV);

  const { isAuthenticated, user, loading } = useSelector(state => state.user);

  const combineDatasets = (data1, data2) => {
    const combinedData = [];
  
    for (let i = 0; i < Math.max(data1.length, data2.length); i++) {
      const combinedItem = {
        x: i,  // Using a common index
        trainLoss: data1[i]?.loss || null,
        trainAcc: data1[i]?.acc || null,
        testLoss: data2[i]?.loss || null,
        testAcc: data2[i]?.acc || null,
      };
  
      combinedData.push(combinedItem);
    }
  
    return combinedData;
  };

  useEffect(() => {
    dispatch(homepage());
    dispatch(modelsCsv());
  }, [dispatch]);

  useEffect(()=>{
    M.FormSelect.init(selectProductRef.current, {});
    M.FormSelect.init(selectVersionRef.current, {});

    // let parallaxElems = document.querySelectorAll('.parallax');
    // M.Parallax.init(parallaxElems);
  })
  
  useEffect(() => {
    if (productsData.length > 0) {
      fetchAndParseCSV(productsData[0].train_csv, setData1);
      fetchAndParseCSV(productsData[0].test_csv, setData2);
    }
  }, [productsData]);

  useEffect(() => {
    if (data1.length > 0 || data2.length > 0) {
      const combinedData = combineDatasets(data1, data2);
      setData(combinedData);
    }
  }, [data1, data2]);

  const fetchAndParseCSV = async (csvURL, setData) => {
    try {
      const response = await fetch(csvURL);
      const csvData = await response.text();


      Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        complete: (result) => {
          // const data = result.data;
          const columnsToAverage = ['loss', 'acc'];
          const filteredData = calculateMovingAverages(result.data, columnsToAverage, window);
  
          setData(filteredData);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error.message);
        },
      });
      // Papa.parse(csvData, {
      //   header: true,
      //   dynamicTyping: true,
      //   complete: (result) => {
      //     const newData = result.data;
      //     const columnsToAverage = ['loss', 'acc'];
      //     const filteredData = calculateMovingAverages(newData, columnsToAverage, window);
      //     const mergedData = merge(data, filteredData); 
      //     setData(mergedData);
      //   },
      //   error: (error) => {
      //     console.error('Error parsing CSV:', error.message);
      //   },
      // });
    } catch (error) {
      console.error('Error fetching/parsing CSV:', error.message);
    }
  };

  const calculateMovingAverages = (data, columnsToAverage, windowSize) => {
    return data.map((row, index) => {
      if (index < windowSize - 1) {
        return row;
      }

      const averages = {};
      columnsToAverage.forEach(columnName => {
        const sum = data.slice(index - windowSize + 1, index + 1)
          .reduce((acc, currentRow) => acc + currentRow[columnName], 0);
  
        averages[columnName] = sum / windowSize;
      });

      return { ...row, ...averages };
    }).slice(windowSize - 1);
  };

  


  const handleProductSelect = (event) => {
    const selectedProduct = event.target.value;
    setSelectedProduct(selectedProduct);
    setSelectedVersion("");
  };

  const handleWindowChange = (event)=>{
    const selectedWindow = event.target.value;
    setWindow(selectedWindow);
  }

  const uniqueProducts = [...new Set(productsData.map(product => product.product))];
  const filteredVersions = productsData.filter(
    (product) => product.product === selectedProduct
    );  

  const selectVersion = (
    <div className="input-field col s12">
      <select
        value={selectedVersion}
        onChange={(event) => setSelectedVersion(event.target.value)}
        ref={selectVersionRef}
      >
        <option value="" disabled>Choose the version</option>
        {filteredVersions.map((product) => (
          <option key={product.id} value={product.version}>{product.version}</option>
        ))}
      </select>
    </div>
  );

  

  if (!isAuthenticated && !loading && user === null){
    M.toast({
        html: 'Please, sign in first.',
        classes: 'red rounded',
        displayLength: 5000
      });
      return <Navigate to='/login'/>;
    }


  const graphs = 
  <div>
    
    <label>choose window from moving average</label>
    <p className="range-field">
      <input 
        type="range" 
        min="0" 
        max="200" 
        onChange={handleWindowChange} 
        ref={windowRef}/>
      
    </p>

      <h3>Train phase</h3>
        {data1.length > 0 && (
          <div className="charts-container">
            <div className="chart">
              <LineChart
                width={800}
                height={400}
                data={data1}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
              <XAxis dataKey="x" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="loss" stroke="#8884d8" name="Loss" />
              <Line type="monotone" dataKey="acc" stroke="#82ca9d" name="Accuracy" />
        </LineChart>
      </div>
    </div>
  )}

  <h3>Test phase</h3>
  {data2.length > 0 && (
    <div className="charts-container">
      <div className="chart">
        <LineChart
          width={800}
          height={400}
          data={data2}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <XAxis dataKey="x" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="loss" stroke="#8884d8" name="Loss" />
          <Line type="monotone" dataKey="acc" stroke="#82ca9d" name="Accuracy" />
        </LineChart>
      </div>
    </div>
  )}  

{/* {
// (data1.length > 0 && data2.length > 0)
(data.length>0)
 && (
    <div className="charts-container">
      <div className="chart">
        <LineChart
          width={800}
          height={400}
          data={data} //combinedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <XAxis dataKey="x" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          <Legend />

          <Line type="monotone" dataKey="trainLoss" stroke="#8884d8" name="Train Loss" />
          <Line type="monotone" dataKey="trainAcc" stroke="#82ca9d" name="Train Accuracy" />
          <Line type="monotone" dataKey="testLoss" stroke="#ff0000" name="Test Loss" />
          <Line type="monotone" dataKey="testAcc" stroke="#00ff00" name="Test Accuracy" />
        </LineChart>
      </div>
    </div>
  )
  } */}
</div>

  return (
    <>
    <NavbarContainer/>
    <div className='container'>
      <h2 className='center'>Choose the product</h2>

      <div className="input-field col s12">
        <select defaultValue={""} onChange={handleProductSelect} ref={selectProductRef}>
          <option value="" disabled>Choose the product</option>
          {
            uniqueProducts.map((product, i) => (
              <option key={i} value={product}>{product}</option>
            ))
          }
        </select>
      </div>

      {selectedProduct && (<>{selectVersion}</>)}
        
      {selectedVersion && graphs}
    </div>
    </>
  );
};

export default Products;