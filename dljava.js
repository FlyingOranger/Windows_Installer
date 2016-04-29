var fs = require('fs'),
	URL = require('url');

// TODO, download the latest version of java. I'm not sure how to figure that out just yet

// need to access them dynamically due to rerouting
var protocol = {
    http: require('http'),
    https: require('https')
};

console.log("IN HERE");

var ws = fs.createWriteStream(process.argv[2]);

var startURL;

if (process.argv[3] === "x64") startURL= "http://download.oracle.com/otn-pub/java/jdk/8u91-b14/jre-8u91-windows-x64.exe";
else startURL = "http://download.oracle.com/otn-pub/java/jdk/8u91-b14/jre-8u91-windows-i586.exe";

recurringRequest(startURL);

function recurringRequest( newLocation ){
    
    var newPath = URL.parse(newLocation);
    
    //console.log("Our new path", newPath);
    var url_options = {
		hostname: newPath.host,
		path: newPath.path,
		method: "GET",
		headers: {
			Cookie: "oraclelicense=accept-securebackup-cookie"
		}
	};
    
    protocol[newPath.protocol.substr(0, newPath.protocol.length -1)].request(url_options, res => {
        
        //console.log(res.statusCode);
        //console.log(res.headers);
        if (res.statusCode == 302){
            
            recurringRequest( res.headers.location);
            
        } else if (res.statusCode == 200){
            // wow... we actually got the file
            res.pipe(ws);
            
        }  
    }).end();    
}