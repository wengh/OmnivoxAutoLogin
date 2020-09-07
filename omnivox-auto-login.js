// ==UserScript==
// @name        Omnivox Auto Login
// @namespace   why
// @description Save password and automatically log in on omnivox.ca
// @author      WengH
// @version     1.1
// @icon        https://marianopolis.omnivox.ca/intr/UI/Themes/Omnivox_Defaut/images/header-logo-omnivox.svg
// @match       *://*.omnivox.ca/*
// @grant       GM.getValue
// @grant       GM.setValue
// @run-at      document-idle
// ==/UserScript==
/* jshint esversion: 8 */

async function loginPage() {
  let content = GM.getValue("content", "");
  let hostname = GM.getValue("hostname", "");
  content = await content;
  hostname = await hostname;
  
  // automatically fill login info and submit
  if (content !== "" && hostname === location.hostname) {
    console.log("Logging in...");
    deserialize($('form'), content)
    $('form').submit();
    
    return;
  }
  
  // capture login info otherwise
  else {
    document.forms[0].onsubmit = async function(){
      console.log("We're on login page, record login info");
      let content = $("form").serialize();
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
  
  $.post('https://' + hostname + '/intr/Module/Identification/Login/Login.aspx', content);
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


function deserialize (f, data) {
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
