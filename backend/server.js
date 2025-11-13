//loads env file
require("dotenv").config();

//Import node.js built-in http module
const http = require("http"); //used to make server and listen for requests
const https = require("https"); //used to make requestes to other servers
const fs = require("fs"); //used to read files from disk
const path = require("path"); //used to work with file paths

//shows what was loaded
// console.log('Testing .env file:');
// console.log('Square App ID:', process.env.SQUARE_APPLICATION_ID);
// console.log('Square Secret:', process.env.SQUARE_APPLICATION_SECRET ? '✓ Loaded' : '✗ Missing');
// console.log('Port:', process.emitWarning.PORT);
// console.log('Domain:', process.env.DOMAIN);
// console.log('---');

//credentials from environment variables
const SQUARE_APP_ID = process.env.SQUARE_APPLICATION_ID;
const SQUARE_APP_SECRET = process.env.SQUARE_APPLICATION_SECRET;
const DOMAIN = process.env.DOMAIN;

//Path to store tokens
const TOKENS_FILE = path.join(__dirname, "tokens.json");

// Function to save tokens to file
function saveTokens(tokens) {
  try {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    console.log("✅ Tokens saved to tokens.json");
    console.log("\n⚠️  IMPORTANT FOR RAILWAY DEPLOYMENT:");
    console.log("If running on Railway, you must manually update these environment variables:");
    console.log("  SQUARE_ACCESS_TOKEN =", tokens.access_token);
    console.log("  SQUARE_REFRESH_TOKEN =", tokens.refresh_token);
    console.log("  MERCHANT_ID =", tokens.merchant_id);
    console.log("Otherwise tokens will be lost on server restart!\n");
  } catch (error) {
    console.error("❌ Error saving tokens:", error);
  }
}

// Function to load tokens from file
function loadTokens() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const data = fs.readFileSync(TOKENS_FILE, "utf8");
      const tokens = JSON.parse(data);
      console.log("✅ Tokens loaded from tokens.json");
      return tokens;
    }
  } catch (error) {
    console.error("❌ Error loading tokens:", error);
  }
  return null;
}

// Load tokens on server start
// Priority: 1) Environment variables (secure), 2) tokens.json (fallback for local dev)
const storedTokens = loadTokens();
let SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN || storedTokens?.access_token || null;
let REFRESH_TOKEN = process.env.SQUARE_REFRESH_TOKEN || storedTokens?.refresh_token || null;
let MERCHANT_ID = process.env.MERCHANT_ID || storedTokens?.merchant_id || null;

console.log("DOMAIN value:", DOMAIN);
console.log("Full redirect URI:", `${DOMAIN}/callback`);
console.log("Access token loaded:", SQUARE_ACCESS_TOKEN ? "✅ Yes" : "❌ No");
console.log("Token source:", process.env.SQUARE_ACCESS_TOKEN ? "Environment variables (secure)" : "tokens.json (local dev)");

