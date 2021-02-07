#!/usr/bin/env sh

xidel -s https://www.marketbeat.com/short-interest/ --xml --xquery '
for $row in //tbody/tr
	let $ticker := $row//td[1]//div[@class="ticker-area"]/normalize-space(text())
	let $name := $row//td[1]//div[@class="title-area"]/normalize-space(text())
	let $shares := $row//td[2]/normalize-space(text())
	let $vol := $row//td[3]/normalize-space(text())
	let $days := $row//td[6]/normalize-space(text())
	let $float := $row//td[7]/normalize-space(text())
	let $percent := $row//td[8]/normalize-space(text())
	order by $float
	where boolean($ticker)
	return
<ticker symbol="{$ticker}">
	<name>{$name}</name>
	<shares>{$shares}</shares>
	<volume>{$vol}</volume>
	<days>{$days}</days>
	<float>{$float}%</float>
	<percent>{$percent}</percent>
</ticker>
'
