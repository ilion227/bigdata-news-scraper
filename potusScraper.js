const rp = require('request-promise');
const $ = require('cheerio');
var fs = require('fs');

const potusParse = require('./potusParse');
const url = 'https://www.24ur.com/';

var obj = {
    info: []
};

//npm install --save request request-promise cheerio puppeteer
rp(url)
    .then(function(html){
        //success!
        const wikiUrls = [];
        var lng = $('.card.ng-star-inserted', html).length;
        for (let i = 0; i < lng; i++) {
            wikiUrls.push($('.card.ng-star-inserted', html)[i].attribs.href);
        }
        return Promise.all(
            wikiUrls.map(function(url) {
                return potusParse('https://www.24ur.com' + url);
            })
        );
    })
    .then(function(presidents) {
        obj = presidents;
        var json = JSON.stringify(obj);

        fs.writeFile('Trenutne_novice.json', json, 'utf8', function () {
            console.log("Novice zapisane v Trenutne_novice.json");
        });

        //console.log(presidents);
    })
    .catch(function(err) {
        //handle error
        console.log(err);
    });