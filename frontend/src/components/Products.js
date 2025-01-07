import React from "react";
import NavbarContainer from './includes/Navbar';
import { Container, Grid, Typography, Card, CardContent, CardMedia, Box, Table, TableBody, TableCell, TableHead, TableRow, Button } from "@mui/material";

const products = [
  {
    name: "Forest Mask",
    version: "0.0.0",
    description: "A deep learning model that detects and maps forested areas using Sentinel-2 satellite imagery. It identifies whether a pixel represents forest or non-forest based on labeled training data.",
    labels: [
      { value: 0, meaning: "No Forest", color: "gray" },
      { value: 1, meaning: "Forest", color: "green" },
    ],
    trainingInfo: "Trained with a dataset of forest cover and non-forest areas, curated from multiple sources, ensuring high accuracy.",
    image: "/ForestMask.png", 
    qmlLink:"/ForestMask.qml"
  },
  {
    name: "Land Cover",
    version: "0.0.0",
    description: "Classifies land cover types such as urban, water, vegetation, and bare soil. Built using Sentinel-2 imagery and advanced deep learning techniques.",
    labels: [
      { value: 0, meaning: "Water", color: "blue" },
      { value: 1, meaning: "Agriculture", color: "yellow" },
      { value: 2, meaning: "Native Forest", color: "darkgreen" },
      { value: 3, meaning: "Planted Forest", color: "lightgreen" },
      { value: 4, meaning: "Urban", color: "orange" },
    ],
    trainingInfo: "Developed using a diverse dataset of labeled land cover types, ensuring versatility across various regions.",
    image: "/LandCover.png", 
    qmlLink:"/LandCover.qml"
  },
];

