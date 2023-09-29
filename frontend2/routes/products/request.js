const express = require('express');
// const cookie = require('cookie');
const fetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args));

const router = express.Router();

router.post('/api/products/request/', async (req, res) => {
	console.log("REQUEST")
	const { access } = req.cookies;
	console.log(req.body);
	const {pth,bounds,date_requested,user} = req.body;

	const body = JSON.stringify({
		'pth':pth,
		'bounds':bounds,
		'date_requested':date_requested,
		'user':user
	}
	)
	console.log("BODY",body);
	try {
	  const apiRes = await fetch(`${process.env.API_URL}/api/products/requests/`, {
		method: 'POST',
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