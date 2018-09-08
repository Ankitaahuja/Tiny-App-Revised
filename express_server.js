
let express = require("express");
let bcrypt = require('bcrypt');
let cookieSession = require('cookie-session');
let bodyParser = require("body-parser");

let app = express();
let PORT = 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['yama'],
  maxAge: 24 * 60 * 60 * 1000 // Cookie Options, 24 hours
}));
app.set("view engine", "ejs");


const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

function generateRandomString() {
  let randomString = "";
  let charset = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for( let i=0; i < 6; i++ ){
    randomString += charset.charAt(Math.floor(Math.random() * charset.length));
  }
    
  return randomString;
}


let updatedDatabase = {
  "b2xVn2" : { 
                longURL: "http://www.lighthouselabs.ca",
                user_id: "userRandomID" // hardcorded 
                },
  "9sm5xK": {
               longURL: "http://www.google.com",
                user_id: "uasfvzzdf" // hardcorded
            }
};

app.get("/", (req, res) => {

  res.redirect('/urls');

});

app.get("/urls", (req, res) => {
  
if(req.session.user_id){
    let templateVars = { 
      user: users[req.session.user_id],
      urls: updatedDatabase 
    };
    res.render("urls_index", templateVars);
  }else {
    res.redirect('/login');
  }
});

app.post("/urls", (req, res) => {
 
  let shortURL= generateRandomString(); 
  updatedDatabase[shortURL] = {
                                longURL:req.body.longURL,
                                user_id: req.session.user_id
                              };
  
  res.redirect('/urls');
});

app.get("/urls/new", (req, res) => {

  if (req.session.user_id){
    let templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  }
  else{
    res.redirect('/login');
  } 
});

app.get("/urls.json", (req, res) => {
  res.json(updatedDatabase);
});


app.get("/urls/:id", (req, res) => {
  
  if(updatedDatabase[req.params.id]){
    let templateVars = {
      shortURL: req.params.id,
      longURL: updatedDatabase[req.params.id].longURL,
      user: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  }else{
    let templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_show",templateVars);
  }
  
});

app.post("/urls/:id", (req, res) => {
  updatedDatabase[req.params.id].longURL = req.body.longURL;
	res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
	delete updatedDatabase[req.params.id];
	res.redirect("/urls");
});

app.get("/register", (req, res) => {
  res.render("urls_register");
});

app.post("/register", (req, res) => {
  if(req.body.email && req.body.password){
    for (let key in users) {
      console.log("email:"+ users[key].email);
      if(users[key].email === req.body.email){
      res.status(400);
      res.send('Email already exist');
      return;
      }
    }
   
    let userRandomID = generateRandomString(); 
    let hashPasswordValue = bcrypt.hashSync(req.body.password, 10);
    let newUser =  {id: userRandomID, email: req.body.email, password: hashPasswordValue};

    users[userRandomID] = newUser;
    req.session.user_id = userRandomID;
    res.redirect("/urls");
  } else {
    res.status(400);
    res.send('Email and Password Cannot be Empty');
  }
  
});

app.get("/login", (req, res) => {
  res.render('login');
});

app.listen(PORT, () => {
  console.log('Example app listening on port ');
}); 

app.post("/login", (req, res) => {

  if(req.body.email && req.body.password){

    let isEmailAndPasswordMatched = false;
    let tempUserId;	  
    for (let key in users) {
      if(users[key].email === req.body.email){ 
        if(bcrypt.compareSync(req.body.password, users[key].password)){
          isEmailAndPasswordMatched = true;
	  tempUserId = key;
          break;
        }
      }
    }

    if(isEmailAndPasswordMatched){
      req.session.user_id =  tempUserId;
      res.redirect('/');
    }else{
      res.status(400);
      res.send("Email or Password doesnt match");
    }

  }else{
    res.status(400); 
    res.send('Email and Password Cannot be Empty');
  }
  
});

app.get("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect('/urls');
});

app.get("/u/:id", (req, res) => {
  if(updatedDatabase[req.params.id]){
    let url = updatedDatabase[req.params.id].longURL;
    res.redirect(url.toString());
  }else{
    res.end("Redirect failed, Please check your short URL or format of Long URL add http/https/www in front");
  }
});

