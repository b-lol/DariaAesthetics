//loads env file
require("dotenv").config();

//Import node.js built-in http module
const http = require("http"); //used to make server and listen for requests
const https = require("https"); //used to make requestes to other servers

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

// Debug: Print what DOMAIN contains
console.log('DOMAIN value:', DOMAIN);
console.log('Full redirect URI:', `${DOMAIN}/callback`);

//create server
const server = http.createServer((req, res) => {
  //Get the URL that was requested
  const url = req.url;

  //this code below lets me print to the console
  //console.log('Someone requested:', req.url);

  if (url === "/") {
    // Home route - Authorization page

    // Build the Square authorization URL
    const redirectUri = `${DOMAIN}/callback`;
    const authUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${SQUARE_APP_ID}&scope=MERCHANT_PROFILE_READ+APPOINTMENTS_READ+APPOINTMENTS_ALL_READ&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;

    // Send HTML with authorization button
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
          console.log("Token:", result.access_token);
          console.log("Merchant ID:", result.merchant_id);

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
