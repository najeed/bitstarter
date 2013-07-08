#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2

 + restler
   - https://github.com/danwrong/restler

*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://intense-earth-7167.herokuapp.com/";
var DUMMY_HTML = "dummy.html";
var willPrint = false;

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var getURL = function(url) {
    willPrint = true;
    rest.get(url).on('complete',  function(result, response) {
      if (result instanceof Error) {
        console.error('Error: ' + util.format(response.message));
      } else {
        fs.writeFileSync(DUMMY_HTML, result);
        chkAndPrintJSON();
        fs.unlinkSync(DUMMY_HTML);
      }
    });
};

var chkAndPrintJSON = function() {
    var checkJson = checkHtmlFile(program.file || DUMMY_HTML, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

if(require.main == module) {
    program
        .option('-c, --checks <file> ', 'Path to checks.json', assertFileExists, CHECKSFILE_DEFAULT)
        .option('-f, --file [file] ', 'Path to index.html', assertFileExists, HTMLFILE_DEFAULT)
        .option('-u, --url [url] ', 'URL to index.html', getURL, URL_DEFAULT)
        .parse(process.argv);
    if(!willPrint) {
        chkAndPrintJSON();
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

