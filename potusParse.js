const rp = require('request-promise');
const $ = require('cheerio');

const potusParse = function(url) {
    return rp(url)
        .then(function(html) {
            return {
                Naslov:($('.article__title', html).text()),
                Informacije:($('.article__info', html).text()),
                Čas_branja:($('.article__readingtime', html).text()),
                Povzetek:($('.article__summary', html).text()),
            };
        })
        .catch(function(err) {
            //handle error
        });
};

module.exports = potusParse;