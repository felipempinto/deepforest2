import React, { useState, useEffect } from "react";
import NavbarComponent from "./includes/Navbar";
import Footer from "./includes/Footer";
import { useDispatch,useSelector } from "react-redux";
import { homepage } from "../features/main";
import { models, train } from "../features/products";
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
  BarChart,
  Bar,
} from "recharts";

const Products = () => {

    const [data1, setData1] = useState([]);
    const [data2, setData2] = useState([]);
    const [data, setData] = useState([]);
    const [fileSelected, setFileSelected] = useState(false);

    const [productName,setProductName] = useState(null);
    const [productVersion,setProductVersion] = useState(null);

    const dispatch = useDispatch();
    const products = useSelector((state) => state.main.products);
    // const train = useSelector((state) => state.product.models);
    const productsData = useSelector((state) => state.product.models);
    console.log(productsData)
  
    useEffect(() => {
      dispatch(homepage());
      dispatch(models());
    }, [dispatch]);
  
    useEffect(() => {
      let parallaxElems = document.querySelectorAll('.parallax');
      M.Parallax.init(parallaxElems);
  
    }, [
      // products
    ])
  

    const fetchAndParseCSV = async (csvURL, setData) => {
      try {
        const response = await fetch(csvURL);
        const csvData = await response.text();
  
        const lines = csvData.split("\n");
        const header = lines[0].split(",");
        const parsedData = [];
  
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].split(",");
          const item = {};
  
          for (let j = 0; j < header.length; j++) {
            const key = header[j].trim();
            const value = line[j].trim();
            item[key] = value;
          }
  
          parsedData.push(item);
        }
  
        setData(parsedData);
      } catch (error) {
        console.error('Error fetching/parsing CSV:', error.message);
      }
    };
  
    useEffect(() => {
      // Assuming productsData array contains the URLs for CSV files
      if (productsData.length > 0) {
        fetchAndParseCSV(productsData[0].train_csv, setData1);
        fetchAndParseCSV(productsData[0].test_csv, setData2);
      }
    }, [productsData]);


    return(
    <>
        <NavbarComponent />
        <div className="container section">
            <h1>Graphs</h1>
            {products.map((product,index)=>{
                var a = product.name;
                return(
                    <h5>{a}</h5>
                )
            })}


            {/* {productsData.map((t,index)=>{
                var a = t.product;
                return(
                    <p>{a}</p>
                )
            })} */}
        

        {data1.length > 0 && data2.length > 0 && (
          <div className="charts-container">
            
            <div className="chart">
              <LineChart
                width={500}
                height={300}
                data={data1}
                margin={{
                  top: 5,
                  right: 30,
                  left: 0,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="yourXAxisKey" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="yourDataKey" stroke="#8884d8" />
              </LineChart>
            </div>

        
            <div className="chart">
              <BarChart width={500} height={300} data={data2}>
                <XAxis dataKey="yourXAxisKey" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Bar dataKey="yourDataKey" fill="#8884d8" />
              </BarChart>
            </div>
          </div>
        )}

        </div>
        <Footer />
    </>
    )
}


export default Products