// var fs = require('fs');
import * as fs from 'fs';

var quotes = getQuotes();
var externalQuotesValue = 'single';
var symbols = /[\r\n%#()<>?\[\\\]^`{|}]/g;

let path = './include/icons';

let filenameToURLMap: { [filename: string]: string } = {};
let filenames: string[] = [];

fs.readdir(path, function (err, items) {

    console.log('Converting ' + items.length + ' files...');

    let iconCss: string = "";
    for (var i = 0; i < items.length; i++) {
        let filename: string = items[i];
        if (filename.endsWith('.svg')) {
            var contents = fs.readFileSync(path + "/" + filename, 'utf8');
            let url = getUrl(contents);
            filenames.push(filename);
            filenameToURLMap[filename] = url;

            iconCss += getCss(filename, url);
        }
    }

    fs.writeFile('./include/css/icons.css', iconCss, () => {
        console.log('Done!');
    });

    //replaceUrls(filenameToURLMap);

});

function replaceUrls(filenameToURLMap: { [filename: string]: string }) {

    let path = './css';

    fs.readdir(path, function (err, items) {

        console.log('Replacing urls in css-files...');

        for (var i = 0; i < items.length; i++) {
            let filename: string = items[i];
            if (filename.endsWith('.css') && filename != "icons.css") {

                var contents = fs.readFileSync(path + "/" + filename, 'utf8');

                var newContents = replaceUrlsInString(contents, filenameToURLMap);

                if(newContents != null && newContents != contents){
                    fs.writeFile(path + '/' + filename, newContents, () => { });
                }

            }
        }
    });
}


function replaceUrlsInString(contents: string, filenameToURLMap: { [filename: string]: string }) {

    let regEx = /(url\(.*\);) ?(\/\*img\(.*\)\*\/)/g;

    return contents.replace(regEx, function (match, g1, g2) {
        let filename = g2.replace("/*img(", "").replace(")*/", "");
        // console.log(filename);
        let url = filenameToURLMap[filename];
        if (url != null) {
            return url + "; " + g2;
        } else {
            return match;
        }
    });

}

function getUrl(contents: string) {
    let namespaced = addNameSpace(contents);
    let escaped = encodeSVG(namespaced);
    return `url(${quotes.level1}data:image/svg+xml,${escaped}${quotes.level1})`;
}

function getCss(filename: string, url: string): string {

    let resultCss = 'background-image: ' + url + ';';

    resultCss = '.img_' + filename.replace('.svg', '') + ' {\n' +
        '   width: 16px;\n   height: 16px;\n   background-repeat: no-repeat;\n   ' +
        resultCss + "\n}\n\n";

    return resultCss;
}



// Namespace
//----------------------------------------

function addNameSpace(data) {
    if (data.indexOf('http://www.w3.org/2000/svg') < 0) {
        data = data.replace(/<svg/g, `<svg xmlns=${quotes.level2}http://www.w3.org/2000/svg${quotes.level2}`);
    }

    return data;
}


// Encoding
//----------------------------------------

function encodeSVG(data) {
    // Use single quotes instead of double to avoid encoding.
    if (externalQuotesValue === 'double') {
        data = data.replace(/"/g, '\'');
    }
    else {
        data = data.replace(/'/g, '"');
    }

    data = data.replace(/>\s{1,}</g, "><");
    data = data.replace(/\s{2,}/g, " ");

    return data.replace(symbols, encodeURIComponent);
}


// Get quotes for levels
//----------------------------------------

function getQuotes() {
    const double = `"`;
    const single = `'`;

    return {
        level1: externalQuotesValue === 'double' ? double : single,
        level2: externalQuotesValue === 'double' ? single : double
    };
}