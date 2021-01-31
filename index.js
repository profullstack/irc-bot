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

bot.matchMessage(/^!s /, async (event) => {
	console.log(event);
	const ticker = event.message.split(' ')[1];
	const res = await stock(ticker);
	event.reply(`${ticker.toUpperCase()}: ${res}`);
});

bot.matchMessage(/^!c /, async (event) => {
	console.log(event);
	const ticker = event.message.split(' ')[1];
	const res = await crypto(ticker);
	const data = res.data[0];
	event.reply(`${ticker.toUpperCase()}: ${data.price} volume: ${data.volume}`);
});


/*
bot.matchMessage(/^!identify/, event => {
	console.log(bot.options);
	bot.say('nickserv', 'identify' + bot.options.account + ' ' + bot.options.password);
});

bot.matchMessage(/^!register/, event => {
	console.log(bot.options);
	bot.say('nickserv', 'register' + bot.options.password, bot.options.email);
});
*/

bot.matchMessage(/^!join/, function(event) {
	console.log(event);
	const chan = event.message.split(' ')[1];
	bot.join(chan);
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


async function get(url) {
	const res = await fetch(url);

	if (res.ok) {
		return res.json();
	}

	throw(res);
}
