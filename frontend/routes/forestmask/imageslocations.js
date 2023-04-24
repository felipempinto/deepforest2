const express = require('express');
// const cookie = require('cookie');
const fetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args));


const router = express.Router();

router.get('/api/forestmask/images-location/', async (req, res) => {
	try {
	  const apiRes = await fetch(`${process.env.API_URL}/api/forestmask/images-location/`, {
		method: 'GET',
		headers: {
		  Accept: 'application/json',
		  'Content-Type': 'application/json',
		},
	  });
  
	  const data = await apiRes.json();
  
	  return res.status(apiRes.status).json(data);
	} catch (error) {
	  console.log(error);
	  return res.status(500).json({
		error: 'Something went wrong when getting Images location for Forest mask',
	  });
	}
  });
module.exports = router;