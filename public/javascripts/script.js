let articlesTable = null;
$(document).ready(() => {
	$('.run-scraper').on('click', () => {
		$.get('/scraper/pages').then(() => {
			console.log('loaded scraper!');
		});
	});

	$('.generate-features').on('click', function() {
		let id = $(this).data('article-id');
		$.get(`/articles/${id}/generate`).then((data) => {
			console.log('features are generating!', data);
		});
	});

	$('.progress-container').hide();

	if ($('#articlesTable').length) {
		articlesTable = $('#articlesTable').DataTable({
			columns: [
				{data: 'createdAt', visible: false, searchable: false},
				{data: 'title'},
				{data: 'author'},
				{data: 'site'},
				{data: 'actions'},
			],
			responsive: true,
			language: {
				paginate: {
					next: '<i class="fa fa-arrow-right"></i>',
					previous: '<i class="fa fa-arrow-left"></i>',
				},
			},
		});
	}
});

let dataTables = [];

$('table.table-data').each(function() {
	let site = $(this).data('site');

	dataTables[site] = $(this).DataTable({
		columns: [
			{data: 'createdAt', visible: false, searchable: false},
			{data: 'title'},
			{data: 'author'},
			{data: 'actions'},
		],
		responsive: true,
		language: {
			paginate: {
				next: '<i class="fa fa-arrow-right"></i>',
				previous: '<i class="fa fa-arrow-left"></i>',
			},
		},
	});
});
console.log(dataTables);

$.get('/articles/fetch').then((data) => {

	console.log(data, dataTables, articlesTable);

	for (let article of data.articles) {
		if (articlesTable != null) {
			articlesTable.row.add({
				title: article.title,
				author: article.author,
				createdAt: article.createdAt,
				site: `<td><span class="badge badge-primary">${article.site}</span></td>`,
				actions: `<a target="_blank" href="/articles/${article._id}" class="badge badge-pill badge-primary">INFO</a>
<a target="_blank" href="${article.url}" class="badge badge-pill badge-success"><i class="fa fa-external-link-alt"></i></a>`,
			}).draw().node();
		} else {
			let table = dataTables[article.site];

			table.row.add({
				title: article.title,
				author: article.author,
				createdAt: article.createdAt,
				actions: `<a target="_blank" href="/articles/${article._id}" class="badge badge-pill badge-primary">INFO</a><a target="_blank" href="${article.url}" class="badge badge-pill badge-success"><i class="fa fa-external-link-alt"></i></a>`,
			}).draw().node();
		}
	}
});

const socket = io.connect('http://localhost:3000');

socket.on('fetchedArticles', function(data) {
	console.log(data);
	let max = data.count;
	let $siteEntry = $(`div.site-entry[data-site=${data.website.title}]`);
	let $progressBar = $siteEntry.find('div.progress-bar');
	let $progressPercentage = $siteEntry.find('div.progress-percentage span');

	$progressBar.attr('aria-valuemax', max);
	$progressBar.data('max', max);

	$progressPercentage.text(0 + '/' + max);

	$siteEntry.find('.progress-container').show();
});

socket.on('fetchedArticle', function(data) {
	let $siteEntry = $(`div.site-entry[data-site=${data.website.title}]`);
	let $progressBar = $siteEntry.find('div.progress-bar');
	let $progressPercentage = $siteEntry.find('div.progress-percentage span');

	let val = parseInt($progressBar.data('value'));
	let max = parseInt($progressBar.data('max'));

	val = val + 1;
	let progress = (val / max) * 100;
	$progressBar.css('width', progress + '%').
			attr('aria-valuenow', progress).data('value', val);
	$progressPercentage.text(val + '/' + max);

	if (articlesTable != null) {
		let rowNode = articlesTable.row.add({
			title: data.article.title,
			author: data.article.author,
			createdAt: data.article.createdAt,
			site: `<td><span class="badge badge-primary">${data.article.site}</span></td>`,
			actions: `<a target="_blank" href="/articles/${data.article._id}" class="badge badge-pill badge-primary">INFO</a>
<a target="_blank" href="${data.article.url}" class="badge badge-pill badge-success"><i class="fa fa-external-link-alt"></i></a>`,
		}).draw(false).node();
		articlesTable.order([0, 'desc']).draw();

		$(rowNode).addClass('bg-gradient-primary text-white');
	} else {

		let table = dataTables[data.website.title];
		let rowNode = table.row.add({
			title: data.article.title,
			author: data.article.author,
			createdAt: data.article.createdAt,
			actions: `<a target="_blank" href="/articles/${data.article._id}" class="badge badge-pill badge-primary">INFO</a>
<a target="_blank" href="${data.article.url}" class="badge badge-pill badge-success"><i class="fa fa-external-link-alt"></i></a>`,
		}).draw(false).node();
		table.order([0, 'desc']).draw();

		$(rowNode).addClass('bg-gradient-primary text-white');
	}
});
