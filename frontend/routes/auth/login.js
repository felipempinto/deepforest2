const express = require('express');
const cookie = require('cookie');
const fetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args));


const router = express.Router();

router.post('/api/users/login',async(req,res)=>{
	console.log("LOGIN")
    const {username,password} = req.body;

    const body = JSON.stringify({ username,password });

    try {
        const apiRes = await fetch(`${process.env.API_URL}/api/token/`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body,
		});

        const data = await apiRes.json();

        if (apiRes.status === 200) {
			res.setHeader('Set-Cookie', [
				cookie.serialize('access', data.access, {
					httpOnly: true,
					maxAge: 60 * 30,
					path: '/api/',
					sameSite: 'strict',
					secure: process.env.NODE_ENV === 'production',
				}),
				cookie.serialize('refresh', data.refresh, {
					httpOnly: true,
					maxAge: 60 * 60 * 24,
					path: '/api/',
					sameSite: 'strict',
					secure: process.env.NODE_ENV === 'production',
				}),
			]);

			return res.status(200).json({ success: 'Logged in successfully' });
		} else {
			console.log("ERROR 1");
			return res.status(apiRes.status).json(data);
        }
        
    } catch (error) {
		console.log("ERROR 2");
		console.log(error)
        return res.status(500).json({
			error: 'Something went wrong when logging in',
		});
    }
});

module.exports = router;