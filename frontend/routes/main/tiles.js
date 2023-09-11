const express = require('express');
const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

router.post('/api/tiles/', async (req, res) => {
    const { product,date1,date2 } = req.body;

    const body = JSON.stringify({
        product,
        date1,
        date2
    });

    try {
        const apiRes = await fetch(`${process.env.API_URL}/api/main/tiles/`,{
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type':'application/json',
            },
            body,
        });
        const data = await apiRes.json();
        return res.status(apiRes.status).json(data);
    } catch (error) {
        return res.status(500).json({
            error: 'Something went wrong when registering account',
        });
    }
});

module.exports = router;