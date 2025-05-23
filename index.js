// index.js

// 1. Load your environment variables from .env
require('dotenv').config();

// 2. Import axios
const axios = require('axios');

// 3. Read your API key
const API_KEY = process.env.API_KEY;

// 4. Define the base URL of the API
const BASE_URL = 'https://api.example.com/v1';

// 5. A function to fetch some data
async function fetchData() {
  try {
    // Make a GET request to, say, /users
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

// 6. A function to send (POST) some data
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

// 7. Run them!
fetchData();
postData();


