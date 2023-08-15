const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const md5 = require("md5");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000;

const secretKey = "Pr0j3ct1rf4n";

app.use(bodyParser.json());

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({
      status: res.status(),
      message: "Token not provided",
      data: [],
    });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        status: res.status(),
        message: "Invalid token",
        data: [],
      });
    }

    req.userId = decoded.id;
    next();
  });
};

const dbUser = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "kgm_auth",
});

dbUser.connect((err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    return;
  }
  console.log("Connected to database User");
});

const dbInventory = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "barang",
});

dbInventory.connect((err) => {
  if (err) {
    console.error("Error connecting to database: ", err);
    return;
  }

  console.log("Connected to database Inventory");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      status: res.status(),
      message: "Username and password are required",
      data: [],
    });
  }

  const hashedPassword = md5(password);

  const query = "SELECT * FROM data_user WHERE username = ? AND password = ?";

  dbUser.query(query, [username, hashedPassword], (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({
        status: res.status(),
        message: "Internal server error",
        data: [],
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        status: res.status(),
        message: "Invalid username or password",
        data: [],
      });
    }

    const user = results[0];
    const token = jwt.sign(
      { id: user.id, username: user.username },
      "Pr0j3ct1rf4n"
    );

    res.json({
      status: 200,
      message: "Success Login",
      data: {
        token: token,
      },
    });
  });
});

app.get("/barang", verifyToken, (req, res) => {
  const query = "SELECT * FROM barang WHERE deleted = 0";

  dbInventory.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({
        status: res.status(),
        message: "Internal server error",
        data: [],
      });
    }

    res.json({
      status: 200,
      message: "Success Get Data",
      data: results,
    });
  });
});

app.get("/barang/find/:kodebr", verifyToken, (req, res) => {
  const kodebr = req.params.kodebr;
  const query = `SELECT * FROM barang WHERE kodebr = ${kodebr}`;

  dbInventory.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({
        status: res.status(),
        message: "Internal server error",
        data: [],
      });
    }

    res.json({
      status: 200,
      message: "Success Get Data",
      data: results[0],
    });
  });
});

app.post("/barang", verifyToken, (req, res) => {
  const { kodebr, nama, gdg, harga } = req.body;

  const query =
    "INSERT INTO barang (kodebr, nama, gdg, harga) VALUES (?, ?, ?, ?)";
  dbInventory.query(query, [kodebr, nama, gdg, harga], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({
        status: res.status(),
        message: "Internal server error",
        data: [],
      });
    }

    res.json({
      status: 200,
      message: "Barang added successfully",
      data: [],
    });
  });
});

app.put("/barang/:kodebr", verifyToken, (req, res) => {
  const { nama, gdg, harga } = req.body;
  const kodebr = req.params.kodebr;

  const query =
    "UPDATE barang SET nama = ?, gdg = ?, harga = ? WHERE kodebr = ?";
  dbInventory.query(query, [nama, gdg, harga, kodebr], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({
        status: res.status(),
        message: "Internal server error",
        data: [],
      });
    }

    res.json({
      status: 200,
      message: "Barang updated successfully",
      data: [],
    });
  });
});

app.delete("/barang/:kodebr", verifyToken, (req, res) => {
  const kodebr = req.params.kodebr;

  const query = "UPDATE barang SET deleted = 1 WHERE kodebr = ?";
  dbInventory.query(query, [kodebr], (err, result) => {
    if (err) {
      console.error("Error executing query:", err);
      return res.status(500).json({
        status: res.status(),
        message: "Internal server error",
        data: [],
      });
    }

    res.json({
      status: 200,
      message: "Barang deleted successfully",
      data: [],
    });
  });
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
