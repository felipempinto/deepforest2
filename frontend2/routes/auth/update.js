const express = require('express');
const fetch = (...args) =>
	import('node-fetch').then(({ default: fetch }) => fetch(...args));
const FormData = require('form-data');
const router = express.Router();

router.post('/api/users/update', async (req, res) => {
    const { first_name, last_name } = req.body;
    const profile_picture = req.files && req.files.profile_picture; // Assuming you're using a file upload middleware
    console.log(profile_picture)
    const formData = new FormData();
    formData.append('first_name', first_name);
    formData.append('last_name', last_name);
    if (profile_picture) {
      formData.append('profile_picture', profile_picture.data.toString('base64'), profile_picture.name);
    }
  
    const { access } = req.cookies;
  
    try {
      const apiRes = await fetch(`${process.env.API_URL}/api/users/update/`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${access}`,
        },
        body: formData,
      });
      const data = await apiRes.json();
      return res.status(apiRes.status).json(data);
    } catch (error) {
      return res.status(500).json({
        error: 'Something went wrong when updating the account',
      });
    }
  });
  
  module.exports = router;