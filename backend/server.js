//loads env file
require("dotenv").config();

//Import node.js built-in http module
const http = require("http");

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

//create server
const server = http.createServer((req, res) => {
  //Get the URL that was requested
  const url = req.url;

  //this code below lets me print to the console
  //console.log('Someone requested:', req.url);

  if (url === "/") {
    // Home route - Authorization page

    // Build the Square authorization URL
    const authUrl = `https://connect.squareup.com/oauth2/authorize?client_id=${SQUARE_APP_ID}&scope=MERCHANT_PROFILE_READ+APPOINTMENTS_READ+APPOINTMENTS_ALL_READ&redirect_uri=${DOMAIN}/callback`;

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

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
    <!DOCTYPE html>
    <html>
    <head><title>Authorization Received</title></head>
    <body>
      <h1>Authorization Code Received!</h1>
      <p>Code: ${authorizationCode}</p>
      <p>Next step: Exchange this code for an access token</p>
    </body>
    </html>
  `);
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
const PORT = 3000;
//tells the server to start listening for requests on port 3000
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
