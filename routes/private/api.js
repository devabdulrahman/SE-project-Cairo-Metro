const { isEmpty } = require("lodash");
const { v4 } = require("uuid");
const db = require("../../connectors/db");
const roles = require("../../constants/roles");
const { getSessionToken } = require('../../utils/session');
const { password } = require("pg/lib/defaults");
const getUser = async function (req) {
  const sessionToken = getSessionToken(req);
  if (!sessionToken) {
    return res.status(301).redirect("/");
  }
  console.log("hi", sessionToken);
  const user = await db.select("*").from("se_project.sessions").where("token", sessionToken).innerJoin("se_project.users","se_project.sessions.userid","se_project.users.id").innerJoin("se_project.roles","se_project.users.roleid","se_project.roles.id").first();
  console.log("user =>", user);
  user.isNormal = user.roleid === roles.user;
  user.isAdmin = user.roleid === roles.admin;
  user.isSenior = user.roleid === roles.senior;
  console.log("user =>", user)
  return user;
};

module.exports = function (app) {
  // example
  app.get("/users", async function (req, res) {
    try {
      const user = await getUser(req);
      const users = await db.select('*').from("se_project.users")

      return res.status(200).json(users);
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Could not get users");
    }

  });
 /* app.post('/api/v1/users', async (req, res) => {
    try {
      const userData = req.body;
      console.log(req.body);
      const checkEmail = await db.select("*").from("se_project.users").where("email",req.body.email);
      if (checkEmail.length===0){
        db('se_project.users').insert(userData).then(()=>res.send('added User'));
      }
      else{
        return res.send('email already registered');
      }
    } catch (e) {
      console.log(e.message);
      return res.status(400).send("Invalid Data , Check again");

    }
  })

  app.post("/api/v1/users/login", async (req, res) => {
    const loginData = req.body;
    try {
      const userReturned = await db.select("*").from("se_project.users").where("email", loginData.email).where("password", loginData.password).first();
      if (userReturned===undefined){
        return res.send('email not registered');
      }else{
//      res.redirect('/dashboard')
        res.status(201).send('User Found');
        return  
      }
    }catch(e ){ res.status(400).send(e.message)};
  })*/
  app.put("/api/v1/password/reset", async (req, res) => {
    const targetUser = await getUser(req);
    try {
      if(targetUser.password !==req.body.newPassword){
        await db.select("password").from("se_project.users").where("email",targetUser.email).first().update("password",req.body.newPassword).then(()=>{res.status(200).send('pass updated')}) ;
      }
      else{
        res.status(400).send('You cannot resue your old password');
      }
  }catch(e ){ res.status(400).send(e.message)};
  })





};
