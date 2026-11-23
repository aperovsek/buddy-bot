const fetchMessageCounts = require('../utils/fetchMessageCounts');
const { EmbedBuilder, ChannelType } = require('discord.js');
const supabase = require('../utils/supabaseClient');

module.exports = {
  name: 'log',
  description: 'Count messages per user in every channel on this server',
  async execute(interaction) {
    await interaction.reply('Counting messages, please wait...');
    const guild = interaction.guild;
    
    const { data: config } = await supabase
      .from('guild_configs')
      .select('log_channel_id, exclude_categories')
      .eq('guild_id', guild.id)
      .single();
    
    const excludedCategories = config?.exclude_categories || [];
    
    const channels = guild.channels.cache.filter(
      c => c.type === ChannelType.GuildText
      && (!config || !excludedCategories.includes(c.parentId))
    );

    const output_channel = config?.log_channel_id ? guild.channels.cache.get(config.log_channel_id) : null;

    for (const channel of channels.values()) {
      const t = Date.now();
      const counts = await fetchMessageCounts(channel);

      const rows = Object.entries(counts)
        .map(([userId, count]) => ({
          guild_id: guild.id,
          channel_id: channel.id,
          user_id: userId,
          msg_count: count,
          updated_at: new Date().toISOString(),
        }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from('user_counts')
          .upsert(rows, { onConflict: ['guild_id', 'channel_id', 'user_id'] });

        if (error) {
          console.error(`Supabase error for #${channel.name}:`, error);
        } else {
          console.log(`Log command executed in ${guild.name} for channel #${channel.name}: ` + (Date.now() - t) + "ms");
        }
      }
    }

    const { data, error } = await supabase
      .from('user_counts')
      .select('user_id, msg_count')
      .eq('guild_id', guild.id);

    if (error) {
      console.error('Supabase fetch error:', error);
      await interaction.editReply('Failed to fetch message counts from the database.');
      return;
    }

    const userTotals = {};
    for (const row of data) {
      userTotals[row.user_id] = (userTotals[row.user_id] || 0) + row.msg_count;
    }

    const sorted = Object.entries(userTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([userId, count],i) => `${i+1}. <@${userId}>: ${count}`);

    const userEmbed = new EmbedBuilder()
      .setTitle(`Total Message Counts in ${guild.name}`)
      .setDescription(
        sorted.length > 0
          ? sorted.join('\n')
          : 'No user messages found in this server.'
      )
      .setColor(0x5865F2)
      .setTimestamp();

    const { data: channelData, error: channelError } = await supabase
    .from('user_counts')
    .select('channel_id, msg_count')
    .eq('guild_id', guild.id);

    if (channelError) {
      console.error('Supabase fetch error (channels):', channelError);
      if (output_channel) await output_channel.send('Failed to fetch channel message counts from the database.');
      return;
    }

    // Aggregate totals per channel
    const channelTotals = {};
    for (const row of channelData) {
      channelTotals[row.channel_id] = (channelTotals[row.channel_id] || 0) + row.msg_count;
    }

    // Sort and format
    const sortedChannels = Object.entries(channelTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([channelId, count], i) => `${i + 1}. <#${channelId}>: ${count}`);

    const channelEmbed = new EmbedBuilder()
      .setTitle(`Total Message Counts per Channel in ${guild.name}`)
      .setDescription(
        sortedChannels.length > 0
          ? sortedChannels.join('\n')
          : 'No messages found in any channel.'
      )
      .setColor(0x57F287)
      .setTimestamp();

    // Calculate total number of messages in the server
    const totalMessages = Object.values(userTotals).reduce((sum, count) => sum + count, 0);

    const totalEmbed = new EmbedBuilder()
      .setTitle(`Total Messages in ${guild.name}`)
      .setDescription(`**${totalMessages}** messages in this server.`)
      .setColor(0xFEE75C)
      .setTimestamp();

    if (output_channel) {
      if (config?.user_msg_id && config?.channel_msg_id && config?.total_msg_id) {
        try {
          const msg1 = await output_channel.messages.fetch(config.user_msg_id);
          const msg2 = await output_channel.messages.fetch(config.channel_msg_id);
          const msg3 = await output_channel.messages.fetch(config.total_msg_id);
          await msg1.edit({ embeds: [userEmbed] });
          await msg2.edit({ embeds: [channelEmbed] });
          await msg3.edit({ embeds: [totalEmbed] });
        } catch (e) {
          await output_channel.send({ embeds: [userEmbed, channelEmbed, totalEmbed] });
        }
      } else {
        await output_channel.send({ embeds: [userEmbed, channelEmbed, totalEmbed] });
      }
    }
    
    await interaction.editReply('Log command completed!');
  },
};