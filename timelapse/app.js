let express = require('express');
let app = express();
let multer  = require('multer');
let crypto = require('crypto');
let path = require('path');
const { spawn } = require( 'child_process' );
var fs = require('fs');


const storage = multer.diskStorage({
    destination: '/tmp/images',
    filename: function (req, file, callback) {
        crypto.pseudoRandomBytes(16, function(err, raw) {
            if (err) return callback(err);
            callback(null, raw.toString('hex') + path.extname(file.originalname));
        });
    }
});

const upload = multer({
    storage: storage
}).single('file');

app.post('/timelapse',(req,res) => {
    upload(req,res,(err) => {
       if (err) {
           res.end('Error');
       } else {
           createTimelapse(res,req.file.path,req.body.framerate);
       }
    });
});




function createTimelapse(res,zip,framerate) {
    const dirToExtractTo = zip.replace(/\.[^/.]+$/, "");
    if (!fs.existsSync(dirToExtractTo)){
        fs.mkdirSync(dirToExtractTo);
    }
    const unzip = spawn('unzip',[zip,"-d",dirToExtractTo],{shell:true});
    unzip.on('close', function (code, signal) {
        const ffmpeg = spawn("ffmpeg", ["-r", framerate,"-pattern_type","glob","-i","*.png","-vcodec","libx264","timelapse.mp4"], {cwd: dirToExtractTo});
        ffmpeg.on('close', function (code, signal) {
            res.sendFile(dirToExtractTo + "/timelapse.mp4")
        });
    });
}



app.listen(8084);
console.log("Timelapse service (nodejs) started")

