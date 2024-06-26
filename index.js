const fetch = require('node-fetch');
const IRC = require('irc-framework');
const util = require('util');
const env = require('dotenv-flow');
const exec = util.promisify(require('child_process').exec);

env.config();

const ignore = [
	'gpbot',
];

const { IRC_NICK:nick, IRC_ACCOUNT:account, IRC_PASSWORD:password, IRC_EMAIL:email, CUTTLY_API_KEY } = process.env;
const servers = [
//	'irc.freenode.net',
	'irc.libera.chat'
];

(async function () {
	for (let server of servers) {
		const bot = new IRC.Client();

		bot.connect({
			host: server,
			port: 6667,
			nick,
			account: {
					account,
					password,
					email,
			},
		});

		await doStuff(bot);
	}
})();

async function doStuff(bot) {
	

	setTimeout(() => {
		bot.join('#wallstreetbets');
		bot.join('#altstreetbets');
		bot.join('#ethtrader');
		bot.join('#economics');
		bot.join('#litecoin');
		bot.join('#polkadot');
		bot.join('#trading');
		bot.join('#bitcoin-pricetalk');
		bot.join('#profullstack');
		bot.join('#primate');
	}, 60000);

	bot.on('raw', event => {
		console.log(event);
	});

	//bot.join('##wallstreetbets');

	bot.matchMessage(/^\.help/, async (event) => {
		if (!beforeMessage(event)) return;

		console.log(event);
		const lines = `Available commands:
	 .c <crypto>
	 .s <stock>
	 .join <channel>
	 .trend
	 .short <url>
	 .joke
	 .ball <question>
	 .hot
	 .new
	 .dd new|hot|top|comments
	 .brisk stock|crypto <ticker>
	 .brisk topic <subject>
	 .shorts
	 .penny
	 .moon
	 .amt c <ticker> <amount>
	 .amt s <ticker> <amount>
	 .movers
	 .ipos
	 .earnings
	 .news <ticker>
	 .convert <amount> <from> <to>
	 .time london, uk
	 .fortune
	 .splits <reverse>
	 .t
	`.split('\n');

		for (let line of lines) {
			bot.say(event.nick, line);
			await sleep(1000);
		}
	});

	bot.matchMessage(/https?:\/\/[^\s+]/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const url = event.message.match(/(https?:\/\/[^\s]+)/)[1];

		if (url.length <= 80) {
			return;
		}

		const res = await cuttly(url);
		event.reply(`${res.url.title}: ${res.url.shortLink}`);
		//event.reply(`${res.url.title}`);
	});

	bot.matchMessage(/(?:^|\W)(hot|damn)(?:$|\W)/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		event.reply(`${event.nick} 🚀🚀🔥🔥`);
	});

	/*
	bot.matchMessage(/(?:^|\W)(fuck|shit)(?:$|\W)/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		event.reply(`${event.nick} did you just swear???? what the fuck dude, you can't be swearing in here!`);
	});
	*/


	bot.matchMessage(/^\.s /, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const ticker = event.message.split(' ')[1];
		const res = await stock(ticker);
		event.reply(`${ticker.toUpperCase()}: ${res}`);
	});

	bot.matchMessage(/^\.t /, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const loc = event.message.split(/^\.t /)[1];
		console.log('msg: ', event.message);
		console.log('loc: ', loc);
		const res = await localtime(loc);
		event.reply(`${res}`);
	});


	bot.matchMessage(/^\.c /, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const ticker = event.message.split(' ')[1];
		const res = await crypto(ticker);
		if (!res.data[0]) return;
		const data = res.data[0];
		event.reply(`${ticker.toUpperCase()}: $${data.price} gain/loss: ${data.delta.hour}% 1 hour, ${data.delta.day}% 1 day. volume: ${data.volume} ${data.deltav.hour}% 1 hour, ${data.deltav.day}% 1 day. rank: ${data.rank}`);
	});

	bot.matchMessage(/^\.amt c/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const ticker = event.message.split(' ')[2];
		const amt  = event.message.split(' ')[3];
		const res = await crypto(ticker);
		const data = res.data[0];

		event.reply(`${ticker.toUpperCase()}: ${amt}*${data.price} =  $${(amt * data.price).toFixed(2)}`);
	});

	bot.matchMessage(/^\.amt s/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const ticker = event.message.split(' ')[2];
		const amt  = event.message.split(' ')[3];
		const res = await stock(ticker);
		const data = res.split(' ');

		event.reply(`${ticker.toUpperCase()}: ${amt}*${data[1]} =  $${(amt * data[1]).toFixed(2)}`);
	});

	bot.matchMessage(/^\.short /, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const url = event.message.split(' ')[1];
		const res = await cuttly(url);
		event.reply(`${res.url.title}: ${res.url.shortLink}`);
	});

	bot.matchMessage(/^\.joke/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const res = await get('https://v2.jokeapi.dev/joke/Any?type=single');
		event.reply(`${res.category}: ${res.joke}`);
	});

	bot.matchMessage(/^\.moon/, async (event) => {
		if (!beforeMessage(event)) return;
		event.reply(`🌎 ° 🌓 • .°• 🚀 ✯ ★ * ° 🛰 °· 🪐 . • ° ★ • ☄ ▁▂▃▄▅▆▇▇▆▅▄▃▁▂ Hold till we See The moon 🔥🔥`);
	});


	bot.matchMessage(/^\.shorts/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const res = await shorts();
		event.reply(`short interest: ${res} 🚀🚀🚀💎🙌🦍`);
	});

	bot.matchMessage(/^\.movers/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const res = await movers();
		event.reply(`movers: ticker movement price -- ${res} 🚀🚀🚀💎🙌🦍`);
	});

	bot.matchMessage(/^\.ipos/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const res = await ipos();
		event.reply(`ipos: ${res} 🚀🚀🚀💎🙌🦍`);
	});

	bot.matchMessage(/^\.earnings/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const res = await earnings();
		event.reply(`earnings: ${res} 🚀🚀🚀💎🙌🦍`);
	});

