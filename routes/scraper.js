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
			newsList: {
				selector: '.news-list',
			},
			newsListItem: {
				selector: '.news-list__item',
			},
			article: {
				title: '.article__title',
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

		let results = [];

		let elements = await page.$$(selector);

		for (let i = 0; i < elements.length; i++) {
			let element = elements[i];
			let title = await element.$eval(('.card__title-inside'), node => node.innerText.trim());

			let thumbnailTag = null;
			if (await element.$(('.card__label.label.label--card')) !== null) {
				thumbnailTag = await element.$eval(('.card__label.label.label--card'), node => node.innerText.trim());
			}

			let thumbnailDescription = null;
			if (await element.$(('.card__summary')) !== null) {
				thumbnailDescription = await element.$eval(('.card__summary'), node => node.innerText.trim());
			}
			let url = await element.$eval(('.card'), node => node.href);
			if (!url) continue;

			let images = await element.$$eval(('picture source'), nodes => {
				let sources = [];
				for (let i = 0; i < nodes.length; i++) {
					sources.push(nodes[i].getAttribute('srcset'));
				}
				return sources;
			});

			article = new Article({
				title,
				url,
				images,
				meta: {
					thumbnailTag,
					thumbnailDescription,
				},
			});

			results.push(article);
		}
		console.log('RESULTS', results);

		// New browser page for single links
		page = await browser.newPage();
		await page.setViewport({width: 1366, height: 768});

		for (let i = 0; i < results.length; i++) {
			let article = results[i];

			let selectors = website.selectors.article;

			console.log('Parse single', article.url);

			await page.goto(article.url, {waitUntil: 'networkidle0'});

			const info = await page.$eval(selectors.info, node => node.innerText.trim());
			const readingTime = await page.$eval(selectors.readingTime, node => node.innerText.trim());
			const author = await page.$eval(selectors.author, node => node.innerText.trim());
			const summary = await page.$eval(selectors.summary, node => node.innerHTML);
			const content = await page.$eval(selectors.content, node => node.innerHTML);

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
			console.log('COUNT', countArticles);
			if (countArticles) {
				console.log('Exists!');
				continue;
			}

			article.save((err, article) => {
				if (err) return console.error(err);
				console.log('Created Article!');
			});
		}
		await browser.close();
	});
}

router.get('/run', function(req, res, next) {
	scrapeWebsite(WEBSITES[0]);

	res.redirect('/articles');
});

module.exports = router;
