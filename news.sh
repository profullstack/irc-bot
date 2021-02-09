#!/bin/sh

xidel 'https://www.cnbc.com/quotes/AMC' -s --xml --xquery '
for $item in //div[@class="LatestNews-latestNews"]//div[@class="LatestNews-newsFeed"]
		let $title := $item//a[@href]/normalize-space(text())
		let $link := $item//a[@href]/@href
		let $date := $item//div[@class="LatestNews-timestamp"]/normalize-space(text())
		return <div>{$title}: {data($link)} {$date}</div>
'
