const express = require('express');
// const cookie = require('cookie');
const fetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args));


const router = express.Router();

router.get('/api/products/geojsondata/', async (req, res) => {
	console.log("GEOJSONDATA")
	const { access } = req.cookies;

    const {geojsondata} = req.body;
    const body = JSON.stringify({ geojsondata });

	try {
	  const apiRes = await fetch(`${process.env.API_URL}/api/products/geojsondata/`, {
		method: 'GET',
		headers: {
		  Accept: 'application/json',
		  Authorization: `Bearer ${access}`,
		  'Content-Type': 'application/json',
		},
        body,
	  });
  
	  const data = await apiRes.json();
  
	  return res.status(apiRes.status).json(data);
	} catch (error) {
	  return res.status(500).json({
		error: 'Something went wrong when getting products',
	  });
	}
  });
module.exports = router;