// ==UserScript==
// @name        Omnivox Auto Login
// @namespace   why
// @description Save password and automatically log in on omnivox.ca
// @author      WengH
// @version     1.3
// @icon        https://marianopolis.omnivox.ca/intr/UI/Themes/Omnivox_Defaut/images/header-logo-omnivox.svg
// @match       *://*.omnivox.ca/*
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       GM.deleteValue
// @run-at      document-idle
// ==/UserScript==
/* jshint esversion: 8 */

async function loginPage() {
  let content = GM.getValue("content", {});
  let hostname = GM.getValue("hostname", "");
  content = await content;
  hostname = await hostname;
  
  // automatically fill login info and submit
  if (content !== {} && hostname === location.hostname) {
    let now = Date.now();
    let lastAttempt = await GM.getValue("lastAttempt", 0);
    
    console.log(now - lastAttempt);
    
    if (now - lastAttempt < 10000) {
      // less than 10 seconds between 2 login attempts
      // probably the wrong password, clear everything
      
      console.log("Login timeout, clearing saved information...");
      
      GM.deleteValue("content");
      GM.deleteValue("hostname");
      GM.deleteValue("lastAttempt");
      return
    }
    else {
      GM.setValue("lastAttempt", now);
  
      console.log("Logging in...");
      content.k = getRandomId();
      deserialize($('form'), $.param(content))
      $('form').submit();
    }
  }
  
  // capture login info otherwise
  else {
    document.forms[0].onsubmit = async function(){
      console.log("We're on login page, record login info");
      let content = $("form").serializeArray();
      GM.setValue("content", content);
      GM.setValue("hostname", location.hostname);
    };
  }
}

async function autoLogin() {
  let content = GM.getValue("content", "");
  let hostname = GM.getValue("hostname", "");
  content = await content;
  hostname = await hostname;
  
  if (content === "" || hostname === "") {
    console.log("Login info not registered, please log out and log in again");
    return;
  }
  
  console.log("Logging in...");
  
  content.k = getRandomId();
  $.post('https://' + hostname + '/intr/Module/Identification/Login/Login.aspx', $.param(content));
}

(async function() {
  // we don't want to run in iframe
  if (window.top !== window.self)
    return;
  
  console.log("Omnivox Auto Login started");
  // save username and password if we are in login form
  if (location.pathname === "/Login/Account/Login") {
    loginPage();
  }
  
  else {
    console.log("Automatic login activated");
    
    autoLogin();
    setInterval(autoLogin, 600000);
  }
})();


function getRandomId() {
  return Math.floor(900000000000000000000 + Date.now());
}


function deserialize(f, data) {
    var map = {},
        find = function (selector) { return f.is("form") ? f.find(selector) : f.filter(selector); };
    //Get map of values
    jQuery.each(data.split("&"), function () {
        var nv = this.split("="),
            n = decodeURIComponent(nv[0]),
            v = nv.length > 1 ? decodeURIComponent(nv[1]) : null;
        if (!(n in map)) {
            map[n] = [];
        }
        map[n].push(v);
    })
    //Set values for all form elements in the data
    jQuery.each(map, function (n, v) {
        find("[name='" + n + "']").val(v);
    })
    //Clear all form elements not in form data
    find("input:text,select,textarea").each(function () {
        if (!(jQuery(this).attr("name") in map)) {
            jQuery(this).val("");
        }
    })
    find("input:checkbox:checked,input:radio:checked").each(function () {
        if (!(jQuery(this).attr("name") in map)) {
            this.checked = false;
        }
    })
    return this;
}
