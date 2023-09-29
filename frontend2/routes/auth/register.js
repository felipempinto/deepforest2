const express = require('express');
const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

router.post('/api/users/register', async (req, res) => {
    const { username, email, password, password2 } = req.body;

    const body = JSON.stringify({
        username,
        email,
        password,
        password2
    });
    console.log(body);

    try {
        const apiRes = await fetch(`${process.env.API_URL}/api/users/register/`,{
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
        const errorMessage = await error.response.text();
        return res.status(500).json({
            error: errorMessage || 'Something went wrong when registering account',
          });
        // return res.status(500).json({
        //     error: 'Something went wrong when registering account',
        // });
    }
});

module.exports = router;