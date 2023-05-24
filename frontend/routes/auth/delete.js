const express = require('express');
const fetch = (...args) => 
    import('node-fetch').then(({ default:fetch }) => fetch(...args));

const router = express.Router();

router.delete('/api/users/delete/:id', async (req,res) => {
    console.log("DELETE")
    const { id } = req.params;
    const { access } = req.cookies;

    try {
        const apiRes = await fetch(`${process.env.API_URL}/api/users/delete/${id}`,{
            method:'DELETE',
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${access}`
            },
        });
        const data = await apiRes.json();

        return res.status(apiRes.status).json(data);
    }
    catch (err) {
        return res.status(500).json({
            error: 'Something went wrong when trying to retrieve user'
        });
    }
});

module.exports = router;