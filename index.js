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
    if(now.getMinutes()%2===1&&now.getSeconds()===0){
        feedMessages.forEach(async messagePost=>{
            await rssFeedDatabase.addRssFeedMessages(messagePost)
        })
    }
	if(now.getMinutes()%2===0&&now.getSeconds()===0){
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
                    const postedFeedStreams = forumfeed.postedUrls.split(',')
                    if(postedFeedStreams[0]===''){
                        postedFeedStreams.shift()
                    }
                    const webhook = new Discord.WebhookClient({url:forumfeed.webhook});
                    let latestTime = forumfeed.latestTime
                    feed.items.forEach(async item => {
                        if(!item)return
                        if(postedFeedStreams.includes(item.link.trim())) return
                        const urlCheck = item.link.trim().split('/').pop()
                        const date = new Date(item.isoDate)
                        if(date.getTime()<forumfeed.latestTime){
                            return
                        }else{
                            latestTime = date.getTime()
                        }
                        const embed = new Discord.MessageEmbed()
                        if(item.title.trim().length>256){
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
                            embed.setFooter({text:`${item.creator.trim()} | ${feed.title.split('topics')[0].trim()} | ${date.toLocaleDateString('en-us',{year:'numeric',month:'long',day:'numeric',timeZone:'America/Los_Angeles'})} at ${date.toLocaleTimeString('en-US',{hour:'numeric',minute:'numeric',timeZone:'America/Los_Angeles'})}`})
                        }else if(item.author){
                            embed.setFooter({text:`${item.author.trim()} | ${feed.title.split('topics')[0].trim()} | ${date.toLocaleDateString('en-us',{year:'numeric',month:'long',day:'numeric',timeZone:'America/Los_Angeles'})} at ${date.toLocaleTimeString('en-US',{hour:'numeric',minute:'numeric',timeZone:'America/Los_Angeles'})}`})
                        }
                        if(embed.description){
                            const feedMessagePosted = feedMessages.find(posted=>posted.webhook===webhook.url&&posted.postUrl.includes(urlCheck))
                            if(!forumfeed.firstRun&&!feedMessagePosted&&!postedFeedStreams.find(url=>url.includes(urlCheck))){
                                const message = await webhook.send({embeds:[embed]})
                                feedMessages.push({"webhook":webhook.url,"postUrl":item.link.trim(),"messageId":message.id})
                            }
                            if(postedFeedStreams.find(url=>url.includes(urlCheck))){
                                postedFeedStreams.splice(postedFeedStreams.indexOf(postedFeedStreams.find(url=>url.includes(urlCheck))), 1,item.link.trim())
                            }else{
                                postedFeedStreams.push(item.link.trim())
                            }
                        }
                    })
                    while(postedFeedStreams.length>150){
                        postedFeedStreams.shift()
                    }
                    rssFeedDatabase.addRssFeed({"guild_id":forumfeed.guild_id,"forum":forumfeed.forum,"webhook":forumfeed.webhook,"postedUrls":postedFeedStreams.join(','),"firstRun":false,"latestTime":latestTime})
                })
            }catch(e){
                console.log(forumFeed)
                console.log(now.toLocaleString('en-US'))
            }
        })
    }
},1000)

start()