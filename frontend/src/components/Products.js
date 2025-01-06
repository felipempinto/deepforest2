import React, { useEffect, useState } from 'react';
import NavbarContainer from './includes/Navbar';
import { useDispatch, useSelector } from "react-redux";
import { homepage } from "../features/main";
import { modelsCsv } from "../features/products";
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
import { Navigate } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Box,
} from '@mui/material';

const Products = () => {
  const [data1, setData1] = useState([]);
  const [data2, setData2] = useState([]);
  const [data, setData] = useState([]);
  const [window, setWindow] = useState(10);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVersion, setSelectedVersion] = useState("");

  const dispatch = useDispatch();
  const productsData = useSelector((state) => state.product.modelsCSV);

  const { isAuthenticated, user, loading } = useSelector(state => state.user);

  const combineDatasets = (data1, data2) => {
    const combinedData = [];
    for (let i = 0; i < Math.max(data1.length, data2.length); i++) {
      const combinedItem = {
        x: i,
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
          const columnsToAverage = ['loss', 'acc'];
          const filteredData = calculateMovingAverages(result.data, columnsToAverage, window);
          setData(filteredData);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error.message);
        },
      });
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

  const handleWindowChange = (event, value) => {
    setWindow(value);
  };

  const uniqueProducts = [...new Set(productsData.map(product => product.product))];
  const filteredVersions = productsData.filter(
    (product) => product.product === selectedProduct
  );

  if (!isAuthenticated && !loading && user === null) {
    return <Navigate to='/login' />;
  }

  return (
    <>
      <NavbarContainer />
      <div className='container'>
        <Typography variant="h4" align="center">Choose the product</Typography>

        <Box marginY={3}>
          <FormControl fullWidth>
            <InputLabel>Choose the product</InputLabel>
            <Select
              value={selectedProduct}
              onChange={(event) => setSelectedProduct(event.target.value)}
            >
              {uniqueProducts.map((product, i) => (
                <MenuItem key={i} value={product}>{product}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {selectedProduct && (
          <Box marginY={3}>
            <FormControl fullWidth>
              <InputLabel>Choose the version</InputLabel>
              <Select
                value={selectedVersion}
                onChange={(event) => setSelectedVersion(event.target.value)}
              >
                {filteredVersions.map((product) => (
                  <MenuItem key={product.id} value={product.version}>{product.version}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {selectedVersion && (
          <>
            <Typography>Choose window for moving average</Typography>
            <Slider
              value={window}
              min={0}
              max={200}
              onChange={handleWindowChange}
              valueLabelDisplay="auto"
            />

            <Typography variant="h5">Train Phase</Typography>
            {data1.length > 0 && (
              <LineChart
                width={800}
                height={400}
                data={data1}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="x" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="loss" stroke="#8884d8" name="Loss" />
                <Line type="monotone" dataKey="acc" stroke="#82ca9d" name="Accuracy" />
              </LineChart>
            )}

            <Typography variant="h5">Test Phase</Typography>
            {data2.length > 0 && (
              <LineChart
                width={800}
                height={400}
                data={data2}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="x" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="loss" stroke="#8884d8" name="Loss" />
                <Line type="monotone" dataKey="acc" stroke="#82ca9d" name="Accuracy" />
              </LineChart>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Products;