//create server
const server = http.createServer((req, res) => {

  // Page routes mapping
  const pageRoutes = {
    '/': 'index.html',
    '/index': 'index.html',
    '/book_now': 'book_now.html',
    '/pricing': 'pricing_services.html',
    '/training': 'training.html',
    '/first_visit': 'first_visit.html',
    '/skin_care': 'skin_care.html',
    '/contact': 'contact.html'
  };


  //Get the URL that was requested
  const url = req.url;

  //this code below lets me print to the console
  //console.log('Someone requested:', req.url);

  if (url === "/") {
    // Serve your normal homepage
    const filePath = path.join(__dirname, "../pages/index.html");

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 - Page Not Found</h1>");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  } else if (url === "/connect-square") {
    // OAuth authorization page (only for admin use)
    const redirectUri = `${DOMAIN}/callback`;
    const authUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${SQUARE_APP_ID}&scope=MERCHANT_PROFILE_READ+APPOINTMENTS_READ+APPOINTMENTS_ALL_READ+ITEMS_READ&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
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
  } else if (url.startsWith("/callback")) {
    // URL looks like: /callback?code=ABC123&state=xyz
    const urlParts = url.split("?");

    if (urlParts.length < 2) {
      res.end("Error: No authorization code received");
      return;
    }

    // Parse the query string to get the code
    // (turns `?code=ABC&state=XYZ` into an object)
    const params = new URLSearchParams(urlParts[1]);
    const authorizationCode = params.get("code");

    if (!authorizationCode) {
      res.end("Error: No authorization code found");
      return;
    }

    // Prepare data to send to Square
    const tokenData = JSON.stringify({
      client_id: SQUARE_APP_ID,
      client_secret: SQUARE_APP_SECRET,
      code: authorizationCode,
      grant_type: "authorization_code",
      redirect_uri: `${DOMAIN}/callback`,
    });

    // Options for the HTTPS request to Square
    const options = {
      hostname: "connect.squareup.com",
      path: "/oauth2/token",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": tokenData.length,
      },
    };

    // Make the request to Square
    const squareReq = https.request(options, (squareRes) => {
      let responseData = "";

      // Collect data as it comes in
      squareRes.on("data", (chunk) => {
        responseData += chunk;
      });

      // When all data is received
      squareRes.on("end", () => {
        const result = JSON.parse(responseData);

        // Check if we got an access token
        if (result.access_token) {
          // SUCCESS! We got the token
          console.log("✅ Access token received!");
          console.log("Merchant ID:", result.merchant_id);

          // Save tokens to file
          const tokenData = {
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            merchant_id: result.merchant_id,
            expires_at: result.expires_at,
            created_at: new Date().toISOString(),
          };

          saveTokens(tokenData);

          // Update in-memory tokens
          SQUARE_ACCESS_TOKEN = result.access_token;
          REFRESH_TOKEN = result.refresh_token;
          MERCHANT_ID = result.merchant_id;

          // Send success page
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
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
          // ERROR - Something went wrong
          console.error("❌ Error:", result);
          res.end("Error: " + JSON.stringify(result));
        }
      });
    });

    // Handle request errors
    squareReq.on("error", (error) => {
      console.error("Request error:", error);
      res.end("Error making request to Square");
    });

    // Send the request with our data
    squareReq.write(tokenData);
    squareReq.end();
  } else if (url === "/api/availability") {
    // API endpoint to get availability from Square

    const accessToken = SQUARE_ACCESS_TOKEN;

    if (!accessToken) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "No access token found. Please authorize first.",
        })
      );
      return;
    }

    // Get location ID first
    const locationsOptions = {
      hostname: "connect.squareup.com",
      path: "/v2/locations",
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2025-07-16",
        "Content-Type": "application/json",
      },
    };

    // Request locations from Square
    const locationsReq = https.request(locationsOptions, (locationsRes) => {
      let locationsData = "";

      locationsRes.on("data", (chunk) => {
        locationsData += chunk;
      });

      locationsRes.on("end", () => {
        const locationsResult = JSON.parse(locationsData);

        if (locationsResult.locations && locationsResult.locations.length > 0) {
          const locationId = locationsResult.locations[0].id;
          console.log("Location ID:", locationId);

          // Now get services from Catalog API
          const catalogData = JSON.stringify({
            object_types: ["ITEM"],
          });

          const catalogOptions = {
            hostname: "connect.squareup.com",
            path: "/v2/catalog/search",
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Square-Version": "2025-07-16",
              "Content-Type": "application/json",
              "Content-Length": catalogData.length,
            },
          };

          // Request to get services
          const catalogReq = https.request(catalogOptions, (catalogRes) => {
            let catalogResponseData = "";

            catalogRes.on("data", (chunk) => {
              catalogResponseData += chunk;
            });

            catalogRes.on("end", () => {
              const catalogResult = JSON.parse(catalogResponseData);

              console.log(
                "Catalog response:",
                JSON.stringify(catalogResult, null, 2)
              );

              // Extract service variation IDs
              const serviceVariationIds = [];

              if (catalogResult.objects) {
                catalogResult.objects.forEach((item) => {
                  if (
                    item.type === "ITEM" &&
                    item.item_data &&
                    item.item_data.variations
                  ) {
                    item.item_data.variations.forEach((variation) => {
                      serviceVariationIds.push(variation.id);
                    });
                  }
                });
              }

              console.log("Found service IDs:", serviceVariationIds);

              if (serviceVariationIds.length === 0) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "No services found" }));
                return;
              }

              // Now search for availability with the service IDs
              const startDate = new Date();
              const endDate = new Date();
              endDate.setDate(endDate.getDate() + 21);

              const availabilityData = JSON.stringify({
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
                hostname: "connect.squareup.com",
                path: "/v2/bookings/availability/search",
                method: "POST",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Square-Version": "2025-07-16",
                  "Content-Type": "application/json",
                  "Content-Length": availabilityData.length,
                },
              };

              const availabilityReq = https.request(
                availabilityOptions,
                (availabilityRes) => {
                  let availabilityResponseData = "";

                  availabilityRes.on("data", (chunk) => {
                    availabilityResponseData += chunk;
                  });

                  availabilityRes.on("end", () => {
                    // Send the availability data back to the browser
                    res.writeHead(200, { "Content-Type": "application/json" });
                    res.end(availabilityResponseData);
                  });
                }
              );

              availabilityReq.on("error", (error) => {
                console.error("Availability request error:", error);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(
                  JSON.stringify({ error: "Error fetching availability" })
                );
              });

              availabilityReq.write(availabilityData);
              availabilityReq.end();
            });
          });

          catalogReq.on("error", (error) => {
            console.error("Catalog request error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Error fetching services" }));
          });

          catalogReq.write(catalogData);
          catalogReq.end();
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No locations found" }));
        }
      });
    });

    locationsReq.on("error", (error) => {
      console.error("Locations request error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Error fetching locations" }));
    });

    locationsReq.end();
  } else if (url === "/api/bookings") {
    //API endpoint to get bookings
    const accessToken = SQUARE_ACCESS_TOKEN;
    //checking if we have the access token. If we don't then we get an error message.
    if (!accessToken) {
      res.writeHead(401, { "Content-Type": "application / json" });
      res.end(
        JSON.stringify({
          error: "No Access token found. Please authorize first.",
        })
      );
      return;
    }
    //Get location ID first
    //getting location first because square organizes data by location
    const locationsOptions = {
      hostname: "connect.squareup.com",
      //where we are sending the request
      path: "/v2/locations",
      //the specific endpoint
      method: "GET",
      //this sets that we are asking for data (not sending/updating)
      headers: {
        Authorization: `Bearer ${accessToken}`,
        //our access token to prove we  have permission
        "Square-Version": "2025-07-16",
        //which Squares API we are using
        "Content-Type": "application/json",
        //we want JSON type back
      },
    };

    //Requesting locations from Square
    const locationsReq = https.request(locationsOptions, (locationsRes) => {
      //making an https request using the optiosn we set in the previous method
      //locationsRes is the callback function that runs when Square responds

      let locationsData = "";
      //empty string to collect data
      locationsRes.on("data", (chunk) => {
        //listening for data
        locationsData += chunk; //adds each chunk to our string
      });

      //when all data is received this will run and we will process the data
      //this will convert the JSON string to a Javascript object
      locationsRes.on("end", () => {
        const locationsResult = JSON.parse(locationsData);

        if (locationsResult.locations && locationsResult.locations.length > 0) {
          const locationId = locationsResult.locations[0].id;
          console.log("Location ID:", locationId);

          /*
          Before this line everything was to get the location data
          */

          // Get bookings for next 21 days
          const startDate = new Date();
          //new date gets us todays date
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 31);

          // Build query parameters for bookings
          const startAtMin = startDate.toISOString();
          const startAtMax = endDate.toISOString();
          //toISO converts date to format Square needs
          const bookingsPath = `/v2/bookings?location_id=${locationId}&start_at_min=${startAtMin}&start_at_max=${startAtMax}`;

          //Here we are configuring the booking request,
          const bookingsOptions = {
            hostname: "connect.squareup.com",
            path: bookingsPath,
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Square-Version": "2025-07-16",
              "Content-Type": "application/json",
            },
          };

          //Here we are making the actual booking request
          const bookingsReq = https.request(bookingsOptions, (bookingsRes) => {
            let bookingsResponseData = "";

            bookingsRes.on("data", (chunk) => {
              bookingsResponseData += chunk;
            });

            bookingsRes.on("end", () => {
              // Send the bookings data back to the browser
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(bookingsResponseData);
            });
          });

          //this is handling errors that may arise during booking requests
          bookingsReq.on("error", (error) => {
            console.error("Bookings request error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Error fetching bookings" }));
          });

          bookingsReq.end();
        } else {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No locations found" }));
        }
      });
    });

    //this is handling errors that may arise during location requests
    locationsReq.on("error", (error) => {
      console.error("Locations request error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Error fetching locations" }));
    });

    locationsReq.end();
  } else if (url === "/api/calendar") {
    // API endpoint that combines bookings AND availability

    const accessToken = SQUARE_ACCESS_TOKEN;

    if (!accessToken) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "No access token found. Please authorize first.",
        })
      );
      return;
    }

    // We'll store both results here
    let bookingsData = null;
    let availabilityData = null;
    let completedRequests = 0;

    // Function to check if both requests are done
    function checkComplete() {
      completedRequests++;
      if (completedRequests === 2) {
        // Both requests complete - send combined response
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            bookings: bookingsData,
            availability: availabilityData,
          })
        );
      }
    }

    // Get location ID first (needed for both requests)
    const locationsOptions = {
      hostname: "connect.squareup.com",
      path: "/v2/locations",
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2025-07-16",
        "Content-Type": "application/json",
      },
    };

    const locationsReq = https.request(locationsOptions, (locationsRes) => {
      let locationsResponseData = "";

      locationsRes.on("data", (chunk) => {
        locationsResponseData += chunk;
      });

      locationsRes.on("end", () => {
        const locationsResult = JSON.parse(locationsResponseData);

        if (
          !locationsResult.locations ||
          locationsResult.locations.length === 0
        ) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No locations found" }));
          return;
        }

        const locationId = locationsResult.locations[0].id;

        // Date range for both requests
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 21);

        // ===== REQUEST 1: GET BOOKINGS =====
        const startAtMin = startDate.toISOString();
        const startAtMax = endDate.toISOString();
        const bookingsPath = `/v2/bookings?location_id=${locationId}&start_at_min=${startAtMin}&start_at_max=${startAtMax}`;

        const bookingsOptions = {
          hostname: "connect.squareup.com",
          path: bookingsPath,
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Square-Version": "2025-07-16",
            "Content-Type": "application/json",
          },
        };

        const bookingsReq = https.request(bookingsOptions, (bookingsRes) => {
          let bookingsResponseData = "";

          bookingsRes.on("data", (chunk) => {
            bookingsResponseData += chunk;
          });

          bookingsRes.on("end", () => {
            bookingsData = JSON.parse(bookingsResponseData);
            checkComplete();
          });
        });

        bookingsReq.on("error", (error) => {
          console.error("Bookings request error:", error);
          bookingsData = { error: "Error fetching bookings" };
          checkComplete();
        });

        bookingsReq.end();

        // ===== REQUEST 2: GET AVAILABILITY =====
        // First get catalog services
        const catalogData = JSON.stringify({
          object_types: ["ITEM"],
        });

        const catalogOptions = {
          hostname: "connect.squareup.com",
          path: "/v2/catalog/search",
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Square-Version": "2025-07-16",
            "Content-Type": "application/json",
            "Content-Length": catalogData.length,
          },
        };

        const catalogReq = https.request(catalogOptions, (catalogRes) => {
          let catalogResponseData = "";

          catalogRes.on("data", (chunk) => {
            catalogResponseData += chunk;
          });

          catalogRes.on("end", () => {
            const catalogResult = JSON.parse(catalogResponseData);

            // Extract service variation IDs
            const serviceVariationIds = [];

            if (catalogResult.objects) {
              catalogResult.objects.forEach((item) => {
                if (
                  item.type === "ITEM" &&
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
              hostname: "connect.squareup.com",
              path: "/v2/bookings/availability/search",
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Square-Version": "2025-07-16",
                "Content-Type": "application/json",
                "Content-Length": availabilityRequestData.length,
              },
            };

            const availabilityReq = https.request(
              availabilityOptions,
              (availabilityRes) => {
                let availabilityResponseData = "";

                availabilityRes.on("data", (chunk) => {
                  availabilityResponseData += chunk;
                });

                availabilityRes.on("end", () => {
                  availabilityData = JSON.parse(availabilityResponseData);
                  checkComplete();
                });
              }
            );

            availabilityReq.on("error", (error) => {
              console.error("Availability request error:", error);
              availabilityData = { error: "Error fetching availability" };
              checkComplete();
            });

            availabilityReq.write(availabilityRequestData);
            availabilityReq.end();
          });
        });

        catalogReq.on("error", (error) => {
          console.error("Catalog request error:", error);
          availabilityData = { error: "Error fetching services" };
          checkComplete();
        });

        catalogReq.write(catalogData);
        catalogReq.end();
      });
    });

    locationsReq.on("error", (error) => {
      console.error("Locations request error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Error fetching locations" }));
    });

    locationsReq.end();
  } else if (url === "/api/services") {
    // API endpoint to get services from Square Catalog

    const accessToken = SQUARE_ACCESS_TOKEN;

    if (!accessToken) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "No access token found. Please authorize first.",
        })
      );
      return;
    }

    // Search for all items (services) in the catalog
    const catalogData = JSON.stringify({
      object_types: ["ITEM"],
    });

    const catalogOptions = {
      hostname: "connect.squareup.com",
      path: "/v2/catalog/search",
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": "2025-07-16",
        "Content-Type": "application/json",
        "Content-Length": catalogData.length,
      },
    };

    const catalogReq = https.request(catalogOptions, (catalogRes) => {
      let catalogResponseData = "";

      catalogRes.on("data", (chunk) => {
        catalogResponseData += chunk;
      });

      catalogRes.on("end", () => {
        const catalogResult = JSON.parse(catalogResponseData);

        // Process and organize the services
        const services = [];

        if (catalogResult.objects) {
          catalogResult.objects.forEach((item) => {
            if (item.type === "ITEM" && item.item_data) {
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
                description: itemData.description || "",
                category: itemData.category_id || "uncategorized",
                variations: variations,
              });
            }
          });
        }

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ services: services }));
      });
    });

    catalogReq.on("error", (error) => {
      console.error("Catalog request error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Error fetching services" }));
    });

    catalogReq.write(catalogData);
    catalogReq.end();
  } else if (pageRoutes[url]) {
    // Page routing - serves HTML pages
    const filePath = path.join(__dirname, "../pages", pageRoutes[url]);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 - Page Not Found</h1>");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  } else if (url.startsWith("/components/")) {
    // ... your existing components code ...else if (url.startsWith("/components/")) {
    // Serve component files
    const filePath = path.join(__dirname, "..", url);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("Component not found");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(data);
      }
    });
  } else if (
    url.startsWith("/css/") ||
    url.startsWith("/js/") ||
    url.startsWith("/img/")
  ) {
    // Serve static files (CSS, JS, images)
    const filePath = path.join(__dirname, "..", url);

    // Determine content type based on file extension
    let contentType = "text/html";
    if (url.endsWith(".css")) contentType = "text/css";
    if (url.endsWith(".js")) contentType = "application/javascript";
    if (url.endsWith(".png")) contentType = "image/png";
    if (url.endsWith(".jpg") || url.endsWith(".jpeg"))
      contentType = "image/jpeg";
    if (url.endsWith(".svg")) contentType = "image/svg+xml";
    if (url.endsWith(".ico")) contentType = "image/x-icon";

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("File not found");
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
      }
    });
  } else if (url === "/about") {
    // About page
    res.end("This is the About Page!");
  } else if (url === "/contact") {
    // Contact page
    res.end("This is the Contact Page!");
  } else {
    // Any other URL - show 404 error
    res.end("404 - Page Not Found");
  }
});

//Tell the server to start listening on port 3000
const PORT = process.env.PORT || 3000;
//tells the server to start listening for requests on port 3000
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
