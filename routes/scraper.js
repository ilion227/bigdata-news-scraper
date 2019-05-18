const express = require('express');
const puppeteer = require('puppeteer');
const moment = require('moment');

const Article = require('../models/Article');

const router = express.Router();

const WEBSITES = [
	{
		name: '24ur',
		url: 'https://www.24ur.com/',
		selectors: {
			newsList: '.news-list',
			newsListItem: '.news-list__item',
			article: {
				title: '.card__title-inside',
				thumbnailTag: '.card__label.label.label--card',
				thumbnailDescription: '.card__summary',
				url: '.card',
				images: 'picture source',
				info: '.article__info',
				readingTime: '.article__readingtime-time',
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
		let selectors = website.selectors;

		console.log('Scraping:', website.url);

		let page = await browser.newPage();
		await page.setViewport({width: 1366, height: 768});
		await page.goto(website.url, {waitUntil: 'networkidle0'});

		let selector = `.box .grid div${selectors.newsList} div${selectors.newsListItem}`;
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

		let results = [];
		let elements = await page.$$(selector);

		for (let i = 0; i < elements.length; i++) {
			let element = elements[i];
			let title = await element.$eval(selectors.article.title, node => node.innerText.trim());

			let thumbnailTag = null;
			if (await element.$(selectors.article.thumbnailTag) !== null) {
				thumbnailTag = await element.$eval(selectors.article.thumbnailTag, node => node.innerText.trim());
			}

			let thumbnailDescription = null;
			if (await element.$(selectors.article.thumbnailDescription) !== null) {
				thumbnailDescription = await element.$eval(selectors.article.thumbnailDescription,
						node => node.innerText.trim());
			}
			let url = await element.$eval(selectors.article.url, node => node.href);
			if (!url) continue;

			let images = await element.$$eval(selectors.article.images, nodes => {
				let sources = [];
				for (let i = 0; i < nodes.length; i++) {
					sources.push(nodes[i].getAttribute('srcset'));
				}
				return sources;
			});

			results.push(new Article({
				title,
				url,
				images,
				meta: {
					thumbnailTag,
					thumbnailDescription,
				},
			}));
		}

		// New browser page for single links
		page = await browser.newPage();
		await page.setViewport({width: 1366, height: 768});

		for (let i = 0; i < results.length; i++) {
			let article = results[i];

			console.log('Parse single', article.url);

			await page.goto(article.url, {waitUntil: 'networkidle0'});

			const info = await page.$eval(selectors.article.info, node => node.innerText.trim());
			const readingTime = await page.$eval(selectors.article.readingTime, node => node.innerText.trim());
			const author = await page.$eval(selectors.article.author, node => node.innerText.trim());
			const summary = await page.$eval(selectors.article.summary, node => node.innerHTML);
			const content = await page.$eval(selectors.article.content, node => node.innerHTML);

			// Parse article's info
			let infoArr = info.split('|');
			let locationAndDate = infoArr[0].split(',');
			let location = locationAndDate[0];
			let datetime = locationAndDate[1] + ' ' + locationAndDate[2];

			let publishedAt = moment(datetime, 'DD.MM.YYYY hh:mm').toDate();
			let modifiedAt = infoArr[1];

			article.author = author;
			article.summary = summary;
			article.content = content;
			article.meta = {...article.meta, location, publishedAt, modifiedAt, readingTime};

			let countArticles = await Article.countDocuments(
					{'title': article.title}).exec();
			if (countArticles) {
				continue;
			}

			article.save((err, article) => {
				if (err) return console.error(err);
			});
		}
		await browser.close();
	});
}

router.get('/run', async function(req, res, next) {
	await scrapeWebsite(WEBSITES[0]);

	res.redirect('/articles');
});

module.exports = router;
