var fs = require('fs'),
	URL = require('url'),
    path = require('path'),
    exec = require('child_process').execSync,
	https = require('https');


module.exports = cb => {
    
    var installCB = cb;

    if (process.argv[2] === "install"){
        releaseInfo = {};

        installCB = () => {

            // install new apps only if folder doesn't already exist
            if (!fs.existsSync( path.join( __dirname, "Notification_Apps"))){
                
                downloader('https://github.com/RedditCanFly/Notification_Apps/archive/master.zip', () => {
                    fs.renameSync( path.join( __dirname, "Notification_Apps-master" ), path.join( __dirname, "Notification_Apps"));

                    // we're going to initially say that we are launching on startup
                    var startupManager = require("./RedditCanFly/lib/startup_manager");
                    startupManager.setState(true);
                

                    cb();
                });
            } else {
                
                // we're going to initially say that we are launching on startup
                var startupManager = require("./RedditCanFly/lib/startup_manager");
                startupManager.setState(true);
                
                cb();
                
            }
        };
    } else 
        releaseInfo = require('./releaseInfo');


    checkForNewRelease("RedditCanFly", () => checkForNewRelease("JavaGUI", installCB ));
    
};


// helper functions
// simple https request to get the last release for the specified repo
function checkForNewRelease( repoName, next ){
    
    var url_options = {
        hostname: "api.github.com",
        path: "/repos/RedditCanFly/" + repoName + "/releases/latest",
        method: "GET",
        headers: {
            "user-agent": "RedditCanFly updater checking latest release"
        }
    };

    https.request(url_options, res => {

        var data = "";
        res.setEncoding('utf8');
        res.on('data', chunk => data += chunk);
        res.on('end', () => {

            data = JSON.parse(data);

            if ( data.id !== releaseInfo[repoName]){
                releaseInfo[repoName] = data.id;
                fs.writeFileSync( path.join( __dirname, "releaseInfo.json"), JSON.stringify( releaseInfo ));
				deleteFolder( path.join (__dirname, repoName));
                downloader(data.zipball_url, longFileName => {
                    
                    longFileName = path.basename( longFileName, ".zip");
                    var folderName = "RedditCanFly-" + repoName + "-" + longFileName.substr( longFileName.length - 7, longFileName.length);
                    fs.renameSync( path.join( __dirname, folderName ), path.join( __dirname, repoName));
                    
                    next();
                });
            }
            
            next();
        });

    }).end();
    
}

// downloads the repo at the URL. handles redirets
function downloader( downloadUrl, cb ){

    // need to access them dynamically due to rerouting
    var protocol = {
        http: require('http'),
        https: require('https')
    };
    
    var newPath = URL.parse( downloadUrl );

    //console.log("Our new path", newPath);
    var url_options = {
        hostname: newPath.host,
        path: newPath.path,
        method: "GET",
        headers: {
            "user-agent": "RedditCanFly checking for latest release"
        }
    };

    protocol[newPath.protocol.substr(0, newPath.protocol.length -1)].request(url_options, res => {

        console.log(res.statusCode);
        //console.log(res.headers);
        if (res.statusCode == 302){

            downloader( res.headers.location, cb);

        } else if (res.statusCode == 200){

            var filename = res.headers["content-disposition"].split("; ")[1].split("=")[1];
            var ws = fs.createWriteStream(filename);

            res.pipe(ws);

            ws.on('finish', () => {
                unzip( filename );
                fs.unlinkSync( path.join( __dirname, filename) );
                if (cb) cb( filename );
            });

        }  
    }).end();    
}

// unzips the downloaded repo, depending on operating system
function unzip(filename){

    if (process.platform === "win32")
        exec("cscript //B w_unzip.vbs " + filename);
    
}

// deletes the previous folders if there is an update
function deleteFolder(p) {
  if( fs.existsSync(p) ) {
    fs.readdirSync(p).forEach(function(file,index){
      var curPath = path.join(p, file);
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolder(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(p);
  }
};

