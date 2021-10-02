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
        const youtubeChannels = new Discord.Collection();
        ytfeeds.forEach(yt=>{
            if(youtubeChannels.has(yt.forum)){
                youtubeChannels.get(yt.forum).push(yt)
            }else{
                youtubeChannels.set(yt.forum,[yt])
            }
        })
        const youtubeChannelsList = [...youtubeChannels.keys()]
        youtubeChannelsList.forEach(async ytChannel=>{
            try{
                const feed = await parser.parseURL(ytChannel)
                feed.items.reverse()
                youtubeChannels.get(ytChannel).forEach(ytchannel=>{
                    const postedYTStreams = ytchannel.postedUrls.split(',')
                    if(postedYTStreams[0]===''){
                        postedYTStreams.shift()
                    }
                    const webhook = new Discord.WebhookClient({url:ytchannel.webhook});
                    let latestTime = ytchannel.latestTime
                    feed.items.forEach(async item => {
                        if(!item)return
                        if(postedYTStreams.includes(item.link.trim())) return
                        const urlCheck = item.link.trim().split('/').pop()
                        const date = new Date(item.isoDate)
                        if(date.getTime()<ytchannel.latestTime){
                            return
                        }else{
                            latestTime = date.getTime()
                        }
                        const embed = new Discord.MessageEmbed()
                        if(item.title.trim().length>256){
                            embed.setTitle(`${item.title.trim().slice(0,253)}...`)
                        }else{
                            embed.setTitle(`${item.title.trim()}`)
                        }
                        if(item.contentSnippet){
                            if(item.contentSnippet.split('submitted by')[0].trim().length>1024){
                                embed.setDescription(item.contentSnippet.split('submitted by')[0].trim().slice(0,1024-item.link.trim().length)+'...')
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
                            embed.setFooter(`${item.creator.trim()} | ${date.toLocaleDateString('en-us',{year:'numeric',month:'long',day:'numeric',timeZone:'America/Los_Angeles'})} at ${date.toLocaleTimeString('en-US',{hour:'numeric',minute:'numeric',timeZone:'America/Los_Angeles'})} | ${feed.title.split('topics')[0].trim()}`)
                        }else if(item.author){
                            embed.setFooter(`${item.author.trim()} | ${date.toLocaleDateString('en-us',{year:'numeric',month:'long',day:'numeric',timeZone:'America/Los_Angeles'})} at ${date.toLocaleTimeString('en-US',{hour:'numeric',minute:'numeric',timeZone:'America/Los_Angeles'})} | ${feed.title.split('topics')[0].trim()}`)
                        }
                        if(embed.description){
                            const feedMessagePosted = feedMessages.find(posted=>posted.webhook===webhook.url&&posted.postUrl.includes(urlCheck))
                            if(!ytchannel.firstRun&&!feedMessagePosted&&!postedYTStreams.find(url=>url.includes(urlCheck))){
                                const message = await webhook.send({embeds:[embed]})
                                feedMessages.push({"webhook":webhook.url,"postUrl":item.link.trim(),"messageId":message.id})
                            }// else if(!ytchannel.firstRun&&feedMessagePosted&&postedYTStreams.find(url=>url.includes(urlCheck))){
                                // await webhook.editMessage(feedMessagePosted.messageId,{embeds:[embed]})
                            // }
                            if(postedYTStreams.find(url=>url.includes(urlCheck))){
                                postedYTStreams.splice(postedYTStreams.indexOf(postedYTStreams.find(url=>url.includes(urlCheck))), 1,item.link.trim())
                            }else{
                                postedYTStreams.push(item.link.trim())
                            }
                        }
                    })
                    while(postedYTStreams.length>150){
                        postedYTStreams.shift()
                    }
                    rssFeedDatabase.addRssFeed({"guild_id":ytchannel.guild_id,"forum":ytchannel.forum,"webhook":ytchannel.webhook,"postedUrls":postedYTStreams.join(','),"firstRun":false,"latestTime":latestTime})
                })
            }catch(e){
                console.log(ytChannel)
                console.log(now.toLocaleString('en-US'))
            }
        })
    }
},1000)

start()