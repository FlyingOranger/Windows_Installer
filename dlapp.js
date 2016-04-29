var fs = require('fs'),
	URL = require('url');

// need to access them dynamically due to rerouting
var protocol = {
    http: require('http'),
    https: require('https')
};

module.exports = function(dlFileName, startURL, cb){
    
    var ws = fs.createWriteStream(dlFileName);

    //var startURL = "https://github.com/JBarna/RedditCanFly/archive/release.zip";

    recurringRequest(startURL);

    function recurringRequest( newLocation ){

        var newPath = URL.parse(newLocation);

        //console.log("Our new path", newPath);
        var url_options = {
            hostname: newPath.host,
            path: newPath.path,
            method: "GET"
        };

        protocol[newPath.protocol.substr(0, newPath.protocol.length -1)].request(url_options, res => {

            console.log(res.statusCode);
            //console.log(res.headers);
            if (res.statusCode == 302){

                recurringRequest( res.headers.location);

            } else if (res.statusCode == 200){
                // wow... we actually got the file
                res.pipe(ws);
                
                ws.on('finish', () => {
                    if (cb) cb();
                });

            }  
        }).end();    
    }
};

// if running directly from command line
if (require.main === module){
    module.exports( process.argv[2], process.argv[3]);
}