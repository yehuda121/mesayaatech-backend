// const express = require("express");
// const cors = require("cors");

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Allow requests from frontend (port 3002)
// app.use(cors({ origin: "http://localhost:3002" }));


// // API route that prints "Hello, World!" in the console
// app.get("/api/hello", (req, res) => {
//   console.log("Hello, World!");
//   res.json({ message: "Hello, World!" });
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Backend running on http://localhost:${PORT}`);
// });

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db"); // conect to DB file
const userRoutes = require("./src/routes/userRoutes"); 

dotenv.config(); // Loads environment variables from .env

connectDB(); // Connect to MongoDB

const app = express();
app.use(express.json()); // for sending JSON
app.use(cors()); // to allow calls to API from the - Frontend

// conects the routes
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("🚀 API is running and connected to MongoDB!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
