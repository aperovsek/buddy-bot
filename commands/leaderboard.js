const { EmbedBuilder } = require('discord.js');
const supabase = require('../utils/supabaseClient');

module.exports = {
    name: 'leaderboard',
    description: 'Show server leaderboard by message count',
    async execute(interaction) {
        await interaction.deferReply();
        
        const guild = interaction.guild;
        
        await guild.members.fetch();
        const currentMemberIds = new Set(guild.members.cache.map(member => member.id));
        
        const { data: userCounts, error } = await supabase
            .from('user_counts')
            .select('user_id, msg_count')
            .eq('guild_id', guild.id);

        if (error) {
            console.error('Error fetching leaderboard:', error);
            await interaction.editReply('Failed to fetch leaderboard data.');
            return;
        }

        const userTotals = {};
        for (const row of userCounts || []) {
            if (currentMemberIds.has(row.user_id)) {
                userTotals[row.user_id] = (userTotals[row.user_id] || 0) + row.msg_count;
            }
        }

        const sortedUsers = Object.entries(userTotals)
            .sort((a, b) => b[1] - a[1]);

        const leaderboard = sortedUsers
            .slice(0, 20)
            .map(([userId, count], index) => {
                const rank = index + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : ` ${rank}.`;
                return `${medal} <@${userId}>: ${count} messages`;
            })
            .join('\n');

        const embed = new EmbedBuilder()
            .setTitle(`🏆 ${guild.name} Leaderboard`)
            .setDescription(leaderboard || 'No messages found in this server.')
            .setColor(0xFFD700)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
