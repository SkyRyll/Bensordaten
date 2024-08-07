const express = require("express");
const app = express();
const session = require("express-session");
const mqtt = require("mqtt");
const mysql = require("mysql2");
const md5 = require("md5");
const bodyParser = require("body-parser");
const encoder = bodyParser.urlencoded();
const bcrypt = require("bcrypt");
const { check, validationResult } = require("express-validator");

//VARIABLES
const dbHost = "localhost";
const dbUser = "root";
const dbPass = "root";
const dbDatabase = "bensordaten";
const nodeAppPort = 3000;
const mqttBroker = "mqtt://broker.hivemq.com:1883";
const mqttTopic = "EST/EFI222/NSNS";

// expose static path
app.use(express.static("static"));

// set view engine
app.set("view engine", "ejs");

//initialize session
app.use(
    session({
        secret: "secret",
        resave: true,
        saveUninitialized: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// host app on port xxxx
app.listen(nodeAppPort, () => {
    console.log(`App listening at port ${nodeAppPort}`);
    console.log("http://localhost:" + nodeAppPort + "/");
});

//connect to local database
const connection = mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPass,
    database: dbDatabase,
});

// connection test
connection.connect(function (error) {
    if (error) throw error;
    else console.log("connection to database successful");
});

// Connect to MQTT broker
const mqttClient = mqtt.connect(mqttBroker);

// Subscribe to MQTT topic
mqttClient.on("connect", () => {
    console.log("Connected to MQTT broker");
    mqttClient.subscribe(mqttTopic);
});

// MQTT message handler
mqttClient.on("message", (topic, message) => {
    const trash = topic;

    const data = JSON.parse(message);

    const temperature = data.temperature;
    const humidity = data.humidity;
    const altitude = data.altitude;
    const pressure = data.pressure;

    const query = "INSERT INTO measurements (timestamp, temperature, humidity, altitude, pressure) VALUES (now(), ?, ?, ? ,?)";
    connection.query(query, [temperature, humidity, altitude, pressure], (err, result) => {
        if (err) {
            console.error("Error inserting data into database:", err);
        } else {
            console.log("Data inserted into database");
        }
    });
});

// Handle errors
mqttClient.on("error", (err) => {
    console.error("MQTT error:", err);
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// route pages
app.get("/", (req, res) => {
    get_index(req, res);
});

app.get("/graph", (req, res) => {
    get_graph(req, res);
});

app.get("/graphfour", (req, res) => {
    get_graphfour(req, res);
});

app.get("/account", (req, res) => {
    get_account(req, res);
});

app.get("/login", (req, res) => {
    get_login(req, res);
});

app.get("/register", (req, res) => {
    get_register(req, res);
});

app.get("/logout", (req, res) => {
    get_logout(req, res);
});

app.get("/error", (req, res) => {
    get_error(req, res);
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function get_index(req, res) {
    res.render("pages/index", {
        loggedin: req.session.loggedin,
    });
}

function get_graph(req, res) {
    if (req.session.loggedin) {
        res.render("pages/graph", {
            loggedin: req.session.loggedin,
        });
    } else {
        res.redirect("/login");
    }
}

function get_graphfour(req, res) {
    if (req.session.loggedin) {
        res.render("pages/graphfour", {
            loggedin: req.session.loggedin,
        });
    } else {
        res.redirect("/login");
    }
}

function get_account(req, res) {
    //check if user is logged in
    if (req.session.loggedin) {
        show_account(req, res, req.session.userID);
    } else {
        get_login(req, res);
    }
}

function show_account(req, res, user_id) {
    let user = null;

    const query = "SELECT * FROM accounts WHERE id = ?";
    connection.query(query, [user_id], function (error, results) {
        if (error) throw error;
        if (results.length > 0) {
            //user found
            user = results[0];

            //don't supply password hash ;)
            delete user.hash;
            res.render("pages/account", {
                user: user,
                loggedin: req.session.loggedin,
            });
        } else {
            //invalid userID
            get_error(req, res, "No User was found");
        }
    });
}

function get_login(req, res) {
    //check if user is logged in
    if (req.session.loggedin) {
        show_account(req, res, req.session.userID);
    } else {
        res.render("pages/login", {
            loggedin: req.session.loggedin,
        });
    }
}

function get_register(req, res) {
    //check if user is logged in
    if (req.session.loggedin) {
        show_account(req, res, req.session.userID);
    } else {
        res.render("pages/register", {
            loggedin: req.session.loggedin,
        });
    }
}

function get_logout(req, res) {
    //check if user is logged in
    if (req.session.loggedin) {
        do_logout(req, res);
    } else {
        get_error(req, res, "Logout failed. You were not logged in, please login to logout");
    }
}

function do_logout(req, res) {
    //close session
    req.session.username = null;
    req.session.userID = null;
    req.session.password = null;
    req.session.loggedin = false;

    res.redirect("/");
}

function get_error(req, res, errorMessage) {
    res.render("pages/error", {
        loggedin: req.session.loggedin,
        errorMessage: errorMessage,
    });
    res.end();
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/getGraphData", (req, res) => {
    const query = "SELECT * FROM (SELECT * FROM measurements ORDER BY timestamp DESC LIMIT 60) AS subquery ORDER BY measurement_id ASC;";
    connection.query(query, (err, result) => {
        if (err) {
            console.error("Database query error: " + err.message);
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.json(result);
        }
    });
});

//login check and redirect
app.post(
    "/login",
    [
        check("username").trim().isLength({ min: 1 }).escape(),
        check("password").trim().isLength({ min: 8 }), // You might want to add more validation here
    ],
    encoder,
    function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            get_error(req, res, "Error while trying to log in. The provided data did not meet the requirements");
        } else {
            var username = req.body.username;
            var password = req.body.password;
            const salt = generateSalt(password);

            // Retrieve 'hash' and 'salt' from the database based on the username
            const query = "SELECT * FROM accounts WHERE username = ?";
            connection.query(query, [username], function (error, results) {
                if (error) {
                    get_error(req, res, "Login failed. Please try again.");
                }

                if (results.length > 0) {
                    const storedHash = results[0].hash; // Get the stored hash from the database

                    bcrypt.hash(password, salt, function (err, hash) {
                        if (err) {
                            get_error(req, res, "Login failed. Please try again.");
                        }

                        // Compare 'hash' with 'storedHash' to verify the password
                        if (hash === storedHash) {
                            // Passwords match, grant access
                            req.session.loggedin = true;
                            req.session.username = username;
                            req.session.userID = results[0].id;

                            // Render home page
                            get_account(req, res);
                        } else {
                            // Passwords do not match, deny access
                            get_error(req, res, "Login failed. Incorrect password.");
                        }
                    });
                } else {
                    // User not found, handle accordingly
                    get_error(req, res, "Login failed. User not found.");
                }
            });
        }
    }
);

// register user
app.post(
    "/register",
    [
        check("email").isEmail().normalizeEmail(),
        check("firstname").trim().isLength({ min: 1 }).escape(),
        check("lastname").trim().isLength({ min: 1 }).escape(),
        check("username").trim().isLength({ min: 1 }).escape(),
        check("password").custom((value) => {
            // Use a regular expression to validate the password
            const passwordRegex = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})/;
            if (!passwordRegex.test(value)) {
                get_error(req, res, "Password must have at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.");
            }
            return true;
        }),
    ],
    encoder,
    function (req, res) {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            get_error(req, res, "Error while trying to create user. The provided data did not meet the requirements");
        } else {
            var email = req.body.email;
            var firstname = req.body.firstname;
            var lastname = req.body.lastname;
            var username = req.body.username;
            var password = req.body.password;
            const salt = generateSalt(password);

            bcrypt.hash(password, salt, function (err, hash) {
                if (err) {
                    // Error while hashing, user wont be created
                    get_error(req, res, "Error while trying to create user. Please try again");
                }

                const query = "SELECT * FROM accounts WHERE username = ?";
                connection.query(query, [username], function (error, results) {
                    // If there is an issue with the query, output the error
                    if (error) throw error;
                    // If the account exists
                    if (results.length > 0) {
                        //user already exists, skip login
                        get_error(req, res, "This username is already taken");
                    } else {
                        const query = "SELECT * FROM accounts WHERE email = ?";
                        connection.query(query, [email], function (error, results) {
                            // If there is an issue with the query, output the error
                            if (error) throw error;
                            // If the account exists
                            if (results.length > 0) {
                                //user already exists, skip login
                                get_error(req, res, "This email is already in use");
                            } else {
                                const query = "INSERT INTO accounts (email, firstname, lastname, username, hash) VALUES (?,?,?,?,?)";
                                connection.query(query, [email, firstname, lastname, username, hash], function (error, results) {
                                    // If there is an issue with the query, output the error
                                    if (error) throw error;
                                    // account added
                                    req.session.loggedin = true;
                                    req.session.username = username;
                                    req.session.userID = results.insertId;

                                    // render home page
                                    res.redirect("/account");
                                });
                            }
                        });
                    }
                });
            });
        }
    }
);

function generateSalt(password) {
    const temp = "$2b$10$";
    const firstHalf = password.slice(0, 3);
    const secondHalf = password.slice(5, 8);

    const salt = temp + md5(firstHalf + secondHalf).slice(8, 30);
    console.log(salt);
    return salt;
}
