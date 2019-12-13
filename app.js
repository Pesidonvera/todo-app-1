const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const expressValidator = require("express-validator");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const config = require("./config/database");
const ensureAuthenticated = require("./middleware");

mongoose.connect(config.database, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
let db = mongoose.connection;

// Check connection
db.once("open", function() {
  console.log("Connected to MongoDB");
});

// Check for DB errors
db.on("error", function(err) {
  console.log(err);
});

// Init App
const app = express();

// Bring in Models
let Board = require("./models/board");

// Load View Engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

// Body Parser Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Set Public Folder
app.use(express.static(path.join(__dirname, "public")));

// Express Session Middleware
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true
  })
);

// Express Messages Middleware
app.use(require("connect-flash")());
app.use(function(req, res, next) {
  res.locals.messages = require("express-messages")(req, res);
  next();
});

// Express Validator Middleware
app.use(
  expressValidator({
    errorFormatter: function(param, msg, value) {
      var namespace = param.split("."),
        root = namespace.shift(),
        formParam = root;

      while (namespace.length) {
        formParam += "[" + namespace.shift() + "]";
      }
      return {
        param: formParam,
        msg: msg,
        value: value
      };
    }
  })
);

// Passport Config
require("./config/passport")(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get("*", function(req, res, next) {
  res.locals.user = req.user || null;
  next();
});

// Home Route

app.get("/", ensureAuthenticated, function(req, res) {

  Board.find({ 'author.id': req.user._id }).populate("tasks").exec(function(err, boards){
    if(err){
        console.log(err);
    } else {
          res.render("index", {
            title: "Boards",
            boards: boards
          });
        }
      });
});

  // Board.find({ 'author.id': req.user._id }, function(err, boards) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     res.render("index", {
  //       title: "Boards",
  //       boards: boards
  //     });
  //   }
  // });
// });

// Route Files
const tasks = require("./routes/tasks");
const users = require("./routes/users");
const boards = require("./routes/boards");
app.use("/tasks", tasks);
app.use("/users", users);
app.use("/boards", boards);

// Start Server
app.listen(9090, function() {
  console.log("Server started on port 9090...");
});
