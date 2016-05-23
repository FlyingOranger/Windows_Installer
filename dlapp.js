var fs = require('fs'),
	URL = require('url'),
    path = require('path'),
    exec = require('child_process').execSync,
	https = require('https');

/* This script makes https github api requests to get the latest release of  
* FlyingOranger/FlyingOranger
* FlyingOranger/JavaGUI
*
* If there is a new release, it delets the old folders / files
* it downloads the new release
*
* If we're installing, then we also download the FlyingOranger/notification_apps repository
*/

module.exports = cb => {
    
    var installCB = cb;

    if (process.argv[2] === "install"){
        releaseInfo = {};

        installCB = () => {

            // install new apps only if folder doesn't already exist
            if (!fs.existsSync( path.join( __dirname, "Notification_Apps"))){
                
                downloader('https://github.com/FlyingOranger/Notification_Apps/archive/master.zip', () => {
                    
                    // unzip it and delete the .zip file after
                    unzip( "Notification_Apps-master.zip" );
                    fs.unlinkSync( path.join( __dirname, "Notification_Apps-master.zip") );
                    
                    fs.renameSync( path.join( __dirname, "Notification_Apps-master" ), path.join( __dirname, "Notification_Apps"));

                    // we're going to initially say that we are launching on startup
                    var startupManager = require("./FlyingOranger/lib/startup_manager");
                    startupManager.setState(true);
                

                    cb();
                });
            } else {
                
                // we're going to initially say that we are launching on startup
                var startupManager = require("./FlyingOranger/lib/startup_manager");
                startupManager.setState(true);
                
                cb();
                
            }
        };
    } else 
        releaseInfo = require('./releaseInfo');


    checkForNewRelease("FlyingOranger", () => checkForNewRelease("JavaGUI", installCB ));
    
};


// helper functions
// simple https request to get the last release for the specified repo
function checkForNewRelease( repoName, next ){
    
    var url_options = {
        hostname: "api.github.com",
        path: "/repos/FlyingOranger/" + repoName + "/releases/latest",
        method: "GET",
        headers: {
            // user agent is required here or we don't get a response
            "user-agent": "FlyingOranger updater checking latest release"
        }
    };

    https.request(url_options, res => {

        var data = "";
        res.setEncoding('utf8');
        res.on('data', chunk => data += chunk);
        res.on('end', () => {

            data = JSON.parse(data);

            // check release ids to see if we have a new release
            if ( data.id !== releaseInfo[repoName]){
                
                // we have a new release, so save this one's id
                releaseInfo[repoName] = data.id;
                fs.writeFileSync( path.join( __dirname, "releaseInfo.json"), JSON.stringify( releaseInfo ));
                
                if ( repoName === "FlyingOranger"){
                    
                    // delete the previous release
                    deleteFolder( path.join (__dirname, repoName));
                    
                    // download the new release in a zip
                    downloader(data.zipball_url, longFileName => {
                        
                        // unzip it and delete the .zip file after
                        unzip( longFileName );
                        fs.unlinkSync( path.join( __dirname, longFileName) );

                        // rename the folder we unzipeed, which has some conveluded name
                        // based on the git commit last 7 alphanumerics
                        longFileName = path.basename( longFileName, ".zip");
                        var folderName = "FlyingOranger-" + repoName + "-" + longFileName.substr( longFileName.length - 7, longFileName.length);
                        fs.renameSync( path.join( __dirname, folderName ), path.join( __dirname, repoName));

                        next();
                    });
                } else if ( repoName === "JavaGUI"){
                    
                    // get rid of the old jar
                    var oldPath =  path.join( __dirname, "JavaGUI.jar");
                    if (fs.existsSync( oldPath )) 
                        fs.unlinkSync( oldPath );
                    
                    // our JavaGUI.jar is uploaded as an asset on our release
                    downloader( data.assets[0].browser_download_url, next);
                    
                }
            }
            else next();
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

    var url_options = {
        hostname: newPath.host,
        path: newPath.path,
        method: "GET",
        headers: {
            "user-agent": "FlyingOranger checking for latest release"
        }
    };

    // substring to get rid of the colon after https: for example
    protocol[newPath.protocol.substr(0, newPath.protocol.length -1)].request(url_options, res => {

        if (res.statusCode == 302){

            downloader( res.headers.location, cb);

        } else if (res.statusCode == 200){

            var filename = res.headers["content-disposition"].split("=")[1];
            var ws = fs.createWriteStream(filename);

            res.pipe(ws);

            ws.on('finish', () => {
                
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

