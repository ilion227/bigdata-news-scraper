const express = require('express');
const puppeteer = require('puppeteer');
const io = require('../sockets/base');

const {Cluster} = require('puppeteer-cluster');

const Article = require('../models/Article');
const Website = require('../models/Website');

const config = require('../config');

const router = express.Router();
let articles = [];

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
router.get('/pages', async function(req, res) {
	let websites = await Website.find({}).exec();

	const cluster = await Cluster.launch({
		concurrency: Cluster.CONCURRENCY_CONTEXT,
		maxConcurrency: config.concurrentOperations,
		puppeteerOptions: config.launchOptions,
		monitor: true,
	});

	await cluster.task(async ({page, data}) => {
		let {entry, website} = data;
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

			let images = [];
			if (await page.$(`${website.selectors.content} img`) !== null) {
				images = await page.$$eval(`${website.selectors.content} img`, nodes => {
					return nodes.map(node => node.src);
				});
			}

			let article = new Article({
				site: website.title,
				url: entry.link,
				title: entry.title,
				mainImage: entry.image,
				author: author,
				info: info,
				tags: tags,
				summary: summary,
				images: images,
			});
			articles.push(article);

			article.save((err, data) => {
				if (err) return console.log(err);
				io.fetchedArticle({article: data, website});
			});

		} catch (err) {
			console.log(`An error occured on url: ${entry.link}`);
		} finally {
			await page.close();
		}
	});

	for (let i = 0; i < websites.length; i++) {
		let website = websites[i];

		let browser = await puppeteer.launch(config.launchOptions);

		let page = await browser.newPage();
		await page.goto(website.url);
		let entries = await page.evaluate(() => {
			let data = [];
			document.querySelectorAll('a').forEach(function(el) {
				let image = el.querySelector('img');
				let title = el.querySelector('h1,h2,h3,h4,h5,h6');
				if (el.href.length === 0 || !image || !title || title.innerText.trim().length === 0) return;
				data.push({title: title.innerText.trim(), link: el.href, image: image.src});
			});

			return data;
		});

		let articleEntries = [];

		for (let entry of entries) {
			await Article.find({url: entry.link}, function(err, article) {
				if (article.length === 0)
					articleEntries.push(entry);
			});
		}
		console.log('Fetched ' + articleEntries.length + ' new entries.');
		io.fetchedArticles({count: articleEntries.length, website});

		for (let entry of articleEntries) {
			await cluster.queue({url: entry.link, entry, website});
		}
	}
	await cluster.idle();
	await cluster.close();

	res.json({'status': 200});
});

module.exports = router;
