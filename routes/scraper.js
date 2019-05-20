const express = require('express');
const puppeteer = require('puppeteer');
const io = require('../sockets/base');

const Article = require('../models/Article');
const Website = require('../models/Website');

const config = require('../config');


const router = express.Router();
let articles = [];

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
router.get('/pages', function(req, res) {
	Website.find({}, async function(err, websites) {
		(async () => {
			const startDate = new Date().getTime();
			const sitePromises = [];
			for (let i = 0; i < websites.length; i++) {
				sitePromises.push(new Promise(async (resBrowser) => {
					let website = websites[i];
					let browser = await puppeteer.launch(config.launchOptions);
					const pagePromises = [];

					console.log('Scraping:', website.url);

					let mainPage = await browser.newPage();
					await mainPage.goto(website.url, {waitUntil: 'networkidle0'});
					await mainPage.evaluate(async () => {
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

					let articleEntries = await mainPage.evaluate(() => {
						let data = [];
						document.querySelectorAll('a').forEach(function(el) {
							let image = el.querySelector('img');
							let title = el.querySelector('h1,h2,h3,h4,h5,h6');
							if (el.href.length === 0 || !image || !title || title.innerText.trim().length === 0) return;
							data.push({title: title.innerText.trim(), link: el.href, image: image.src});
						});

						return data;
					});
					articleEntries = articleEntries.slice(0, 2);
					await mainPage.close();
					console.log('Fetched ' + articleEntries.length + ' entries.');
					io.fetchedArticles(articleEntries.length);

					for (let numPage = 0; numPage < config.concurrentOperations; numPage++) {
						pagePromises.push(new Promise(async (resPage) => {
							while (articleEntries.length > 0) {
								let entry = articleEntries.pop();
								console.log(`Visiting url: ${entry.link}`);

								let page = await browser.newPage();
								await page.setUserAgent(config.userAgent);
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

								try {
									await page.goto(entry.link);
									let tags = await getAllInnerText(page, website.selectors.tags);
									let author = await getInnerText(page, website.selectors.author);
									let info = await getInnerText(page, website.selectors.info);
									let summary = await getInnerHTML(page, website.selectors.summary);
									let content = await getInnerHTML(page, website.selectors.content);

									articles.push({
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
								} catch (err) {
									console.log(`An error occured on url: ${entry.link}`);
								} finally {
									await page.close();
								}
							}
							resPage();
						}));
					}

					await Promise.all(pagePromises);
					await browser.close();

					Article.insertMany(articles).then((data) => {
						console.log(`Inserted ${data.length} articles`);

						// Reset array after each main page
						articles.length = 0;
					});

					resBrowser();
				}));
			}

			await Promise.all(sitePromises);
			console.log(`Time elapsed ${Math.round((new Date().getTime() - startDate) / 1000)} s`);
		})();
	});

	res.json({status: 'Scraping...'});
});

module.exports = router;
