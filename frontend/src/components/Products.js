import React, { useState, useEffect } from "react";
import NavbarComponent from "./includes/Navbar";
import Footer from "./includes/Footer";
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

const Products = () => {
  const [data1, setData1] = useState([]);
  const [data2, setData2] = useState([]);
  const [productName, setProductName] = useState(null);
  const [productVersion, setProductVersion] = useState(null);

  const dispatch = useDispatch();
  const productsData = useSelector((state) => state.product.modelsCSV);

  useEffect(() => {
    dispatch(homepage());
    dispatch(modelsCsv());
  }, [dispatch]);

  useEffect(() => {
    let parallaxElems = document.querySelectorAll('.parallax');
    M.Parallax.init(parallaxElems);
  }, []);

  const fetchAndParseCSV = async (csvURL, setData) => {
    try {
      const response = await fetch(csvURL);
      const csvData = await response.text();

      Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        complete: (result) => {
          setData(result.data);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error.message);
        },
      });
    } catch (error) {
      console.error('Error fetching/parsing CSV:', error.message);
    }
  };

  useEffect(() => {
    if (productsData.length > 0) {
      fetchAndParseCSV(productsData[0].train_csv, setData1);
      fetchAndParseCSV(productsData[0].test_csv, setData2);
    }
  }, [productsData]);

  return (
    <>
      <NavbarComponent />
      <div className="container section">
        <h1>Graphs</h1>
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
      </div>
      <Footer />
    </>
  );
};

export default Products;