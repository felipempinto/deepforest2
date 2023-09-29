const express = require('express');
const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

router.get('/api/users/verify', async (req,res) => {
    const { access,refresh } = req.cookies;
    // console.log("VERIFY")
    // console.log(access)
    // console.log(refresh)

    const body = JSON.stringify({
        token:refresh,//access
    });

    if (access) {
    try {
        const apiRes = await fetch(`${process.env.API_URL}/api/main/token/verify/`,{
            method: 'POST',
            headers: {
                Accept: 'application/json',
				'Content-Type': 'application/json',
                // Authorization: `Bearer ${access}`
            },
            body,
        });

        const data = await apiRes.json();
        // console.log("VERIFY2")
        // console.log(data)

        return res.status(apiRes.status).json(data);

    } catch (error) {
        return res.status(500).json({
            error:'Something went wrong when trying to verify login status',
        });
    }}
    //TODO: I need to solve the problem with the verify function.
    return res.status(200).json({'status':"not ok"})
});

module.exports = router;