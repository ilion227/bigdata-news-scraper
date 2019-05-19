const express = require('express');
const puppeteer = require('puppeteer');
const moment = require('moment');

const Article = require('../models/Article');
const Website = require('../models/Website');

const config = require('../config');

const router = express.Router();

router.get('/', function(req, res, next) {
	Article.find({}, async function(err, articles) {
		res.send(articles);
	});
});

async function getInnerHTML(element, selector) {
	if (await element.$(selector) !== null) {
		return await element.$eval(selector, node => node.innerHTML);
	}
	return null;
}

async function getInnerText(element, selector) {
	if (await element.$(selector) !== null) {
		return await element.$eval(selector, node => node.innerText.trim());
	}
	return null;
}

async function getAllInnerText(element, selector) {
	if (await element.$$(selector) !== null) {
		const values = await element.$$eval(selector, nodes => {
			let data = [];
			for (node of nodes) {
				data.push(node.innerText.trim());
			}
			return data;
		});
		return values;
	}
	return null;
}

/* GET scraper info. */
router.get('/pages', function(req, res, next) {
	(async () => {
		const browser = await puppeteer.launch({
			headless: true,
			args: [
				'--no-sandbox',
				'--disable-setuid-sandbox',
				'--disable-dev-shm-usage',
				'--disable-accelerated-2d-canvas',
				'--disable-gpu',
				'--window-size=1366x768',
			],
		});

		let articles = [];
		Website.find({}, async function(err, websites) {
			for (let website of websites) {
				console.log('Scraping:', website.url);

				console.log('Launched!');
				let page = await browser.newPage();
				await page.goto(website.url, {waitUntil: 'networkidle0'});

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

				let urlResults = await page.evaluate(() => {
					let data = [];
					document.querySelectorAll('a').forEach(function(el) {
						let image = el.querySelector('img');
						let title = el.querySelector('h1,h2,h3,h4,h5,h6');
						if (el.href.length === 0 || !image || !title || title.innerText.trim().length === 0) return;
						data.push({title: title.innerText.trim(), link: el.href, image: image.src});
					});

					return data;
				});

				website.links = urlResults.map((result) => {
					return result.link;
				});
				website.save();

				await page.setRequestInterception(true);
				page.on('request', (request) => {
					const requestUrl = request._url.split('?')[0].split('#')[0];
					if (
							config.blockedResourceTypes.indexOf(request.resourceType()) !== -1 ||
							config.skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
					) {
						request.abort();
					} else {
						request.continue();
					}
				});

				console.log('Fetched ' + urlResults.length + ' entries.');
				for (let i = 0; i < urlResults.length; i++) {
					console.log(`fetching page [${i}]...`);
					let entry = urlResults[i];
					await page.goto(entry.link);
					await page.setUserAgent(config.userAgent);

					let tags = await getAllInnerText(page, website.selectors.tags);
					let author = await getInnerText(page, website.selectors.author);
					let info = await getInnerText(page, website.selectors.info);
					let summary = await getInnerHTML(page, website.selectors.summary);
					let content = await getInnerHTML(page, website.selectors.content);

					/*
					Site specific scraping
					let location = null;
					let publishedAt = null;
					let modifiedAt = null;

					if (website.name == '24ur') {
						let infoArr = info.split('|');
						let locationAndDate = infoArr[0].split(',');
						location = locationAndDate[0];
						let datetime = locationAndDate[1] + ' ' + locationAndDate[2];

						publishedAt = moment(datetime, 'DD.MM.YYYY hh:mm').toDate();
						modifiedAt = infoArr[1];
					 */

					let article = new Article({
						site: website.title,
						url: entry.link,
						title: entry.title,
						mainImage: entry.image,
						author: author,
						info: info,
						tags: tags,
						summary: summary,
						content: content,
					});

					articles.push(article);
				}
			}

			console.log(`Fetched ${articles.length} articles.`);
			browser.close();
		});
	})();
	res.json({status: 'Scraping...'});
});
module.exports = router;
