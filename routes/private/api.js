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
  const role = await db.select("*").from("se_project.roles").where("id",user.roleid).first();
 
  console.log("user =>", user);
  user.isNormal = role.role === roles.user;
  user.isAdmin = role.role === roles.admin;
  user.isSenior = role.role === roles.senior;
  console.log(user.isAdmin);
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
  app.get("/api/v1/zones",async (req,res)=>{
    try{
      const user =await getUser(req);
      if (user.isAdmin!==true){
        const zones = await db.select("*").from("se_project.zones");
        res.status(200).json(zones);
      }else{
        throw new Error('you are not permitted to view this page');
      }
    }catch(e){
      res.status(400).send(e.message);
    }
  })
  
  app.post("api/v1/payment/subscription",async (req,res)=> {
    const {
      creditCardNumber,
      holderName,
      paidAmount,
      subType,
      zoneId  
    }= req.body 
    try{
      if (user.isAdmin!==true){
        const purchaseId = v4();
        const wallet =await db.select("*").from("se_project.wallets")
        .where(userid,getUser(req).id).first().then(function(row) {row[0].walletid});
        const credit = await db.select("*").from("se_project.wallets")
        .where(walletid,wallet).first().then(function(row) {row[0].walletcredit});
        if (credit< req.body.paidAmount & (req.body.creditCardNumber<10000000|req.body.creditCardNumber===null)){
          throw new Error("You don't have enough credit in your wallet , consider using a credit card");
        }
        else{
          const userID = getUser(req).id;
          await db("se_project.transactions").insert({amount:req.body.paidAmount,userid:userID,purchasedid:purchaseId,walletid:wallet});
          const creditCardAvailable = await db.select("*").from("se_project.creditcards").where("userid",getUser.id).where("creditcardnumber",req.body.creditCardNumber).first();
          const diff = credit - req.body.paidAmount ; 
          await db.select("*").from("se_project.wallets").where(walletid,wallet).first().update("walletcredit",diff);
          if(!creditCardAvailable){
            await db("se_project.creditcards").insert({userid:userID,creditcardnumber:req.body.creditCardNumber,holdername:req.body.holderName});
          }
          res.status(200).send('successful transaction')
        }
    }
    else{
      throw new Error('you are not permitted to view this page');
    }
    }
    catch(e){
      res.status(400).send(e.message);
    }
  })
};
