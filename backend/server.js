// Load environment variables
require('dotenv').config();

// Import Express and other modules
const express = require('express');
//the import below is to protect against DDOS or bruteforce attacks
const rateLimit = require('express-rate-limit');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();

app.set('trust proxy', 1);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Load credentials from environment variables
const SQUARE_APP_ID = process.env.SQUARE_APPLICATION_ID;
const SQUARE_APP_SECRET = process.env.SQUARE_APPLICATION_SECRET;
const DOMAIN = process.env.DOMAIN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Load tokens (hybrid approach)
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

// Function to save tokens to file
function saveTokens(tokens) {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    console.log('✅ Tokens saved to tokens.json');
    console.log('\n⚠️  IMPORTANT FOR RAILWAY DEPLOYMENT:');
    console.log('If running on Railway, you must manually update these environment variables:');
    console.log('  SQUARE_ACCESS_TOKEN =', tokens.access_token);
    console.log('  SQUARE_REFRESH_TOKEN =', tokens.refresh_token);
    console.log('  MERCHANT_ID =', tokens.merchant_id);
    console.log('Otherwise tokens will be lost on server restart!\n');
  } catch (error) {
    console.error('❌ Error saving tokens:', error);
  }
}

// Function to load tokens from file
function loadTokens() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, 'utf8');
      const tokens = JSON.parse(data);
      console.log('✅ Tokens loaded from tokens.json');
      return tokens;
    }
  } catch (error) {
    console.error('❌ Error loading tokens:', error);
  }
  return null;
}

// Load tokens on server start (hybrid approach)
const storedTokens = loadTokens();
let SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || storedTokens?.access_token || null;
let REFRESH_TOKEN = process.env.SQUARE_REFRESH_TOKEN || storedTokens?.refresh_token || null;
let MERCHANT_ID = process.env.MERCHANT_ID || storedTokens?.merchant_id || null;

console.log('DOMAIN value:', DOMAIN);
console.log('Full redirect URI:', `${DOMAIN}/callback`);
console.log('Access token loaded:', SQUARE_ACCESS_TOKEN ? '✅ Yes' : '❌ No');
console.log('Token source:', process.env.SQUARE_ACCESS_TOKEN ? 'Environment variables (secure)' : 'tokens.json (local dev)');

// ===== RATE LIMITING =====

