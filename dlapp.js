var fs = require('fs'),
	URL = require('url'),
    path = require('path'),
    exec = require('child_process').execSync,
	https = require('https');

// load releaseInfo if it exists
var releaseInfo;
try {
    releaseInfo = require('./releaseInfo');
} catch (e){ releaseInfo = {}; }

// need to access them dynamically due to rerouting
var protocol = {
    http: require('http'),
    https: require('https')
};

if (process.argv[2] === "install"){
    downloader('https://github.com/RedditCanFly/Crawlers/archive/master.zip', () => {
        fs.renameSync( path.join( __dirname, "Crawlers-master" ), path.join( __dirname, "Crawlers"));
    })
}

checkForNewRelease("RedditCanFly");
checkForNewRelease("JavaGUI");


function checkForNewRelease( repoName ){
    
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
                downloader(data.zipball_url, longFileName => {
                    longFileName = path.basename( longFileName, ".zip");
                    var folderName = "RedditCanFly-" + repoName + "-" + longFileName.substr( longFileName.length - 7, longFileName.length);
                    fs.renameSync( path.join( __dirname, folderName ), path.join( __dirname, repoName));
                });
            }
        });

    }).end();
    
}


function downloader( downloadUrl, cb ){

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

function unzip(filename){

    if (process.platform === "win32")
        exec("cscript //B w_unzip.vbs " + filename);
    
}


