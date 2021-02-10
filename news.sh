#!/bin/sh

xidel 'https://www.finviz.com/quote.ashx?t=amc' -s --xquery '
      for $item in //table[@id="news-table"]/tbody/tr
				let $title := $item//a[@class="tab-link-news"]/normalize-space(text())
        let $link := $item//a[@class="tab-link-news"]/@href
        let $date := $item//td[1]/normalize-space(text())
        return <div>{$date}- {$title}: {data($link)}</div>'
    
