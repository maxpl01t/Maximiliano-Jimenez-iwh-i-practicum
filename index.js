require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

const apiKey = process.env.HUBSPOT_API_KEY;

// Set up middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');

// Configure axios for HubSpot API
const hubspotClient = axios.create({
  baseURL: 'https://api.hubapi.com', // Or https://api.hubspot.com
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});

// Homepage route
app.get('/', async (req, res) => {
  try {
    console.log('Fetching company records...');

    // Using the exact same query as my successful cURL command to retreive specific properties from the custom object via API
    const response = await hubspotClient.get('/crm/v3/objects/doctors', {
      params: {
        limit: 20,
        properties: 'doctor_id,doctor_full_name,doctor_medical_specialty',
        archived: false
      }
    });

    console.log('API Response:', JSON.stringify(response.data, null, 2));

    const records = response.data.results || [];
    console.log(`Found ${records.length} doctor records`);

    // If we have records, log what properties they have
    if (records.length > 0) {
      console.log('First record properties:', Object.keys(records[0].properties));
    }

    res.render('homepage', {
      title: 'Doctor Records | Integrating With HubSpot I Practicum',
      records: records
    });
  } catch (error) {
    console.error('Error fetching doctor records:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    res.status(500).send('Error fetching doctor records. Check console for details.');
  }
});

// Form page route
app.get('/update-cobj', (req, res) => {
  res.render('updates', {
    title: 'Update Doctor Record Form | Integrating With HubSpot I Practicum'
  });
});

// Form submission route for update
app.post('/update-cobj', async (req, res) => {
  try {
    // Extract form data
    const { doctor_full_name, doctor_id, doctor_medical_specialty } = req.body;

    console.log('Creating new doctor record with data:', req.body);

    // Create properties object for the API request
    const properties = {
      doctor_full_name: doctor_full_name,
      doctor_id: doctor_id,
      doctor_medical_specialty: doctor_medical_specialty
    };

    // Create new doctor record
    const response = await hubspotClient.post('/crm/v3/objects/doctors', {
      properties: properties
    });

    console.log('Created new doctor record:', JSON.stringify(response.data, null, 2));

    // Redirect back to homepage
    res.redirect('/');
  } catch (error) {
    console.error('Error creating doctor record:', error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
    res.status(500).send('Error creating doctor record. Check console for details.');
  }
});

// View doctor details route
app.get('/view-doctor/:id', async (req, res) => {
  try {
    const doctorId = req.params.id;

    // Get doctor from API using the same format as my successful cURL command
    const response = await hubspotClient.get(`/crm/v3/objects/doctors/${doctorId}`, {
      params: {
        properties: 'doctor_full_name,doctor_medical_specialty,doctor_id',
        archived: false
      }
    });

    const doctorInfo = response.data.properties || {};

    res.render('doctor-details', {
      title: 'Doctor Details | Integrating With HubSpot I Practicum',
      doctorId: doctorId,
      doctor: doctorInfo
    });
  } catch (error) {
    console.error('Error fetching doctor details:', error.response ? error.response.data : error.message);

    res.render('doctor-details', {
      title: 'Doctor Details | Integrating With HubSpot I Practicum',
      doctorId: req.params.id,
      doctor: {
        doctor_full_name: 'Unknown',
        doctor_medical_specialty: 'Unknown',
        doctor_id: 'Unknown'
      },
      error: true
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
