function fun(){
	if(checkField()==true)
		userlogon();
}
function fun1(){
	if(checkField()==true)
		adminlogon();
}
function userlogon() 
{ 
	
	document.getElementById("form").action="logon";
	document.getElementById("form").submit();
} 

function adminlogon() 
{ 
	document.getElementById("form").action="adminlogon"; 
	document.getElementById("form").submit();
} 

function checkField(){
 
 var usernameValue = document.getElementById("username").value; 
 var passwordValue = document.getElementById("password").value; 
 usernameValue = usernameValue.replace(/\s/gi,"");
 passwordValue = passwordValue.replace(/\s/gi,"");
 if(usernameValue !== "" && passwordValue !== ""){ 
        return true;
 }else if(usernameValue == "" && passwordValue == ""){
	 
 document.getElementById("errorSpan").innerHTML="";
 document.getElementById("error_username").innerHTML = "username can not be blank";
 document.getElementById("error_password").innerHTML = "password can not be blank";
  
 return false ;
 }else if(usernameValue !== "" && passwordValue == ""){
 document.getElementById("errorSpan").innerHTML="";
 document.getElementById("password").focus() ;
 document.getElementById("error_username").innerHTML = "";
 document.getElementById("error_password").innerHTML = "password can not be blank";
 return false ;
 }else if(passwordValue !== "" && usernameValue == ""){
 document.getElementById("errorSpan").innerHTML="";
 document.getElementById("username").focus() ;
 document.getElementById("error_password").innerHTML = "";
 document.getElementById("error_username").innerHTML = "username can not be blank";
 return false ;
 }
}
