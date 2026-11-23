const { EmbedBuilder } = require('discord.js');
const supabase = require('../utils/supabaseClient');

module.exports = {
    name: 'stats',
    description: 'Show personalized statistics',
    async execute(interaction) {
        await interaction.deferReply();

        const user = interaction.options.getUser('user') || interaction.user;
        const guild = interaction.guild;
        const member = await guild.members.fetch(user.id).catch(() => null);
        const displayName = member?.displayName || user.username;

        const { data: allCounts, error: fetchError } = await supabase
            .from('user_counts')
            .select('msg_count, channel_id')
            .eq('guild_id', guild.id)
            .eq('user_id', user.id);

        const { data: weeklyCounts, error: weeklyError } = await supabase
            .from('user_counts_week')
            .select('msg_count, react_given, react_received')
            .eq('guild_id', guild.id)
            .eq('user_id', user.id);

        const totalMessages = allCounts?.reduce((sum, row) => sum + row.msg_count, 0) || 0;

        const channelMessages = {};
        if (allCounts) {
            for (const row of allCounts) {
                channelMessages[row.channel_id] = (channelMessages[row.channel_id] || 0) + row.msg_count;
            }
        }
        const sortedChannels = Object.entries(channelMessages)
            .sort((a, b) => b[1] - a[1]);
        const favoriteChannelId = sortedChannels.length > 0 ? sortedChannels[0][0] : null;
        const favoriteChannel = favoriteChannelId ? `<#${favoriteChannelId}>` : 'N/A';

        const weeklyMessages = weeklyCounts?.reduce((sum, row) => sum + row.msg_count, 0) || 0;
        const weeklyReactionsGiven = weeklyCounts?.reduce((sum, row) => sum + (row.react_given || 0), 0) || 0;
        const weeklyReactionsReceived = weeklyCounts?.reduce((sum, row) => sum + (row.react_received || 0), 0) || 0;


        const { data: allUserCounts, error: allError } = await supabase
            .from('user_counts')
            .select('user_id, msg_count')
            .eq('guild_id', guild.id);

        const userTotals = {};
        if (allUserCounts) {
            for (const row of allUserCounts) {
                userTotals[row.user_id] = (userTotals[row.user_id] || 0) + row.msg_count;
            }
        }
        const sortedUsers = Object.entries(userTotals)
            .sort((a, b) => b[1] - a[1]);
        const userRank = sortedUsers.findIndex(([uid]) => uid === user.id) + 1;

        const { data: userBeerCount, error: beerError } = await supabase
            .from('beer_count')
            .select('*')
            .eq('guild_id', guild.id)
            .eq('user_id', user.id);

        const totalBeerMentions = userBeerCount?.length || 0;

        const title = user.id === interaction.user.id ? "Your Stats" : `${displayName}'s Stats`;
        const embedTotal = new EmbedBuilder()
            .setTitle(title)
            .setDescription("Here are your personalized statistics:")
            .addFields(
                { name: 'Messages Sent', value: totalMessages.toString(), inline: true },
                { name: 'Favourite Channel', value: favoriteChannel, inline: true },
                { name: 'Server Rank', value: userRank > 0 ? `#${userRank}` : 'N/A', inline: true },
                { name: 'Beer Mentions', value: totalBeerMentions.toString(), inline: true },
            )
            .setColor(0x00AE86);

        const embedWeek = new EmbedBuilder()
            .setTitle("Last Week's Activity")
            .setDescription("Here are your statistics for the previous week:")
            .addFields(
                { name: 'Messages Sent', value: weeklyMessages.toString(), inline: true },
                { name: 'Reactions Given', value: weeklyReactionsGiven.toString(), inline: true },
                { name: 'Reactions Received', value: weeklyReactionsReceived.toString(), inline: true },
            )
            .setColor(0x0000FF);

        await interaction.editReply({ embeds: [embedTotal, embedWeek] });
    }
};
