var express = require('express');
var puppeteer = require('puppeteer');

const Article = require('../models/Article');

var router = express.Router();

const WEBSITES = [
  {
    name: '24ur',
    url: 'https://www.24ur.com/',
    selectors: {
      newsList: {
        selector: '.news-list',
      },
      newsListItem: {
        selector: '.news-list__item',
      },
    },
  },
];
/* GET scraper info. */
router.get('/', function(req, res, next) {
  Article.find({}, function(err, articles) {
    res.send(articles);
  });
});

router.get('/run', function(req, res, next) {
  (async () => {
    const browser = await puppeteer.launch();
    console.log('Launched!');

    WEBSITES.forEach(async website => {
      console.log('Scraping:', website.url);

      let page = await browser.newPage();
      await page.setViewport({width: 1366, height: 768});
      await page.goto(website.url);
      /*
      await page.screenshot({
        path: `data/screenshots/screenshot_${
          website.name
        }_${new Date().getTime()}.png`,
        fullPage: true
      });
      */

      let selector = `${website.selectors.newsList.selector} ${
          website.selectors.newsListItem.selector
          }`;
      await page.waitForSelector(selector);
      const result = await page.evaluate(selector => {
        const elements = document.querySelectorAll(selector);
        // do something with elements, like mapping elements to an attribute:
        return Array.from(elements).map(element => {
          shortTitle = null;
          shortDescription = null;
          shortTitleElement = element.querySelector(
              '.card__label.label.label--card',
          );
          if (shortTitleElement !== null) {
            shortTitle = shortTitleElement.innerText;
          }

          shortDescriptionElement = element.querySelector('.card__summary');

          if (shortDescriptionElement !== null) {
            shortDescription = shortDescriptionElement.innerText;
          }

          /** @type {HTMLPictureElement} */
          pictureEl = element.querySelector('picture');

          images = [];
          pictureEl.querySelectorAll('source').forEach(function(el) {
            images.push(el.getAttribute('srcset'));
          });

          return {
            url: element.querySelector('.card').href,
            title: element.querySelector('.card__title-inside').innerText,
            shortTitle: shortTitle,
            shortDescription: shortDescription,
            images: images,
          };
        });
      }, selector);

      result.forEach(item => {
        var article = new Article({
          url: item.url,
          title: item.title,
          shortTitle: item.shortTitle,
          shortDescription: item.shortDescription,
          images: item.images,
        });
        article.save((err, article) => {
          if (err) return console.error(err);
          console.log('Created Article!', article);
        });
      });

      console.log('Parser stopped!');

      await browser.close();
      res.json(result);
    });
  })();
});

module.exports = router;