bot.matchMessage(/^\.news /, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const ticker = event.message.split(' ')[1]
		const res = await news(ticker);
		event.reply(`${ticker.toUpperCase()} - ${res}`);
	});

	bot.matchMessage(/^\.convert/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const [ cmd, amt, from, to ] = event.message.split(' ')
		const res = await convert(from, to);
		const amount = res[to.toUpperCase()] * amt;
		event.reply(`${amt} ${from} to ${to} = ${amount}`);
	});


	bot.matchMessage(/^\.time/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		let [ city, country ] = event.message.split(',')
		city = city.replace('.time', '').trim().replace(/\s+/g, '-');
		country = country.trim().replace(/\s+/g, '-');

		const res = await time(country, city);
		event.reply(`${city}, ${country} ${res}`);
	});


	bot.matchMessage(/^\.penny/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const res = await penny();
		event.reply(`penny stocks: ${res} 🚀🚀🚀💎🙌🦍`);
	});

	bot.matchMessage(/^\.hot/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const res = await get('https://www.reddit.com/hot.json');
		const item = res.data.children[3].data;
		event.reply(`${item.title}: https://reddit.com/${item.id}`);
	});

	bot.matchMessage(/^\.new$/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const res = await get('https://www.reddit.com/new.json');
		const item = res.data.children[0].data;
		event.reply(`${item.title}: https://reddit.com/${item.id}`);
	});

	bot.matchMessage(/^\.dd/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;

		try {
			const sort = event.message.split(' ');
			const res = await get(`https://www.reddit.com/search.json?sort=${sort[1] || 'new'}&restrict_sr=on&t=day`);
			const item = res.data.children[0].data;
			event.reply(`${item.title}: https://reddit.com/${item.id}`);
		} catch(err) {
			console.error(err);
		}
	});

	bot.matchMessage(/^\.brisk /, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const opts = event.message.split(' ');
		const url = `https://briskreader.com/api/1/${opts[1]}s/${opts[1] === 'topic' ? opts[2] : opts[2].toUpperCase()}`
		console.log(url);
		const res = await get(url);
		console.log(res.slice(0, 5));
		const item = res[0];
		event.reply(`${item.title}${item.siteName ? ' ('+item.siteName+')' : ''} https://briskreader.com/link/${item.shortId}`);
	});

	bot.matchMessage(/^\.ball/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const q = event.message.match(/^.ball (.*)$/)[1];
		const res = await get(`https://www.eightballapi.com/api?question=${encodeURIComponent(q)}`);
		event.reply(`${q}: ${res.reading}`);
	});

	bot.matchMessage(/^\.splits/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const csv = await exec(`xidel -s 'https://finance.yahoo.com/calendar/splits' -e '//table/tbody/tr / string-join(td, ", ")'`);
	
		console.log(csv);
		event.reply(`${csv.stdout}`);
	});

	bot.matchMessage(/^\.fortune/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const res = await fortune();

		for (let line of res) {
			event.reply(`${line}`);
		}
	});

	bot.matchMessage(/^\.cowsay/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		const quote = event.message.match(/^\.cowsay (.*)/)[1];
		console.log(quote);
		const res = await cowsay(quote);

		for (let line of res) {
			event.reply(line);
		}
	});



	bot.matchMessage(/^\.trend/, async (event) => {
		console.log(event);
		if (!beforeMessage(event)) return;
		try {
			const stocks = await get('https://api.swaggystocks.com/wsb/sentiment/top?limit=5');
			const cryptos = await get('https://http-api.livecoinwatch.com/coins?offset=0&limit=5&sort=delta.day&order=descending&currency=USD&rank.min=300');
			const cryptoshr = await get('https://http-api.livecoinwatch.com/coins?offset=0&limit=5&sort=delta.hour&order=descending&currency=USD&rank.min=300');
			event.reply(`trending stocks: ${stocks.map(t => t.ticker).join(', ')} cryptos: - 1hr: ${cryptoshr.data.map(t => t.code).join(', ')} - 24hr: ${cryptos.data.map(t => t.code).join(', ')} 🚀🚀🚀💎🙌🦍`);
		} catch(err) {
			console.error(err);
		}
	});


	bot.matchMessage(/^\.identify/, event => {
		console.log(bot.options);
		if (!beforeMessage(event)) return;
		bot.say('nickserv', `identify ${bot.options.account.account} ${bot.options.account.password}`);
	});

	bot.matchMessage(/^\.verify/, event => {
		console.log(bot.options);
		if (!beforeMessage(event)) return;
		const pass = event.message.split(' ')[1];
		bot.say('nickserv', `verify register ${bot.options.account.account} ${pass}`);
	});

	bot.matchMessage(/^\.register/, event => {
		console.log(bot.options);
		if (!beforeMessage(event)) return;
		bot.say('nickserv', `register ${bot.options.account.password} ${bot.options.account.email}`);
	});

	bot.matchMessage(/^\.joinall/, function(event) {
		console.log(event);
		if (!beforeMessage(event)) return;
		const chan = event.message.split(' ')[1];
		bot.join('#wallstreetbets');
		bot.join('#altstreetbets');
		bot.join('#economics');
		bot.join('#litecoin');
		bot.join('#polkadot');
		bot.join('#trading');
		bot.join('#profullstack');
		bot.join('#primate');
	});

	bot.matchMessage(/^\.join /, function(event) {
		console.log(event);
		if (!beforeMessage(event)) return;
		const chan = event.message.split(' ')[1];
		bot.join(chan);
	});

	bot.matchMessage(/^\.part/, function(event) {
		console.log(event);
		if (!beforeMessage(event)) return;
		const chan = event.message.split(' ')[1];
		bot.part(chan);
	});
}

