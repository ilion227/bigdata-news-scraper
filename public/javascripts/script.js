$(document).ready(() => {
	$('.run-scraper').on('click', () => {
		$.get('/scraper/pages').then(() => {
			console.log('loaded scraper!');
		});
	});
});
$.get('/scraper/articles').then((data) => {
	console.log(data);

	for (let article of data.articles) {
		let $siteEntry = $(`div.site-entry[data-site=${article.site}]`);
		let $tableBody = $siteEntry.find('table tbody');

		let $row = `
            <tr>
<td>${article.title}</td>
<td>${article.author}</td>
<td><a target="_blank" href="${article.url}">Link</a></td>
</tr>`;
		$tableBody.append($row);
	}

	$('table').DataTable();
});

const socket = io.connect('http://localhost:3000');

socket.on('fetchedArticles', function(data) {
	console.log(data);
	let max = data.count;
	let $siteEntry = $(`div.site-entry[data-site=${data.website.title}]`);
	let $progressBar = $siteEntry.find('div.progress-bar');
	$progressBar.attr('aria-valuemax', max);
	$progressBar.data('max', max);
});

socket.on('fetchedArticle', function(data) {
	let $siteEntry = $(`div.site-entry[data-site=${data.website.title}]`);
	let $progressBar = $siteEntry.find('div.progress-bar');
	let $tableBody = $siteEntry.find('table tbody');

	let val = parseInt($progressBar.data('value'));
	let total = parseInt($progressBar.data('max'));

	val = val + 1;
	let progress = (val / total) * 100;
	$progressBar.css('width', progress + '%').
			attr('aria-valuenow', progress).
			text(val + '/' + total).data('value', val);

	let $row = `
            <tr>
<td>${data.article.title}</td>
<td>${data.article.author}</td>
<td><a target="_blank" href="${data.article.url}">Link</a></td>
</tr>`;
	$tableBody.prepend($row);
});