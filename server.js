const express = require('express');
const {dbConnect} = require('./utils/db');
const http = require('http')
const app = express();
const cors = require('cors');
const port = process.env.PORT;
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser");


require('dotenv').config({
  path: ['.env.local', '.env'],
  override: true,
  quiet: true
});


const server = http.createServer(app)



app.use(
  cors({
    origin: process.env.MODE === 'prod' ? [process.env.CLIENT, process.env.CLIENT1] : ['http://localhost:5173','http://localhost:5174'],
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);


dbConnect();

app.use(bodyParser.json());
app.use(cookieParser());


app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/payer', require('./routes/payerRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));

server.listen(port, () => {
  // Log the configuration
  console.log(`Server is running on http://localhost:${port}`);
});
