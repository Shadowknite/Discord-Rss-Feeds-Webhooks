const Discord = require('discord.js');
const forumsDatabase = require(`${process.cwd()}/forumDatabase`);
const Parser = require('rss-parser');
const parser = new Parser();

function start(){
	const date = new Date()
    console.log('Ready!');
    console.log(date.toLocaleString('en-US'))
}

setInterval(async ()=>{
	const now = new Date();
	if(now.getMinutes()%2===0&&now.getSeconds()===0){
        const ytfeeds = await forumsDatabase.getForumsWebhookLoop()
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
                    const webhookLink = ytchannel.webhook.split('/')
                    const webhookToken = webhookLink.pop()
                    const webhookID = webhookLink.pop()
                    const webhook = new Discord.WebhookClient({id:webhookID, token:webhookToken});
                    let latestTime = ytchannel.latestTime
                    feed.items.forEach(async item => {
                        if(!item)return
                        if(postedYTStreams.includes(item.link.trim())) return
                        const urlCheck = item.link.trim().split('/').pop()
                        if(postedYTStreams.find(url=>url.includes(urlCheck))) return
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
                        if(item.link.trim().includes('community.stadia.com')){
                            embed.setColor(0xFC4A1F)
                        }
                        if(embed.description){
                            postedYTStreams.push(item.link.trim())
                            if(!ytchannel.firstRun){
                                await webhook.send({embeds:[embed]})
                            }
                        }
                    })
                    while(postedYTStreams.length>300){
                        postedYTStreams.shift()
                    }
                    forumsDatabase.addForums({"guild_id":ytchannel.guild_id,"forum":ytchannel.forum,"webhook":ytchannel.webhook,"postedUrls":postedYTStreams.join(','),"firstRun":false,"latestTime":latestTime})
                })
            }catch(e){
                console.log(ytChannel)
                console.log(e)
                console.log(now.toLocaleString('en-US'))
            }
        })
    }
},1000)

start()
