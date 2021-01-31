const fetch = require('node-fetch');
const IRC = require('irc-framework');
const bot = new IRC.Client();
const util = require('util');
const exec = util.promisify(require('child_process').exec);

bot.connect({
	host: 'irc.freenode.net',
	port: 6667,
	nick: 'mywsbbot',
	account: {
			account: 'mywsbbot',
			password: 'asdf1234',
			email: 'chovy@pm.me',
	},
});

bot.on('raw', event => {
	console.log(event);
});

//bot.join('##wallstreetbets');

bot.matchMessage(/^\.help/, async (event) => {
	console.log(event);
	event.reply(`
Available commands:
 .c <crypto>
 .s <stock>
 .join <channel>
 .short <url>
`);
});

bot.matchMessage(/^\.s /, async (event) => {
	console.log(event);
	const ticker = event.message.split(' ')[1];
	const res = await stock(ticker);
	event.reply(`${ticker.toUpperCase()}: ${res}`);
});

bot.matchMessage(/^\.c /, async (event) => {
	console.log(event);
	const ticker = event.message.split(' ')[1];
	const res = await crypto(ticker);
	const data = res.data[0];
	event.reply(`${ticker.toUpperCase()}: ${data.price} volume: ${data.volume} rank: ${data.rank}`);
});

bot.matchMessage(/^\.short /, async (event) => {
	console.log(event);
	const url = event.message.split(' ')[1];
	const res = await cuttly(url);
	event.reply(`${res.url.title}: ${res.url.shortLink}`);
});

bot.matchMessage(/^\.trend/, async (event) => {
	console.log(event);
	const stocks = await get('https://api.swaggystocks.com/api/wsb/sentiment/top?limit=5');
	const cryptos = await get('https://http-api.livecoinwatch.com/coins?offset=0&limit=5&sort=delta.day&order=descending&currency=USD&rank.min=300');
	const cryptoshr = await get('https://http-api.livecoinwatch.com/coins?offset=0&limit=5&sort=delta.hour&order=descending&currency=USD&rank.min=300');
	event.reply(`trending stocks: ${stocks.map(t => t.ticker).join(', ')} cryptos: - 1hr: ${cryptoshr.data.map(t => t.code).join(', ')} - 24hr: ${cryptos.data.map(t => t.code).join(', ')}`);
});


bot.matchMessage(/^\.identify/, event => {
	console.log(bot.options);
	bot.say('nickserv', `identify ${bot.options.account.account} ${bot.options.account.password}`);
});

bot.matchMessage(/^\.verify/, event => {
	console.log(bot.options);
	const pass = event.message.split(' ')[1];
	bot.say('nickserv', `verify register ${bot.options.account.account} ${pass}`);
});

bot.matchMessage(/^\.register/, event => {
	console.log(bot.options);
	bot.say('nickserv', `register ${bot.options.account.password} ${bot.options.account.email}`);
});

bot.matchMessage(/^\.joinall/, function(event) {
	console.log(event);
	const chan = event.message.split(' ')[1];
	bot.join('##wallstreetbets');
	bot.join('##altstreetbets');
	bot.join('##economics');
	bot.join('#bitcoin');
	bot.join('#litecoin');
	bot.join('#polkadot');
});

bot.matchMessage(/^\.join /, function(event) {
	console.log(event);
	const chan = event.message.split(' ')[1];
	bot.join(chan);
});

bot.matchMessage(/^\.part/, function(event) {
	console.log(event);
	const chan = event.message.split(' ')[1];
	bot.part(chan);
});

async function stock(ticker) {
	const res = await exec(`xidel 'https://www.marketwatch.com/investing/stock/${ticker}' -e '//div[@class="intraday__data"]|//div[@class="intraday__volume"]' | tr -s '\n' ' '`);

	console.log('res: ', res);
	return res.stdout;
};

async function crypto(pair) {
	const ticker = pair.split(/[\/-]/);

	if (!ticker[1]) {
		ticker.push('usd');
	}

	const res = await get(`https://http-api.livecoinwatch.com/coins?currency=${ticker[1].toUpperCase()}&only=${ticker[0].toUpperCase()}`);
	console.log('res: ', res);
	return res;
};

async function cuttly(url) {
	const res = await get(`https://cutt.ly/api/api.php?key=42c4bc34bdff9b4b2237cd709e11cf95f2fe3&short=${encodeURIComponent(url)}`);
	console.log('res: ', res);
	return res;
};


async function get(url) {
	const res = await fetch(url);

	if (res.ok) {
		return res.json();
	}

	throw(res);
}
