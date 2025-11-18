# Daria Aesthetics

**Live Site**: [dariaaesthetics.ca](https://dariaaesthetics.ca)

A full-stack web application for a professional waxing and aesthetics studio, featuring real-time appointment availability, service catalog management, and Square API integration.

---

## 📋 Project Overview

Daria Aesthetics is a professional business website that allows clients to:
- View real-time appointment availability through an interactive calendar
- Browse services and pricing pulled directly from Square
- Access detailed information about waxing procedures, aftercare, and first-visit preparation
- Contact the studio and view location information with integrated maps

The application solves the problem of manual appointment coordination by automatically displaying the studio's real availability, reducing booking friction and improving the client experience.

---

## ✨ Features

### Client-Facing Features
- **Interactive Availability Calendar**: 7-day rolling view showing hourly appointment slots
- **Dynamic Services & Pricing**: Real-time service catalog synced with Square
- **Comprehensive Information Pages**: 
  - First-time visitor guide
  - Detailed aftercare instructions
  - Contact information with Google Maps integration
- **Studio Hours Display**: Real-time open/closed status with timezone handling (America/Vancouver)
- **Responsive Design**: Mobile-friendly layout for all pages

### Technical Features
- **Square API Integration**: OAuth 2.0 authentication with automatic token management
- **RESTful API**: Custom endpoints for services, availability, and calendar data
- **Security Implementation**: 
  - Rate limiting on API endpoints (prevents DDoS/scraping)
  - Admin route protection with password authentication
  - Separate rate limiters for public vs admin routes
- **Token Management**: Hybrid approach using both environment variables and local file storage
- **Modular Component System**: Reusable HTML components (menu, footer, booking button)

---

## 🛠️ Tech Stack

### Frontend
- **HTML5/CSS3**: Semantic markup and custom styling
- **Vanilla JavaScript**: DOM manipulation, API calls, and interactive calendar rendering
  - *Chose vanilla JS over frameworks to better understand core web fundamentals and reduce bundle size for a content-focused site*

### Backend
- **Node.js**: JavaScript runtime environment for server-side execution
- **Express.js**: Web application framework
  - *Initially built with vanilla Node.js HTTP server, then migrated to Express framework to implement advanced security features (rate limiting, middleware) and cleaner routing architecture*
- **HTTPS Module**: Secure API communication with Square

### APIs & Integrations
- **Square API**: 
  - OAuth 2.0 authentication
  - Catalog API (services/pricing)
  - Bookings API (availability/appointments)
  - *Enables real-time synchronization with the studio's actual booking system, eliminating manual updates*
- **Google Maps Embed API**: Location display

### Security
- **express-rate-limit**: Protection against brute force and DDoS attacks
  - API endpoints: 100 requests per 15 minutes
  - Admin routes: 5 requests per 15 minutes
- **dotenv**: Environment variable management for sensitive credentials

### Deployment
- **Docker**: Containerized the Node.js application with all dependencies
  - Ensures consistent runtime environment across development and production
  - Simplifies deployment process and scaling
  - Includes proper handling of environment variables in container

---

## 📁 Project Structure

```
daria-aesthetics/
├── pages/              # HTML pages
│   ├── index.html      # Homepage
│   ├── book_now.html   # Availability calendar
│   ├── pricing_services.html
│   ├── first_visit.html
│   ├── skin_care.html  # Aftercare instructions
│   └── contact.html
├── js/                 # Client-side JavaScript
│   ├── script.js       # Shared functionality (component loading, menu)
│   ├── book_now.js     # Calendar rendering logic
│   └── pricing.js      # Service catalog display
├── css/                # Stylesheets
├── components/         # Reusable HTML components
├── img/                # Images and assets
└── server.js           # Express server & API routes
```

---

## 🎓 What I Learned

This project represents my journey into **full-stack web development**:

- **Backend Development**: Built a Node.js server from scratch, then migrated to Express for better architecture
- **RESTful API Design**: Created custom API endpoints that interact with third-party services
- **OAuth 2.0 Implementation**: Handled secure authentication flows and token management
- **Security Best Practices**: Implemented rate limiting, environment variable management, and admin route protection
- **API Integration**: Worked with Square's production APIs to sync real business data
- **Frontend-Backend Communication**: Built dynamic interfaces that fetch and display data from my own API
- **Timezone Handling**: Managed time-based features across different timezones (Pacific Time)
- **Containerization**: Used Docker to create reproducible deployment environments
- **Production Deployment**: Deployed a live application with real business requirements

---

## 🔒 Security Features

- **Rate Limiting**: Protects against brute force attacks and API abuse
- **Password-Protected Admin Routes**: OAuth connection only accessible to authorized users
- **Environment Variables**: Sensitive credentials never committed to version control
- **Token Refresh Logic**: Automatic handling of expired access tokens

---

*Built with ❤️ as a learning project in full-stack web development*