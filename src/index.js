"use strict";

let Rest = require('solid-rest/src/rest.js');
var rest 
function setRestHandlers(handlers){
  if(typeof handlers !="undefined"){
    rest = new Rest ( handlers ); 
  }
  else if(typeof rest==="undefined") {
    let File = require('solid-rest/src/file.js');
    let Mem = require('solid-rest/src/localStorage.js');
    rest = new Rest ([ new File, new Mem ])
  }
  return rest
}

const crossFetch      = require('cross-fetch');
const SolidClient     = require('@solid/cli/src/SolidClient');
const IdentityManager =require('@solid/cli/src/IdentityManager');
const fs = require('fs');
const path = require('path');
exports.rest = rest;
exports.name = "cli";
exports.fetch = fetch;
exports.currentSession = currentSession;
exports.login = login;
exports.logout = logout;
exports.getCredentials = getCredentials;
exports.setRestHandlers = setRestHandlers;

async function fetch(url,request){
    if( url.match(/^(file:|app:)/) ){
        if(typeof(rest)==="undefined") setRestHandlers()
        return await rest.fetch(url,request)        
    }
    request = request || {};
    request.method = request.method || 'GET';
    request.headers = request.headers || {};
    if( session ) {
         let token = await client.createToken(url, session);
         saveIdentityManager(identityManager, settingsFile)
         request.credentials = "include";
         request.headers.authorization= `Bearer ${token}`;
    }
    return crossFetch(url,request);
}
async function logout() {
    session = undefined;    
    return(1);
}
async function currentSession(){
    if (session && !client.isExpired(session))
        return(session)
    else { return null; }
}
async function getCredentials(fn){
        let home = process.env.HOME || ""
        fn = fn || path.join( home,".solid-auth-cli-config.json")
        var creds={};
        if(fs.existsSync(fn))  {
            try {
                creds = fs.readFileSync(fn,'utf8');
            } catch(err) { throw new Error("read file error "+err) }
            try {
                creds = JSON.parse( creds );
                if(!creds) throw new Error("JSON parse error : "+err)
            } catch(err) { throw new Error("JSON parse error : "+err) }
        }
        else {
            creds = {
                idp      : process.env.SOLID_IDP,
                username : process.env.SOLID_USERNAME,
                password : process.env.SOLID_PASSWORD,
                base     : process.env.SOLID_BASE
            } 
        }
        return(creds)
}

var session;
const settingsFile = path.join(process.env.HOME || "", '.solid-cli.json');
const identityManager = loadIdentityManager(settingsFile);
const client = new SolidClient({ identityManager });

// Instantiates the identity manager from the given settings file
function loadIdentityManager(settingsFile) {
  let settingsJson;
  try { settingsJson = fs.readFileSync(settingsFile, 'utf8'); }
  catch (error) { settingsJson = '{}'; }
  return IdentityManager.fromJSON(settingsJson);
}

// Saves the identity manager into a settings file
function saveIdentityManager(identityManager, settingsFile) {
  const settingsJSON = identityManager.toJSON();
  fs.writeFileSync(settingsFile, settingsJSON);
}

async function login( cfg ) {
  if( typeof cfg==="string" ) cfg=undefined // s-a-client compatability 
  cfg = cfg || await getCredentials()
  if(typeof cfg.password === "undefined"){
    throw new Error("Couldn't find login config, please specify environment variables SOLID_IDP, SOLID_USERNAME, and SOLID_PASSWORD or see the README for solid-auth-cli for other login options.");
  }
  session = await client.login(
    cfg.idp,{username:cfg.username,password:cfg.password}
  )
  if(session) {
    session.webId = session.idClaims.sub
    return(session);
  }
  else { throw new Error("could not log in") }
}
