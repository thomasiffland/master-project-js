let express = require('express');
let app = express();
let multer  = require('multer');
let crypto = require('crypto');
let path = require('path');
const request = require('request');
const fs = require('fs');
const { spawn } = require( 'child_process' );
const uuidv4 = require('uuid/v4');


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

app.post('/grayscale',(req,res) => {
    upload(req,res,(err) => {
       if (err) {
           res.end('Error');
       } else {
            createGrayscaleImage(req.file.path,res);
       }
    });
});

app.post('/grayscale/resize',(req,res) => {
    upload(req,res,(err) => {
        if (err) {
            res.end('Error');
        } else {
           createGrayscaleImageWithResize(req,req.file.path,res,req.body.size)
        }
    });
});



function createGrayscaleImage(path,res) {
    const originalFileExtension = path.split('.').pop();
    const newFileName = path.replace(/\.[^/.]+$/, "") + "_grayscale." + originalFileExtension;
    const convert = spawn( "convert",[path,"-colorspace","Gray",newFileName] ,{shell: true});
    convert.on('close', function (code, signal) {
        res.sendFile(newFileName)
    });
}

function createGrayscaleImageWithResize(req,path,res,size) {
    const originalFileExtension = path.split('.').pop();
    const newFileName = path.replace(/\.[^/.]+$/, "") + "_grayscale." + originalFileExtension;
    const convert = spawn( "convert",[path,"-colorspace","Gray",newFileName] ,{shell: true});
    convert.on('close', function (code, signal) {
        const formData = {
            size: size,
            file: fs.createReadStream(newFileName),
        };
        request.post({url:'http://resize:8083/resize', formData: formData,encoding: 'binary'}, function optionalCallback(err, httpResponse, body) {
            if (err) {
                return console.error('upload failed:', err);
            }
            let uuid = uuidv4()
            fs.writeFile('/tmp/images/'+uuid+"."+originalFileExtension,body,'binary',(err) => {
                if (err) throw err;
                res.sendFile('/tmp/images/'+uuid+"."+originalFileExtension)
            });
        });
    });
}


app.listen(8081);
console.log("Grayscale service (nodejs) started")