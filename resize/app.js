let express = require('express');
let app = express();
let multer = require('multer');
let crypto = require('crypto');
let path = require('path');
const {spawn} = require('child_process');
const request = require('request');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: '/tmp/images',
    filename: function (req, file, callback) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            if (err) return callback(err);
            callback(null, raw.toString('hex') + path.extname(file.originalname));
        });
    }
});

const upload = multer({
    storage: storage
}).single('file');

app.post('/resize', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.end('Error');
        } else {
            resize(res, req.file.path, req.body.size)
        }
    });
});

app.post('/resize/percent', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.end('Error');
        } else {
          resizePercent(req,res,req.file.path,req.body.percent)
        }
    });
});


function resize(res, mypath, size) {
    const originalFileExtension = mypath.split('.').pop();
    const newFileName = mypath.replace(/\.[^/.]+$/, "") + "_resized." + originalFileExtension;
    const convert = spawn('convert', [mypath, "-resize", size, newFileName], {shell:true});
    convert.on('close', function (code, signal) {
        res.sendFile(newFileName)
    });
}

function resizePercent(req, res, mypath, percent) {


    const formData = {
        filter: 'Image Height',
        file: fs.createReadStream(mypath),
    };
    request.post({
        url: 'http://exifdata:8082/exifdata/filtered',
        formData: formData,
        encoding: 'binary'
    }, function optionalCallback(err, httpResponse, body) {
        if (err) {
            return console.error('upload failed:', err);
        }
        let size = parseFloat(body.toString().split(":")[1].trim()) * (parseFloat(percent) / 100);
        const originalFileExtension = mypath.split('.').pop();
        const newFileName = mypath.replace(/\.[^/.]+$/, "") + "_resized." + originalFileExtension;
        const convert = spawn('convert', [mypath, "-resize", size, newFileName],{shell:true});
        convert.on('close', function (code, signal) {
            res.sendFile(newFileName)
        });

    });
}


app.listen(8083);
console.log("Resize service (nodejs) started")