async function fortune() {
	const res = await exec(`fortune`);

	console.log('res: ', res);
	return res.stdout.split('\n');
};

async function cowsay(quote) {
	const res = await exec(`cowsay ${quote}`);

	console.log('res: ', res);
	return res.stdout.split('\n');
};

async function localtime(loc) {
	const input = loc.toLowerCase().trim();
	let local = input;

	if (input.indexOf(",") > -1) {
		const [city, country] = input.split(/\s*,\s*/);

		local = `${country.replace(/\s+/g, '-')}/${city.replace(/\s+/g, '-')}`;
		input = `${city}, ${country}`;
	} 

	console.log(local);
	const date_time = await exec(`xidel -s "https://www.timeanddate.com/worldclock/${local}" -e '//*[@id="ct"]/text()'`);
	const date_date = await exec(`xidel -s "https://www.timeanddate.com/worldclock/${local}" -e '//*[@id="ctdat"]/text()'`);

	console.log('date_time: ', date_time.stdout);
	console.log('date_date: ', date_date.stdout);
	return `${input}: ${date_time.stdout.trim()} ${date_date.stdout.trim()}`;
};

async function stock(ticker) {
	const res = await exec(`xidel 'https://www.marketwatch.com/investing/stock/${ticker}' -e '//div[@class="intraday__data"]|//div[@class="intraday__volume"]' | tr -s '\n' ' '`);

	console.log('res: ', res);
	return res.stdout;
};

async function time(country, city) {
	const res = await exec(`xidel -s 'https://www.timeanddate.com/worldclock/${country.toLowerCase()}${city ? '/'+city.toLowerCase() : ''}' -e '//span[@id="ct"]'`);

	console.log('res: ', res);
	return res.stdout;
};


