// index.js
require('dotenv').config();

const axios = require('axios');

const API_KEY = process.env.API_KEY;

const BASE_URL = 'https://api.example.com/v1';

async function fetchData() {
  try {
    const response = await axios.get(`${BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });
    console.log('Data from API:', response.data);
  } catch (err) {
    console.error('Error fetching data:', err.message);
  }
}

async function postData() {
  try {
    const payload = { name: 'Alice', email: 'alice@example.com' };
    const response = await axios.post(`${BASE_URL}/users`, payload, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Created user:', response.data);
  } catch (err) {
    console.error('Error posting data:', err.message);
  }
}

fetchData();
postData();


