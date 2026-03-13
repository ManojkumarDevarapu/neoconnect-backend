# NeoConnect Backend

Backend API for the **NeoConnect Complaint Management System**.
This service handles authentication, complaint management, file uploads, and database operations.

## Overview

NeoConnect backend is built using **Node.js and Express** with **MongoDB** as the database.
It provides REST APIs that power the NeoConnect frontend dashboard and complaint submission system.

The backend handles:

* User authentication (JWT)
* Complaint submission & management
* File uploads
* Admin complaint handling
* Scheduled background tasks
* Secure API communication

---

## Tech Stack

* **Node.js**
* **Express.js**
* **MongoDB**
* **Mongoose**
* **JWT Authentication**
* **Bcrypt**
* **Node Cron**
* **Express File Upload**

---

## Project Structure

```
backend
│
├── server.js
├── config
│   └── db.js
│
├── controllers
│   └── complaintController.js
│
├── models
│   └── Complaint.js
│
├── routes
│   └── complaintRoutes.js
│
├── middleware
│   └── authMiddleware.js
│
├── utils
│   └── helpers.js
│
└── .env.example
```

---

## Installation

Clone the repository:

```
git clone https://github.com/yourusername/neoconnect-backend.git
```

Navigate into the project:

```
cd neoconnect-backend
```

Install dependencies:

```
npm install
```

---

## Environment Variables

Create a `.env` file based on `.env.example`.

Example:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## Running the Server

Development mode:

```
npm run dev
```

Production mode:

```
npm start
```

Server runs on:

```
http://localhost:5000
```

---

## API Features

### Authentication

* Secure JWT authentication
* Password hashing with bcrypt

### Complaint Management

* Submit complaints
* Track complaint status
* Admin resolution updates

### File Upload

* Upload attachments related to complaints

### Scheduled Jobs

* Background tasks using **node-cron**

---

## Database

The backend uses **MongoDB** with **Mongoose ODM**.

Main collections may include:

* Users
* Complaints
* Attachments

---

## Security

* JWT token authentication
* Password hashing
* Protected API routes
* Environment-based secrets

---

## Future Improvements

* Email notifications
* Role-based access control
* API rate limiting
* Logging and monitoring
* Microservice architecture

---

## Author

Developed as part of the **NeoConnect Complaint Management System** project.
