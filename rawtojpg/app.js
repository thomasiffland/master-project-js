let express = require('express');
let app = express();
let multer  = require('multer');
let crypto = require('crypto');
let path = require('path');
const { spawn } = require( 'child_process' );
const uuidv4 = require('uuid/v4');
const request = require('request');
const fs = require('fs');

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

app.post('/rawtojpg',(req,res) => {
    upload(req,res,(err) => {
        if (err) {
            res.end('Error');
        } else {
            rawToJpg(req.file.path,res);


        }
    });
});


app.post('/rawtojpg/grayscale',(req,res) => {
    upload(req,res,(err) => {
       if (err) {
           res.end('Error');
       } else {
            rawToJpgWithGrayscale(req,req.file.path,res);
       }
    });
});




function rawToJpg(path, res) {
    const newFileName = path.replace(/\.[^/.]+$/, "") + ".jpg";
    const dcraw = spawn('dcraw',["-c","-w",path, "|","convert","-",newFileName], {shell: true});
    dcraw.on('close', function (code, signal) {
      res.sendFile(newFileName)
    });
}

function rawToJpgWithGrayscale(req, path, res) {
    const newFileName = path.replace(/\.[^/.]+$/, "") + ".jpg"
    const dcraw = spawn('dcraw',["-c","-w",path, "|","convert","-",newFileName], {shell: true});
    dcraw.on('close', function (code, signal) {
        const formData = {
            file: fs.createReadStream(newFileName),
        };
        request.post({url:'http://grayscale:8081/grayscale', formData: formData,encoding: 'binary'}, function optionalCallback(err, httpResponse, body) {
            if (err) {
                return console.error('upload failed:', err);
            }
            let uuid = uuidv4()
            fs.writeFile('/tmp/images/'+uuid+".jpg", body,'binary', (err) => {
                if (err) throw err;
                res.sendFile('/tmp/images/'+uuid+".jpg")
            });

        });
    });
}

app.listen(8080);
console.log("RawToJpg service (nodejs) started")