// Rate limiter for API endpoints (prevent scraping/DDoS)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for admin routes (prevent brute force)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Too Many Attempts</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            padding: 20px;
            text-align: center;
          }
          .error {
            color: #d32f2f;
          }
        </style>
      </head>
      <body>
        <h1>🚫 Too Many Attempts</h1>
        <p class="error">Too many password attempts from your IP address.</p>
        <p>Please try again in 15 minutes.</p>
      </body>
      </html>
    `);
  },
});

// ===== STATIC FILES =====
// Serve static files from parent directory
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/img', express.static(path.join(__dirname, '../img')));
app.use('/components', express.static(path.join(__dirname, '../components')));

// ===== PAGE ROUTES =====
// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/index.html'));
});

// Other page routes
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/index.html'));
});

app.get('/book_now', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/book_now.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/pricing_services.html'));
});

app.get('/training', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/training.html'));
});

app.get('/first_visit', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/first_visit.html'));
});

app.get('/skin_care', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/skin_care.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../pages/contact.html'));
});

// ===== SQUARE OAUTH ROUTES =====

// Admin-only route: Connect Square Account (Password Protected)
app.get('/connect-square', adminLimiter, (req, res) => {
  const providedPassword = req.query.password;

  // Check if password is correct
  if (providedPassword !== ADMIN_PASSWORD) {
    res.status(401).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Access Denied</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            padding: 20px;
            text-align: center;
          }
          .error {
            color: #d32f2f;
            margin: 20px 0;
          }
          input {
            padding: 10px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 5px;
            width: 200px;
            margin: 10px;
          }
          button {
            background-color: #006aff;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
          }
          button:hover {
            background-color: #0051cc;
          }
        </style>
      </head>
      <body>
        <h1>🔒 Admin Access Required</h1>
        ${providedPassword ? '<p class="error">❌ Incorrect password. Please try again.</p>' : '<p>Enter the admin password to continue.</p>'}
        
        <form method="GET" action="/connect-square">
          <input type="password" name="password" placeholder="Enter password" required autofocus>
          <br>
          <button type="submit">Submit</button>
        </form>
      </body>
      </html>
    `);
    return;
  }

  // Password is correct - show Square authorization page
  const redirectUri = `${DOMAIN}/callback`;
  const authUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${SQUARE_APP_ID}&scope=MERCHANT_PROFILE_READ+APPOINTMENTS_READ+APPOINTMENTS_ALL_READ+ITEMS_READ&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Connect Square Account</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 100px auto;
          padding: 20px;
          text-align: center;
        }
        .button {
          background-color: #006aff;
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 5px;
          font-size: 16px;
          display: inline-block;
          margin-top: 20px;
        }
        .button:hover {
          background-color: #0051cc;
        }
      </style>
    </head>
    <body>
      <h1>Square Integration Setup</h1>
      <p>To display your appointment availability, we need to connect to your Square Appointments account.</p>
      <p>Click the button below to authorize this application.</p>
      <a href="${authUrl}" class="button">Connect Square Account</a>
    </body>
    </html>
  `);
});

// Square OAuth callback
app.get('/callback', (req, res) => {
  const authorizationCode = req.query.code;

  if (!authorizationCode) {
    res.status(400).send('Error: No authorization code received');
    return;
  }

  // Prepare data to send to Square
  const tokenData = JSON.stringify({
    client_id: SQUARE_APP_ID,
    client_secret: SQUARE_APP_SECRET,
    code: authorizationCode,
    grant_type: 'authorization_code',
    redirect_uri: `${DOMAIN}/callback`,
  });

  // Options for the HTTPS request to Square
  const options = {
    hostname: 'connect.squareup.com',
    path: '/oauth2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': tokenData.length,
    },
  };

  // Make the request to Square
  const squareReq = https.request(options, (squareRes) => {
    let responseData = '';

    squareRes.on('data', (chunk) => {
      responseData += chunk;
    });

    squareRes.on('end', () => {
      const result = JSON.parse(responseData);

      if (result.access_token) {
        console.log('✅ Access token received!');
        console.log('Merchant ID:', result.merchant_id);

        // Save tokens to file
        const tokens = {
          access_token: result.access_token,
          refresh_token: result.refresh_token,
          merchant_id: result.merchant_id,
          expires_at: result.expires_at,
          created_at: new Date().toISOString(),
        };

        saveTokens(tokens);

        // Update in-memory tokens
        SQUARE_ACCESS_TOKEN = result.access_token;
        REFRESH_TOKEN = result.refresh_token;
        MERCHANT_ID = result.merchant_id;

        res.send(`
          <!DOCTYPE html>
          <html>
          <head><title>Success!</title></head>
          <body>
            <h1>✅ Successfully Connected to Square!</h1>
            <p>Your Square account has been authorized.</p>
            <p>Merchant ID: ${result.merchant_id}</p>
          </body>
          </html>
        `);
      } else {
        console.error('❌ Error:', result);
        res.status(500).send('Error: ' + JSON.stringify(result));
      }
    });
  });

  squareReq.on('error', (error) => {
    console.error('Square request error:', error);
    res.status(500).send('Error connecting to Square');
  });

  squareReq.write(tokenData);
  squareReq.end();
});

// ===== API ROUTES =====

// API: Get services from Square Catalog
app.get('/api/services', apiLimiter, (req, res) => {
  const accessToken = SQUARE_ACCESS_TOKEN;

  if (!accessToken) {
    res.status(401).json({
      error: 'No access token found. Please authorize first.',
    });
    return;
  }

  // Search for all items (services) in the catalog
  const catalogData = JSON.stringify({
    object_types: ['ITEM'],
  });

  const catalogOptions = {
    hostname: 'connect.squareup.com',
    path: '/v2/catalog/search',
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Square-Version': '2025-07-16',
      'Content-Type': 'application/json',
      'Content-Length': catalogData.length,
    },
  };

  const catalogReq = https.request(catalogOptions, (catalogRes) => {
    let catalogResponseData = '';

    catalogRes.on('data', (chunk) => {
      catalogResponseData += chunk;
    });

    catalogRes.on('end', () => {
      const catalogResult = JSON.parse(catalogResponseData);

      // Process and organize the services
      const services = [];

      if (catalogResult.objects) {
        catalogResult.objects.forEach((item) => {
          if (item.type === 'ITEM' && item.item_data) {
            const itemData = item.item_data;

            // Get variations (different pricing options)
            const variations = [];
            if (itemData.variations) {
              itemData.variations.forEach((variation) => {
                variations.push({
                  id: variation.id,
                  name: variation.item_variation_data.name,
                  price: variation.item_variation_data.price_money
                    ? variation.item_variation_data.price_money.amount / 100
                    : 0,
                });
              });
            }

            services.push({
              id: item.id,
              name: itemData.name,
              description: itemData.description || '',
              category: itemData.category_id || 'uncategorized',
              variations: variations,
            });
          }
        });
      }

      res.json({ services: services });
    });
  });

  catalogReq.on('error', (error) => {
    console.error('Catalog request error:', error);
    res.status(500).json({ error: 'Error fetching services' });
  });

  catalogReq.write(catalogData);
  catalogReq.end();
});

// API: Get availability from Square
app.get('/api/availability', apiLimiter, (req, res) => {
  const accessToken = SQUARE_ACCESS_TOKEN;
  const merchantId = MERCHANT_ID;

  if (!accessToken) {
    res.status(401).json({
      error: 'No access token found. Please authorize first.',
    });
    return;
  }

  // Get date range from query params or use defaults (next 30 days)
  const startDate = req.query.start_date
    ? new Date(req.query.start_date)
    : new Date();
  const endDate = req.query.end_date
    ? new Date(req.query.end_date)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // First, get locations
  const locationsOptions = {
    hostname: 'connect.squareup.com',
    path: '/v2/locations',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Square-Version': '2025-07-16',
    },
  };

  const locationsReq = https.request(locationsOptions, (locationsRes) => {
    let locationsData = '';

    locationsRes.on('data', (chunk) => {
      locationsData += chunk;
    });

    locationsRes.on('end', () => {
      const locationsResult = JSON.parse(locationsData);
      const locationId = locationsResult.locations?.[0]?.id;

      if (!locationId) {
        res.status(500).json({ error: 'No location found' });
        return;
      }

      // Get catalog items to find service variation IDs
      const catalogData = JSON.stringify({
        object_types: ['ITEM'],
      });

      const catalogOptions = {
        hostname: 'connect.squareup.com',
        path: '/v2/catalog/search',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Square-Version': '2025-07-16',
          'Content-Type': 'application/json',
          'Content-Length': catalogData.length,
        },
      };

      const catalogReq = https.request(catalogOptions, (catalogRes) => {
        let catalogResponseData = '';

        catalogRes.on('data', (chunk) => {
          catalogResponseData += chunk;
        });

        catalogRes.on('end', () => {
          const catalogResult = JSON.parse(catalogResponseData);

          // Extract service variation IDs
          const serviceVariationIds = [];
          if (catalogResult.objects) {
            catalogResult.objects.forEach((item) => {
              if (
                item.type === 'ITEM' &&
                item.item_data &&
                item.item_data.variations
              ) {
                item.item_data.variations.forEach((variation) => {
                  serviceVariationIds.push(variation.id);
                });
              }
            });
          }

          if (serviceVariationIds.length === 0) {
            res.json({ availabilities: [] });
            return;
          }

          // Now search for availability
          const availabilityRequestData = JSON.stringify({
            query: {
              filter: {
                start_at_range: {
                  start_at: startDate.toISOString(),
                  end_at: endDate.toISOString(),
                },
                location_id: locationId,
                segment_filters: serviceVariationIds.map((id) => ({
                  service_variation_id: id,
                })),
              },
            },
          });

          const availabilityOptions = {
            hostname: 'connect.squareup.com',
            path: '/v2/bookings/availability/search',
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Square-Version': '2025-07-16',
              'Content-Type': 'application/json',
              'Content-Length': availabilityRequestData.length,
            },
          };

          const availabilityReq = https.request(
            availabilityOptions,
            (availabilityRes) => {
              let availabilityResponseData = '';

              availabilityRes.on('data', (chunk) => {
                availabilityResponseData += chunk;
              });

              availabilityRes.on('end', () => {
                const availabilityData = JSON.parse(availabilityResponseData);
                res.json(availabilityData);
              });
            }
          );

          availabilityReq.on('error', (error) => {
            console.error('Availability request error:', error);
            res.status(500).json({ error: 'Error fetching availability' });
          });

          availabilityReq.write(availabilityRequestData);
          availabilityReq.end();
        });
      });

      catalogReq.on('error', (error) => {
        console.error('Catalog request error:', error);
        res.status(500).json({ error: 'Error fetching services' });
      });

      catalogReq.write(catalogData);
      catalogReq.end();
    });
  });

  locationsReq.on('error', (error) => {
    console.error('Locations request error:', error);
    res.status(500).json({ error: 'Error fetching locations' });
  });

  locationsReq.end();
});

// API: Get calendar data (bookings + availability)
app.get('/api/calendar', apiLimiter,(req, res) => {
  const accessToken = SQUARE_ACCESS_TOKEN;
  const merchantId = MERCHANT_ID;

  if (!accessToken) {
    res.status(401).json({
      error: 'No access token found. Please authorize first.',
    });
    return;
  }

  // Get date range (next 30 days by default)
  const startDate = new Date();
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  let bookingsData = null;
  let availabilityData = null;
  let requestsComplete = 0;

  function checkComplete() {
    requestsComplete++;
    if (requestsComplete === 2) {
      res.json({
        bookings: bookingsData,
        availability: availabilityData,
      });
    }
  }

  // Fetch bookings
  const bookingsOptions = {
    hostname: 'connect.squareup.com',
    path: `/v2/bookings?limit=100`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Square-Version': '2025-07-16',
    },
  };

  const bookingsReq = https.request(bookingsOptions, (bookingsRes) => {
    let bookingsResponseData = '';

    bookingsRes.on('data', (chunk) => {
      bookingsResponseData += chunk;
    });

    bookingsRes.on('end', () => {
      bookingsData = JSON.parse(bookingsResponseData);
      checkComplete();
    });
  });

  bookingsReq.on('error', (error) => {
    console.error('Bookings request error:', error);
    bookingsData = { error: 'Error fetching bookings' };
    checkComplete();
  });

  bookingsReq.end();

  // Fetch availability (reuse same logic as /api/availability)
  // First get locations
  const locationsOptions = {
    hostname: 'connect.squareup.com',
    path: '/v2/locations',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Square-Version': '2025-07-16',
    },
  };

  const locationsReq = https.request(locationsOptions, (locationsRes) => {
    let locationsData = '';

    locationsRes.on('data', (chunk) => {
      locationsData += chunk;
    });

    locationsRes.on('end', () => {
      const locationsResult = JSON.parse(locationsData);
      const locationId = locationsResult.locations?.[0]?.id;

      if (!locationId) {
        availabilityData = { error: 'No location found' };
        checkComplete();
        return;
      }

      // Get catalog to find service IDs
      const catalogData = JSON.stringify({
        object_types: ['ITEM'],
      });

      const catalogOptions = {
        hostname: 'connect.squareup.com',
        path: '/v2/catalog/search',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Square-Version': '2025-07-16',
          'Content-Type': 'application/json',
          'Content-Length': catalogData.length,
        },
      };

      const catalogReq = https.request(catalogOptions, (catalogRes) => {
        let catalogResponseData = '';

        catalogRes.on('data', (chunk) => {
          catalogResponseData += chunk;
        });

        catalogRes.on('end', () => {
          const catalogResult = JSON.parse(catalogResponseData);
          const serviceVariationIds = [];

          if (catalogResult.objects) {
            catalogResult.objects.forEach((item) => {
              if (
                item.type === 'ITEM' &&
                item.item_data &&
                item.item_data.variations
              ) {
                item.item_data.variations.forEach((variation) => {
                  serviceVariationIds.push(variation.id);
                });
              }
            });
          }

          if (serviceVariationIds.length === 0) {
            availabilityData = { availabilities: [] };
            checkComplete();
            return;
          }

          // Search for availability
          const availabilityRequestData = JSON.stringify({
            query: {
              filter: {
                start_at_range: {
                  start_at: startDate.toISOString(),
                  end_at: endDate.toISOString(),
                },
                location_id: locationId,
                segment_filters: serviceVariationIds.map((id) => ({
                  service_variation_id: id,
                })),
              },
            },
          });

          const availabilityOptions = {
            hostname: 'connect.squareup.com',
            path: '/v2/bookings/availability/search',
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Square-Version': '2025-07-16',
              'Content-Type': 'application/json',
              'Content-Length': availabilityRequestData.length,
            },
          };

          const availabilityReq = https.request(
            availabilityOptions,
            (availabilityRes) => {
              let availabilityResponseData = '';

              availabilityRes.on('data', (chunk) => {
                availabilityResponseData += chunk;
              });

              availabilityRes.on('end', () => {
                availabilityData = JSON.parse(availabilityResponseData);
                checkComplete();
              });
            }
          );

          availabilityReq.on('error', (error) => {
            console.error('Availability request error:', error);
            availabilityData = { error: 'Error fetching availability' };
            checkComplete();
          });

          availabilityReq.write(availabilityRequestData);
          availabilityReq.end();
        });
      });

      catalogReq.on('error', (error) => {
        console.error('Catalog request error:', error);
        availabilityData = { error: 'Error fetching services' };
        checkComplete();
      });

      catalogReq.write(catalogData);
      catalogReq.end();
    });
  });

  locationsReq.on('error', (error) => {
    console.error('Locations request error:', error);
    availabilityData = { error: 'Error fetching locations' };
    checkComplete();
  });

  locationsReq.end();
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Express server running on http://localhost:${PORT}`);
});