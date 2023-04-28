const express = require('express');
const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

router.get('/api/users/verify', async (req,res) => {
    const { access,refresh } = req.cookies;
    // console.log("VERIFY")
    // console.log(access)
    console.log(refresh)
    const body = JSON.stringify({
        token:refresh,//access
    });
    try {
        const apiRes = await fetch(`${process.env.API_URL}/api/token/verify/`,{
            method: 'POST',
            headers: {
                Accept: 'application/json',
				'Content-Type': 'application/json',
            },
            body,
        });

        const data = await apiRes.json();
        console.log(data)
        console.log("VERIFY2")

        return res.status(apiRes.status).json(data);

    } catch (error) {
        return res.status(500).json({
            error:'Something went wrong when trying to verify login status',
        });
    }
});

module.exports = router;