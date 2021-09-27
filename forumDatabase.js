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

const forums = sqlite.define('forums', {
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
    postedUrls:{
        type: sql.DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
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
sqlite.sync();

module.exports = {
    removeForums: function(requested){
		return new Promise(async resolve =>{
			await forums.destroy({
				where: {
					guild_id: requested.guild_id,
                    channel: requested.channel,
				},
				force: true
			});
			resolve(true);
		});
	},
    addForums: function(requested){
		return new Promise(async resolve =>{
			try{
                await forums.upsert(requested)
            }catch {
                console.log("unable to write to forums database: "+JSON.stringify(requested));
            }
			resolve(requested);
		});
	},
    getForumsWebhookLoop: function(){
		return new Promise(async resolve =>{
			const list = await forums.findAll({
				where: {
					webhook: {
						[sql.Op.startsWith]: 'https://discord.com/api/webhooks'
					}
				}
			});
			resolve(list);
		});
	}
}
