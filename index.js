const Discord = require('discord.js');
const rssFeedDatabase = require(`${process.cwd()}/rssFeedDatabase`);
const Parser = require('rss-parser');
const parser = new Parser();
let feedMessages = [];

async function start(){
	const date = new Date();
    console.log('Ready!');
    console.log(date.toLocaleString('en-US'));
    feedMessages = await rssFeedDatabase.getRssFeedMessagesLoop();
}

setInterval(async ()=>{
	const now = new Date();
    if(now.getMinutes()%2===0&&now.getSeconds()===0){
        feedMessages.forEach(async messagePost=>{
            await rssFeedDatabase.addRssFeedMessages(messagePost)
        })
    }
	if(now.getSeconds()===0){
        const ytfeeds = await rssFeedDatabase.getRssFeedWebhookLoop()
        if(!ytfeeds.length){return}
        const forumFeeds = new Discord.Collection();
        feeds.forEach(forumFeed=>{
            if(forumFeeds.has(forumFeed.forum)){
                forumFeeds.get(forumFeed.forum).push(forumFeed)
            }else{
                forumFeeds.set(forumFeed.forum,[forumFeed])
            }
        })
        const forumFeedsList = [...forumFeeds.keys()]
        forumFeedsList.forEach(async forumFeed=>{
            try{
                const feed = await parser.parseURL(forumFeed)
                feed.items.reverse()
                youtubeChannels.get(forumFeed).forEach(forumfeed=>{
                    const webhook = new Discord.WebhookClient({url:forumfeed.webhook});
                    let latestTime = forumfeed.latestTime
                    feed.items.forEach(async item => {
                        if(!item)return
                        const urlCheck = item.link.trim().split('/').pop()
                        if(feedMessages.find(posted=>posted.webhook===webhook.url&&posted.postUrl===item.link.trim())) return
                        const date = new Date(item.isoDate)
                        if(date.getTime()<forumfeed.latestTime){
                            return
                        }else{
                            latestTime = date.getTime()
                        }
                        const embed = new Discord.MessageEmbed()
                        if(item.title.trim().replace('http','ht​tp').length>256){
                            embed.setTitle(`${item.title.trim().replace('http','ht​tp').slice(0,253)}...`)
                        }else{
                            embed.setTitle(`${item.title.trim().replace('http','ht​tp')}`)
                        }
                        if(item.contentSnippet){
                            if(item.contentSnippet.split('submitted by')[0].trim().length>1024){
                                embed.setDescription(item.contentSnippet.split('submitted by')[0].trim().slice(0,1024)+'...')
                            }else{
                                embed.setDescription(item.contentSnippet.split('submitted by')[0].trim())
                            }
                            if(item.content.includes('<img src="')){
                                embed.setImage(item.content.split('<img src="')[1].split('"')[0])
                            }
                            embed.setURL(item.link.trim())
                        }else if(item.content.includes('<img src="')){
                            embed.setImage(item.content.split('<img src="')[1].split('"')[0])
                            embed.setURL(item.link.trim())
                        }else{
                            if(item.link.trim().length>1024){
                                embed.setDescription(item.link.trim())
                            }else{
                                embed.setDescription(item.link.trim())
                            }
                        }
                        if(item.creator){
                            embed.setAuthor({name:item.creator.trim()})
                            embed.setFooter({text:feed.title.split('topics')[0].trim()})
                        }else if(item.author){
                            embed.setAuthor({name:item.author.trim()})
                            embed.setFooter({text:feed.title.split('topics')[0].trim()})
                        }
                        embed.setTimestamp(date)
                        if(embed.description){
                            const feedMessagePosted = feedMessages.find(posted=>posted.webhook===webhook.url&&posted.postUrl.includes(urlCheck))
                            if(!forumfeed.firstRun&&!feedMessagePosted){
                                const message = await webhook.send({embeds:[embed]})
                                feedMessages.push({"webhook":webhook.url,"postUrl":item.link.trim(),"messageId":message.id})
                            }else if(!forumfeed.firstRun&&feedMessagePosted&&!feedMessages.find(posted=>posted.webhook===webhook.url&&posted.postUrl===item.link.trim())){
                                const messageEdit = await webhook.editMessage(feedMessagePosted.messageId,{embeds:[embed]})
                                feedMessages.splice(feedMessages.indexOf(feedMessages.find(url=>url.postUrl.includes(urlCheck))), 1,{"webhook":webhook.url,"postUrl":item.link.trim(),"messageId":messageEdit.id})
                            }
                        }
                    })
                    rssFeedDatabase.addRssFeed({"guild_id":forumfeed.guild_id,"forum":forumfeed.forum,"webhook":forumfeed.webhook,"postedUrls":postedFeedStreams.join(','),"firstRun":false,"latestTime":latestTime})
                })
            }catch(e){
                console.log(forumFeed)
                console.log(e.toString())
                console.log(now.toLocaleString('en-US'))
            }
        })
    }
},1000)

start()