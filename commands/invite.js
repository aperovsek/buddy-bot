const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'invite',
    description: 'Get an invite link to add the bot to your server',
    async execute(interaction) {
        const clientId = process.env.CLIENT_ID;
        
        if (!clientId) {
            await interaction.reply('Bot is not properly configured. Missing CLIENT_ID.');
            return;
        }
        
        const permissions = [
            'SendMessages',
            'EmbedLinks',
            'AddReactions',
            'ReadMessageHistory',
            'ManageRoles',
            'ManageMessages',
            'ViewChannel',
            'UseExternalEmojis'
        ].join(',');
        
        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot`;
        
        const embed = new EmbedBuilder()
            .setTitle('Invite Buddy Bot')
            .setDescription(`Click the link below to invite the bot to your server:`)
            .addFields(
                { name: 'Invite Link', value: inviteUrl, inline: false }
            )
            .setColor(0x5865F2)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
