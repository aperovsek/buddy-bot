const supabase = require('../utils/supabaseClient');

module.exports = {
  name: 'setup',
  description: 'Configure server channels and roles for the bot',
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guildId = interaction.guild.id;
    const updates = {};

    const welcomeChannel = interaction.options.getChannel('welcome-channel');
    const goodbyeChannel = interaction.options.getChannel('goodbye-channel');
    const logChannel = interaction.options.getChannel('log-channel');
    const excludeCategories = interaction.options.getString('exclude-categories');
    const botRole = interaction.options.getRole('bot-role');
    const memberRole = interaction.options.getRole('member-role');
    const userMsgId = interaction.options.getString('user-msg-id');
    const channelMsgId = interaction.options.getString('channel-msg-id');
    const totalMsgId = interaction.options.getString('total-msg-id');

    if (welcomeChannel) updates.welcome_channel_id = welcomeChannel.id;
    if (goodbyeChannel) updates.goodbye_channel_id = goodbyeChannel.id;
    if (logChannel) updates.log_channel_id = logChannel.id;
    if (excludeCategories) updates.exclude_categories = excludeCategories.split(',').map(s => s.trim());
    if (botRole) updates.bot_role_id = botRole.id;
    if (memberRole) updates.member_role_id = memberRole.id;
    if (userMsgId) updates.user_msg_id = userMsgId;
    if (channelMsgId) updates.channel_msg_id = channelMsgId;
    if (totalMsgId) updates.total_msg_id = totalMsgId;

    if (Object.keys(updates).length === 0) {
      await interaction.editReply('No configuration provided. Use options to set channels and roles.');
      return;
    }

    try {
      const { data: upsertData, error: upsertError } = await supabase
        .from('guild_configs')
        .upsert({
          guild_id: guildId,
          ...updates
        }, { onConflict: ['guild_id'] });

      if (upsertError) throw upsertError;

      const { data: config, error: fetchError } = await supabase
        .from('guild_configs')
        .select('*')
        .eq('guild_id', guildId)
        .single();

      if (fetchError) throw fetchError;

      const response = [];
      if (config.welcome_channel_id) response.push(`Welcome channel: <#${config.welcome_channel_id}>`);
      if (config.goodbye_channel_id) response.push(`Goodbye channel: <#${config.goodbye_channel_id}>`);
      if (config.log_channel_id) response.push(`Log channel: <#${config.log_channel_id}>`);
      if (config.exclude_categories && config.exclude_categories.length > 0) {
        response.push(`Excluded categories: ${config.exclude_categories.map(id => `<#${id}>`).join(', ')}`);
      }
      if (config.bot_role_id) response.push(`Bot role: <@&${config.bot_role_id}>`);
      if (config.member_role_id) response.push(`Member role: <@&${config.member_role_id}>`);
      if (config.user_msg_id) response.push(`User stats message ID: ${config.user_msg_id}`);
      if (config.channel_msg_id) response.push(`Channel stats message ID: ${config.channel_msg_id}`);
      if (config.total_msg_id) response.push(`Total stats message ID: ${config.total_msg_id}`);

      await interaction.editReply({
        content: `Configuration updated!\n${response.join('\n')}`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Setup error:', error);
      await interaction.editReply({
        content: `Error updating configuration: ${error?.message || String(error)}`,
        ephemeral: true
      });
    }
  },
};
