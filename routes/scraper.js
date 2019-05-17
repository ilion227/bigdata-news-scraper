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
      article: {
        title: '.article__title',
        info: '.article__info',
        reading_time: '.article__readingtime-time',
        author: '.article__details-main a',
        summary: '.article__summary',
        content: '.article__body-dynamic.dev-article-contents',
      },
    },
  },
];

/* GET scraper info. */
router.get('/', function(req, res, next) {
  Article.find({}, async function(err, articles) {
    res.send(articles);
  });
});

async function scrapeWebsite(website) {
  const browser = await puppeteer.launch({headless: true});
  console.log('Launched!');

  WEBSITES.forEach(async website => {
    console.log('Scraping:', website.url);

    let page = await browser.newPage();
    await page.setViewport({width: 1366, height: 768});
    await page.goto(website.url, {waitUntil: 'networkidle0'});

    let selector = `.box .grid div${website.selectors.newsList.selector} div${
        website.selectors.newsListItem.selector
        }`;
    await page.waitForSelector(selector);

    await page.evaluate(async () => {
      await new Promise((resolve, reject) => {
        try {
          let lastScrollTop = document.scrollingElement.scrollTop;
          // Scroll to bottom of page until we can't scroll anymore.
          const scroll = () => {
            document.scrollingElement.scrollTop += 100;//(viewPortHeight / 2);
            if (document.scrollingElement.scrollTop !== lastScrollTop) {
              lastScrollTop = document.scrollingElement.scrollTop;
              requestAnimationFrame(scroll);
            } else {
              resolve();
            }
          };
          scroll();
        } catch (err) {
          console.log(err);
          reject(err.toString());
        }
      });
    });

    console.log('Scrape main');
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
          element: element,
        };
      });
    }, selector);

    console.log(result);

    // New browser page for single links
    page = await browser.newPage();
    await page.setViewport({width: 1366, height: 768});

    for (let item of result) {
      console.log('Parse single', item.url);
      if (item.url.length > 0) {
        console.log('Scrape single!');
        await page.goto(item.url, {waitUntil: 'networkidle0'});
        console.log('NAVIGATED TO', item.url);
        var singleData = await page.evaluate(async selectors => {
          const title = document.querySelector(selectors.title).innerText;
          const info = document.querySelector(selectors.info).innerText;
          const reading_time = document.querySelector(
              selectors.reading_time).innerText;
          const author = document.querySelector(selectors.author).innerText;
          const summary = document.querySelector(selectors.summary).innerHTML;
          const content = document.querySelector(selectors.content).innerHTML;

          return {
            title,
            info,
            reading_time,
            author,
            summary,
            content,
          };
        }, website.selectors.article);
        console.log(item.url, singleData.title);
      } else {
        singleData = {};
      }

      let countArticles = await Article.countDocuments(
          {'data.title': item.title}).exec();
      console.log('COUNT', countArticles);
      if (countArticles) {
        console.log('Exists!');
        continue;
      }

      var article = new Article({
        url: item.url,
        title: item.title,
        shortTitle: item.shortTitle,
        shortDescription: item.shortDescription,
        images: item.images,
        data: singleData,
      });

      console.log('Article created, not yet saved!');

      article.save((err, article) => {
        if (err) return console.error(err);
        console.log('Created Article!');
      });

      console.log('Parser stopped!');

    }
    await browser.close();
  });
}

router.get('/run', function(req, res, next) {
  scrapeWebsite(WEBSITES[0]);

  res.redirect('/articles');
});

module.exports = router;