const ProductPage = () => {
  return (
    <>
    <NavbarContainer />
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h3" gutterBottom align="center">
        Our Products
      </Typography>
      <Typography variant="body1" align="center" gutterBottom>
        Explore our deep learning-based products created using Sentinel-2 satellite images. Learn about each version and their class labels.
      </Typography>

      <Grid container spacing={4}>
        {products.map((product, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Card sx={{ height: "100%" }}>
              <CardMedia
                component="img"
                height="200"
                image={product.image}
                alt={product.name}
              />
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  {product.name} (v{product.version})
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {product.description}
                </Typography>

                <Typography variant="subtitle1" sx={{ fontWeight: "bold", marginTop: 2 }}>
                  Labels:
                </Typography>
                <Table size="small" sx={{ marginTop: 1 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Value</strong></TableCell>
                      <TableCell><strong>Meaning</strong></TableCell>
                      <TableCell><strong>Color</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {product.labels.map((label, labelIndex) => (
                      <TableRow key={labelIndex}>
                        <TableCell>{label.value}</TableCell>
                        <TableCell>{label.meaning}</TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              backgroundColor: label.color,
                              borderRadius: "50%",
                              display: "inline-block",
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ marginTop: 2 }}
                >
                  {product.trainingInfo}
                </Typography>
                <Box sx={{ marginTop: 2 }}>
                  <Button
                    variant="outlined"
                    href={product.qmlLink}
                    // onClick={downloadStyle(product.qmlLink)}
                    download
                    color="primary"
                  >
                    Download QML Style for QGIS
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Typography variant="body1" align="center" gutterBottom>
        Explore our deep learning-based products created using Sentinel-2 satellite images. Learn about each version and their class labels.
      </Typography>
      <Grid container spacing={4}>
        {products.map((product, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Box>
              {/* Product details omitted for brevity */}
              {/* Same as previously shown product card structure */}
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Additional Section */}
      <Box sx={{ marginTop: 8 }}>
        <Typography variant="h4" gutterBottom>
          About Our Products
        </Typography>
        <Typography variant="body1" paragraph>
          Our products are built using cutting-edge deep learning techniques applied to Sentinel-2 satellite imagery. 
          We currently use the <strong>UNet</strong> architecture, which is widely recognized for its efficiency in image segmentation tasks. 
          Future versions will incorporate more robust models to further enhance accuracy and scalability.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ marginTop: 4 }}>
          Versioning System
        </Typography>
        <Typography variant="body1" paragraph>
          Each product version represents a stage of development. 
          For instance:
          <ul>
            <li><strong>0.0.0</strong>: Initial versions, which are experimental and may not have been extensively tested.</li>
            <li><strong>1.0.0</strong>: Stable releases, fully tested and ready for broader use.</li>
            <li><strong>Future Versions</strong>: These might include expanded labels or updated model architectures.</li>
          </ul>
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ marginTop: 4 }}>
          Future Releases
        </Typography>
        <Typography variant="body1" paragraph>
          We are continuously improving our products by adding new features, training with advanced models, and incorporating more classes. 
          For example, a future version of the <strong>Land Cover</strong> product may include additional classes to differentiate more land types or specialized categories for specific regions.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ marginTop: 4 }}>
          User Contribution
        </Typography>
        <Typography variant="body1" paragraph>
          We value user feedback and encourage you to suggest new features or classes for upcoming versions. 
          Whether it's adding a specific land cover class or adapting the product for a particular use case, your input helps shape the future of these products.
        </Typography>
        <Button variant="contained" color="primary" sx={{ marginTop: 2 }}>
          Request a New Version
        </Button>
      </Box>
    </Container>
    </>
  );
};

export default ProductPage;



// import React, { useEffect, useState } from 'react';
// import NavbarContainer from './includes/Navbar';
// import { useDispatch, useSelector } from "react-redux";
// import { homepage } from "../features/main";
// import { modelsCsv } from "../features/products";
// import Papa from 'papaparse';
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
// } from "recharts";
// import { Navigate } from 'react-router-dom';
// import {
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   Slider,
//   Typography,
//   Box,
// } from '@mui/material';

// const Products = () => {
//   const [data1, setData1] = useState([]);
//   const [data2, setData2] = useState([]);
//   const [data, setData] = useState([]);
//   const [window, setWindow] = useState(10);
//   const [selectedProduct, setSelectedProduct] = useState("");
//   const [selectedVersion, setSelectedVersion] = useState("");

//   const dispatch = useDispatch();
//   const productsData = useSelector((state) => state.product.modelsCSV);

//   const { isAuthenticated, user, loading } = useSelector(state => state.user);

//   const combineDatasets = (data1, data2) => {
//     const combinedData = [];
//     for (let i = 0; i < Math.max(data1.length, data2.length); i++) {
//       const combinedItem = {
//         x: i,
//         trainLoss: data1[i]?.loss || null,
//         trainAcc: data1[i]?.acc || null,
//         testLoss: data2[i]?.loss || null,
//         testAcc: data2[i]?.acc || null,
//       };
//       combinedData.push(combinedItem);
//     }
//     return combinedData;
//   };

//   useEffect(() => {
//     dispatch(homepage());
//     dispatch(modelsCsv());
//   }, [dispatch]);

//   useEffect(() => {
//     if (productsData.length > 0) {
//       console.log(productsData)
//       fetchAndParseCSV(productsData[0].train_csv, setData1);
//       fetchAndParseCSV(productsData[0].test_csv, setData2);
//     }
//   }, [productsData]);

//   useEffect(() => {
//     if (data1.length > 0 || data2.length > 0) {
//       const combinedData = combineDatasets(data1, data2);
//       setData(combinedData);
//     }
//   }, [data1, data2]);

//   const fetchAndParseCSV = async (csvURL, setData) => {
//     try {
//       const response = await fetch(csvURL);
//       const csvData = await response.text();

//       Papa.parse(csvData, {
//         header: true,
//         dynamicTyping: true,
//         complete: (result) => {
//           const columnsToAverage = ['loss', 'acc'];
//           const filteredData = calculateMovingAverages(
//             result.data, 
//             columnsToAverage, 
//             window
//           );
//           setData(filteredData);
//         },
//         error: (error) => {
//           console.error('Error parsing CSV:', error.message);
//         },
//       });
//     } catch (error) {
//       console.error('Error fetching/parsing CSV:', error.message);
//     }
//   };

//   const calculateMovingAverages = (data, columnsToAverage, windowSize) => {
//     return data.map((row, index) => {
//       if (index < windowSize - 1) {
//         return row;
//       }
//       const averages = {};
//       columnsToAverage.forEach(columnName => {
//         const sum = data.slice(index - windowSize + 1, index + 1)
//           .reduce((acc, currentRow) => acc + currentRow[columnName], 0);
//         averages[columnName] = sum / windowSize;
//       });
//       return { ...row, ...averages };
//     }).slice(windowSize - 1);
//   };

//   const handleWindowChange = (event, value) => {
//     setWindow(value);
//   };

//   const uniqueProducts = [...new Set(productsData.map(product => product.product))];
//   const filteredVersions = productsData.filter(
//     (product) => product.product === selectedProduct
//   );

//   if (!isAuthenticated && !loading && user === null) {
//     return <Navigate to='/login' />;
//   }

//   return (
//     <>
//       <NavbarContainer />
//       <div className='container'>
//         <Typography variant="h4" align="center">Choose the product</Typography>

//         <Box marginY={3}>
//           <FormControl fullWidth>
//             <InputLabel>Choose the product</InputLabel>
//             <Select
//               value={selectedProduct}
//               onChange={(event) => setSelectedProduct(event.target.value)}
//             >
//               {uniqueProducts.map((product, i) => (
//                 <MenuItem key={i} value={product}>{product}</MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//         </Box>

//         {selectedProduct && (
//           <Box marginY={3}>
//             <FormControl fullWidth>
//               <InputLabel>Choose the version</InputLabel>
//               <Select
//                 value={selectedVersion}
//                 onChange={(event) => setSelectedVersion(event.target.value)}
//               >
//                 {filteredVersions.map((product) => (
//                   <MenuItem key={product.id} value={product.version}>{product.version}</MenuItem>
//                 ))}
//               </Select>
//             </FormControl>
//           </Box>
//         )}

//         {selectedVersion && (
//           <>
//             <Typography>Choose window for moving average</Typography>
//             <Slider
//               value={window}
//               min={0}
//               max={200}
//               onChange={handleWindowChange}
//               valueLabelDisplay="auto"
//             />

//             <Typography variant="h5">Train Phase</Typography>
//             {data1.length > 0 && (
//               <LineChart
//                 width={800}
//                 height={400}
//                 data={data1}
//                 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//               >
//                 <XAxis dataKey="x" />
//                 <YAxis />
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <Tooltip />
//                 <Legend />
//                 <Line type="monotone" dataKey="loss" stroke="#8884d8" name="Loss" />
//                 <Line type="monotone" dataKey="acc" stroke="#82ca9d" name="Accuracy" />
//               </LineChart>
//             )}

//             <Typography variant="h5">Test Phase</Typography>
//             {data2.length > 0 && (
//               <LineChart
//                 width={800}
//                 height={400}
//                 data={data2}
//                 margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
//               >
//                 <XAxis dataKey="x" />
//                 <YAxis />
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <Tooltip />
//                 <Legend />
//                 <Line type="monotone" dataKey="loss" stroke="#8884d8" name="Loss" />
//                 <Line type="monotone" dataKey="acc" stroke="#82ca9d" name="Accuracy" />
//               </LineChart>
//             )}
//           </>
//         )}
//       </div>
//     </>
//   );
// };

// export default Products;