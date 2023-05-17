const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args));

const router = express.Router();

router.get('/api/products/request/user', async (req, res) => {
    console.log("GET REQUESTS")
	const { access } = req.cookies;
	try {
	  const apiRes = await fetch(`${process.env.API_URL}/api/products/requests/user/`, {
		method: 'GET',
		headers: {
		  Accept: 'application/json',
		  Authorization: `Bearer ${access}`,
		  'Content-Type': 'application/json',
		},
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