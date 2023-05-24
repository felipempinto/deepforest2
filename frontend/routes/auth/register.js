const express = require('express');
const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));

const router = express.Router();

router.post('/api/users/register', async (req, res) => {
    console.log("REGISTER4");
    // const { first_name, last_name, email, password } = req.body;
    const { username, email, password, password2 } = req.body;

    const body = JSON.stringify({
        username,
        email,
        password,
        password2
        // first_name,
        // last_name,
        // email,
        // password,
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
        return res.status(500).json({
            error: 'Something went wrong when registering account',
        });
    }
});

module.exports = router;