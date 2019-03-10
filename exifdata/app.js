let express = require('express');
let app = express();
let multer  = require('multer');
let crypto = require('crypto');
let path = require('path');
const { spawn } = require( 'child_process' );


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

app.post('/exifdata',(req,res) => {
    upload(req,res,(err) => {
       if (err) {
           res.end('Error');
       } else {
           readExifData(req.file.path,res)
       }
    });
});

app.post('/exifdata/filtered',(req,res) => {
    upload(req,res,(err) => {
        if (err) {
            res.end('Error');
        } else {
            readExifDataGrepped(res,req.file.path,req.body.filter)
        }
    });
});

function readExifDataGrepped(res,path,filter) {
    const exiftool = spawn('exiftool',[path,"|","grep","'"+filter+"'"],{shell:true});
    exiftool.stdout.on('data', data=> {
        res.end(data)
    });
}

function readExifData(path,res) {
    const exiftool = spawn( 'exiftool', [ path ] );
    exiftool.stdout.on('data', data=> {
        console.log(data);
        res.end(data)
    });
}

app.listen(8082);