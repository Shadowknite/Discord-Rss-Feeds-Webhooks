const Discord = require('discord.js');
const sql = require('sequelize');


const sqlite = new sql('forum', '', '', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: 'database.db',
    logging: false,
    //logging: console.log,
    define: {
        timestamps: false
    },
});

const rssFeed = sqlite.define('rssFeeds', {
    guild_id:{
        type: sql.DataTypes.STRING(20),
        allowNull: false,
        primaryKey: true,	
    },
    forum:{
        type: sql.DataTypes.STRING(150),
        allowNull: false,
        primaryKey: true,	
    },
    webhook:{
        type: sql.DataTypes.TEXT,
        allowNull: false,
    },
    firstRun:{
        type: sql.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    latestTime: {
        type: sql.DataTypes.DOUBLE,
        allowNull: false,
    }
});
const messages = sqlite.define('webhookMessages', {
    webhook:{
        type: sql.DataTypes.TEXT,
        allowNull: false,
        primaryKey:true
    },
    postUrl:{
        type: sql.DataTypes.TEXT,
        allowNull: false,
        primaryKey:true
    },
    messageId:{
        type: sql.DataTypes.TEXT,
        allowNull: false,
        defaultValue: null,
    },
});
sqlite.sync();

module.exports = {
    removeRssFeed: function(requested){
		return new Promise(async resolve =>{
			await rssFeed.destroy({
				where: {
					guild_id: requested.guild_id,
                    forum: requested.forum,
				},
				force: true
			});
			resolve(true);
		});
	},
    addRssFeed: function(requested){
		return new Promise(async resolve =>{
			try{
				await rssFeed.create(requested);
			}catch{
				try{
					await rssFeed.update(requested, {
						where: {
							guild_id: requested.guild_id,
							forum: requested.forum,
						}
					});
				}catch {
                    console.log("unable to write to rss feeds database: "+JSON.stringify(requested));
                }
            }
			resolve(requested);
		});
	},
    getRssFeedWebhookLoop: function(){
		return new Promise(async resolve =>{
			const list = await rssFeed.findAll({
				where: {
					webhook: {
						[sql.Op.startsWith]: 'https://discord.com/api/webhooks'
					}
				}
			});
			resolve(list);
		});
	},
    removeRssFeedMessages: function(requested){
		return new Promise(async resolve =>{
			await messages.destroy({
				where: {
					webhook: requested.webhook,
                    postUrl: requested.postUrl,
				},
				force: true
			});
			resolve(true);
		});
	},
    addRssFeedMessages: function(requested){
		return new Promise(async resolve =>{
            try{
				await messages.create(requested);
			}catch{
				try{
					await messages.update(requested, {
						where: {
							webhook: requested.webhook,
							postUrl: requested.postUrl,
						}
					});
				}catch {
                    console.log("unable to write to rss feed messages database: "+JSON.stringify(requested));
                }
            }
			resolve(requested);
		});
	},
    getRssFeedMessagesLoop: function(){
		return new Promise(async resolve =>{
			const list = await messages.findAll({ limit: 10000,order: [['messageId','DESC']]});
			resolve(list);
		});
	}
}
