const express = require('express');
const cookie = require('cookie');

const router = express.Router();

router.get('/api/users/logout',(req,res)=>{
    console.log("LOGOUT")
    res.setHeader('Set-Cookie',[
        cookie.serialize('access','',{
            httpOnly:true,
            expires: new Date(0),
            path: '/api/',
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
        }),
        cookie.serialize('refresh','',{
            httpOnly:true,
            expires: new Date(0),
            path: '/api/',
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
        })
    ]);

    return res.status(200).json({sucess:'Logged out successfully'});
});

module.exports = router;
