const express = require('express');
const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

router.post('/api/users/update', async (req, res) => {
    const { first_name,last_name,profile_picture} = req.body;
    const body = JSON.stringify({first_name,last_name,profile_picture});
    const { access } = req.cookies;

    console.log(req.body)

    try {
        const apiRes = await fetch(`${process.env.API_URL}/api/users/update/`,{
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type':'application/json',
                Authorization: `Bearer ${access}`,
            },
            body,
        });
        const data = await apiRes.json();
        return res.status(apiRes.status).json(data);
    } catch (error) {
        
        return res.status(500).json({
            error: 'Something went wrong when updating account',
        });
    }
});

module.exports = router;