async function shorts() {
	const res = await exec(`xidel https://www.highshortinterest.com/ -e '//table[@class="stocks"]/tbody/tr/td[1]|//table[@class="stocks"]/tbody/tr/td[4]' | head -n 22 | tr -s '\n' ' '`);

	console.log('res: ', res);
	return res.stdout;
};

async function movers() {
	const res = await exec(`xidel https://unbiastock.com/movers.php -e '//table[@id="table_id2"]/tbody/tr/th[1]|//table[@id="table_id2"]/tbody/tr/th[2]|//table[@id="table_id2"]/tbody/tr/th[8]' | head -n 15 | tr -s '\n' ' '`);

	console.log('res: ', res);
	return res.stdout;
};

async function ipos() {
	const res = await exec(`xidel https://www.marketwatch.com/tools/ipo-calendar --xquery '
		    for $row in //table/tbody/tr let $name := $row/td[1]/*/normalize-space(text()) let $ticker := $row/td[2]/text() let $price := $row/td[4]/text() let $shares := $row/td[5]/normalize-space(text()) where boolean($name) and boolean($shares) and boolean($ticker) and not(contains($ticker, ".U")) order by $shares descending return <stock>({$ticker}) {$name}: {$price} {$shares} shs</stock>' | head -n 5 | tr '\n' ' '`);

	console.log('res: ', res);
	return res.stdout;
};

async function earnings() {
	const res = await exec(`xidel https://www.marketwatch.com/tools/earnings-calendar --xquery '
		    for $row in //table/tbody/tr let $name := $row/td[1]/*[1]/normalize-space(text()) let $ticker := $row/td[2]/text() let $estimate := $row/td[4]/*/text() let $actual := $row/td[5]/*/normalize-space(text()) where boolean($name) and boolean($estimate) and boolean($actual) and not(contains($ticker, ".U")) order by $estimate descending return <stock>({$ticker}) {$name}: {$estimate} {$actual}</stock>' | head -n 5 | tr '\n' ' '`);

	console.log('res: ', res);
	return res.stdout;
};


async function convert(from, to) {
	const res = await get(`https://min-api.cryptocompare.com/data/price?fsym=${from.toUpperCase()}&tsyms=${to.toUpperCase()}`);
	console.log('res: ', res);
	return res;
};


async function news(ticker) {
	const res = await exec(`xidel 'https://www.finviz.com/quote.ashx?t=${ticker.toLowerCase()}' -s --xquery '
      for $item in //table[@id="news-table"]/tbody/tr
				let $title := $item//a[@class="tab-link-news"]/normalize-space(text())
        let $link := $item//a[@class="tab-link-news"]/@href
        let $date := $item//td[1]/normalize-space(text())
        return <div>{$date}- {$title}: {data($link)}</div>' \
		| head -n 1`);
		
	console.log('res: ', res);
	const matches = res.stdout.match(/(https?[^\s]+)/ig)
	const url = matches && matches[0] 
	console.log('url: ', url);
	if (!url) return;
	const link = await cuttly(url);
	console.log('short: ', link.url.shortLink);
	console.log('news: ', res.stdout);
	res.stdout = res.stdout.replace(url, link.url.shortLink);
	console.log('news: ', res.stdout);

	return res.stdout;
};

async function penny() {
	const res = await exec(`xidel https://www.pennystockflow.com/ -e '//table[@class="stocks"]//(td[1]|td[2]|td[3])' | head -n 18 | tr -s '\n' ' '`);

	console.log('res: ', res);
	return res.stdout;
};



async function crypto(pair) {
	const ticker = pair.split(/[\/-]/);

	if (!ticker[1]) {
		ticker.push('usd');
	}

	const url = `https://http-api.livecoinwatch.com/coins?currency=${ticker[1].toUpperCase()}&only=${ticker[0].toUpperCase()}`;
	console.log(url);
	const res = await get(url);
	console.log('res: ', res);
	return res;
};

async function cuttly(url) {
	const res = await get(`https://cutt.ly/api/api.php?key=${CUTTLY_API_KEY}&short=${encodeURIComponent(url)}`); console.log('res: ', res);
	return res;
};


async function get(url, text = false) {
	const res = await fetch(url);

	if (res.ok) {
		if (text) {
			return res.text();
		} else {
			return res.json();
		}
	}

	throw(res);
}

function sleep(milliseconds) {
	  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function beforeMessage(event) {
	return !ignore.includes(event.nick);
}
