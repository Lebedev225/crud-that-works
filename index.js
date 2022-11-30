// Add required packages
const express = require("express");
const app = express();
require("dotenv").config();
const path = require("path");

// // Set up EJS
// app.set("view engine", "ejs");
// Server configuration
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false })); // <--- middleware configuration

// Add database package and connection string (can remove ssl)
const { Pool } = require("pg");
const pool = new Pool({
    connectionString: process.env.CRUNCHY_DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

const sql_create = `CREATE TABLE IF NOT EXISTS Books (
  Book_ID SERIAL PRIMARY KEY,
  Title VARCHAR(100) NOT NULL,
  Author VARCHAR(100) NOT NULL,
  Comments TEXT
);`;

// const sql = "SELECT * FROM PRODUCT ORDER BY PROD_ID";
pool.query(sql_create, [], (err, result) => {
    var message = "";
    var model = {};
    if (err) {
        message = `Error - ${err.message}`;
    } else {
        message = "success";
        model = result.rows;
        console.log("Successful creation of the 'Books' table");
        const sql_insert = `INSERT INTO Books (Book_ID, Title, Author, Comments) VALUES
    (1, 'Mrs. Bridge', 'Evan S. Connell', 'First in the serie'),
    (2, 'Mr. Bridge', 'Evan S. Connell', 'Second in the serie'),
    (3, 'L''ingénue libertine', 'Colette', 'Minne + Les égarements de Minne')
    ON CONFLICT DO NOTHING;`;
        pool.query(sql_insert, [], (err, result) => {
            if (err) {
                return console.error(err.message);
            }
            const sql_sequence =
                "SELECT SETVAL('Books_Book_ID_Seq', MAX(Book_ID)) FROM Books;";
            pool.query(sql_sequence, [], (err, result) => {
                if (err) {
                    return console.error(err.message);
                }
                console.log("Successful creation of 3 books");
            });
        });
    }
});

// Start listener
app.listen(process.env.PORT || 3000, () => {
    console.log("Server started (http://localhost:3000/) !");
});

// Setup routes
app.get("/", (req, res) => {
    //res.send ("Hello world...");

    res.render("index");
});

app.get("/books", (req, res) => {
    const sql = "SELECT * FROM Books ORDER BY Title";
    pool.query(sql, [], (err, result) => {
        if (err) {
            return console.error(err.message);
        }
        res.render("books", { model: result.rows });
    });
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/data", (req, res) => {
    const test = {
        title: "Test",
        items: ["one", "two", "three"],
    };
    res.render("data", { model: test });
});

// GET /edit/5
app.get("/edit/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Books WHERE Book_ID = $1";
    pool.query(sql, [id], (err, result) => {
        // if (err) ...
        res.render("edit", { model: result.rows[0] });
    });
});

// GET /create
app.get("/create", (req, res) => {
    res.render("create", { model: {} });
});

// POST /create
app.post("/create", (req, res) => {
    const sql =
        "INSERT INTO Books (Title, Author, Comments) VALUES ($1, $2, $3)";
    const book = [req.body.title, req.body.author, req.body.comments];
    pool.query(sql, book, (err, result) => {
        // if (err) ...
        res.redirect("/books");
    });
});

// GET /delete/5
app.get("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM Books WHERE Book_ID = $1";
    pool.query(sql, [id], (err, result) => {
        // if (err) ...
        res.render("delete", { model: result.rows[0] });
    });
});

// POST /delete/5
app.post("/delete/:id", (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM Books WHERE Book_ID = $1";
    pool.query(sql, [id], (err, result) => {
        // if (err) ...
        res.redirect("/books");
    });
});
