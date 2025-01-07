import React, { useEffect } from 'react';
import { Link } from "@mui/material";
import { useDispatch, useSelector } from 'react-redux';
import { Box, Grid, Card, CardContent, CardMedia, Typography, Button, Container } from '@mui/material';
import NavbarComponent from './includes/Navbar';
import Footer from './includes/Footer';
import { homepage } from '../features/main';
import { lighten, darken } from '@mui/system';
import './Homepage.css';

const Homepage = () => {
    const dispatch = useDispatch();
    const products = useSelector((state) => state.main.products);

    useEffect(() => {
        dispatch(homepage());
    }, [dispatch]);

    const text1 = `This website has been developed with the primary objective of implementing deep 
    learning models specifically tailored for analyzing satellite images, with a particular focus 
    on forests. The website is currently undergoing various phases of development, and the version 
    you are currently accessing is 0.0.2. Kindly take note of this as you navigate through the site.`;

    const versions = {
        'Version 0.0.1': `In this initial version, the website offers a single product known as the "Forest Mask." To utilize this product, users are required to input a satellite image captured by Sentinel 2, consisting of four bands (B, G, R, NIR). This version represents the simplest iteration of the website and does not necessitate the search for input images to execute the model. The website has been constructed entirely using Django, with the incorporation of Materialize CSS to enhance the aesthetics of the webpages.`,
        'Version 0.0.2': `With the introduction of version 0.0.2, a second product known as "Land Cover" has been added, which incorporates four distinct classes. Notably, users are now only required to specify the desired location from which they would like to retrieve the dataset. However, please be aware that due to the nascent stage of these products, there are certain limitations on processing large datasets.`,
        'Future versions': `In upcoming versions, the objective is to enable the processing of substantial datasets based on input vector files provided by clients. This will enhance the versatility and scalability of the website's capabilities.`,
        'Version 1.0.0': `The forthcoming official release, denoted as 1.0.0, will encompass comprehensive precision calculations for all products. Additionally, prices will be implemented to facilitate payments on the website, ensuring a seamless user experience.`,
    };

    return (
        <Box className="home">
            <NavbarComponent />

            <Box
                className="parallax"
                // sx={{
                //     position: 'relative',
                //     backgroundImage: `url(${process.env.PUBLIC_URL}/michele-purin-uWJo5rEhvo4-unsplash.jpg)`,
                //     backgroundSize: 'cover',
                //     backgroundPosition: 'center',
                //     height: '1080px',
                // }}
                sx={{
                    backgroundImage: `url(${process.env.PUBLIC_URL}/michele-purin-uWJo5rEhvo4-unsplash.jpg)`,
                    height: '800px',
                }}
            >
                <Box
                    className="parallax-content"
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        textAlign: 'center',
                    }}
                >
                    <Typography variant="h1">Deep Forest</Typography>
                    <Typography variant="subtitle1">
                        <b>
                            Unlock the Power of Deep Learning for Forestry
                        </b>
                    </Typography>
                    <Button
                        variant="contained"
                        href="/request"
                        sx={{
                            mt: 2,
                            backgroundImage: 'linear-gradient(to right, #c4a197d0, #92564bc5)',
                            paddingLeft: '50px',
                            paddingRight: '50px',
                            color: 'white',
                            '&:hover': {
                            backgroundImage: 'linear-gradient(to right, #b38a87d0, #814c44c5)', // Optional hover effect
                            },
                        }}
                        >
                        Explore
                    </Button>
                </Box>
            </Box>
            <Box sx={{ 
                py: 4, 
                backgroundColor: "hsla( 10.6508875739645,73.79912663755458%,55.09803921568628% ,1)" 
                }}>
                <Container>
                <Typography 
                    variant="h4" 
                    align="center" 
                    gutterBottom 
                    sx={{ color: 'white' }} 
                >
                    How it Works
                </Typography>
                <Typography 
                    variant="body1" 
                    align="center" 
                    sx={{ color: 'white', mx: 4, mb: 4 }} 
                >
                    {text1}
                </Typography>

                <Grid container spacing={3} justifyContent="center">
                    {Object.entries(versions).map(([key, value]) => (
                        <Grid item xs={12} sm={6} md={3} key={key}>
                            <Card
                                elevation={key === 'Version 0.0.2' ? 10 : 3}
                                sx={{
                                    bgcolor:
                                        key === 'Version 0.0.2'
                                        ? lighten('#808080', 0.3)
                                        : darken('#808080', 0.3), 
                                    color: 'white',
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        {key}
                                    </Typography>
                                    <Typography variant="body2">{value}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
                </Container>
            </Box>
            <Box
                sx={{
                    backgroundImage: `url(${process.env.PUBLIC_URL}/IMG_2694.JPG)`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '600px',
                }}
                className="parallax"
            />

            <Box sx={{ py: 4 }}>
                <Typography variant="h4" align="center" gutterBottom>
                <Link href="/products" underline="hover" color="inherit">
                    Products
                </Link>
                </Typography>
                <Grid container spacing={4}>
                    {products.map((product) => (
                        <Grid item xs={12} sm={6} key={product.id}>
                            <Card>
                                <CardMedia
                                    component="img"
                                    height="500"
                                    image={product.image}
                                    alt={product.name}
                                />
                                <CardContent>
                                    <Typography variant="h6">{product.name}</Typography>
                                    <Typography variant="body2">{product.description}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <Footer />
        </Box>
    );
};

export default Homepage;
