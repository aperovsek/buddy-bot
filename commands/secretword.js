const supabase = require('../utils/supabaseClient');

module.exports = {
    name: 'secretword',
    description: 'Set the secret word of the week for this server',
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        
        const word = interaction.options.getString('word');
        const guildId = interaction.guild.id;
        
        const { data: existing, error: fetchError } = await supabase
            .from('secret_words')
            .select('word')
            .eq('guild_id', guildId)
            .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking secret word:', fetchError);
            await interaction.editReply('Error checking secret word status.');
            return;
        }
        
        if (existing?.word) {
            await interaction.editReply('A secret word is already set for this server! Wait until the weekly reset to set a new one.');
            return;
        }
        
        const { error: updateError } = await supabase
            .from('secret_words')
            .upsert({
                guild_id: guildId,
                word: word,
                active: true,
                triggered_by: null,
                triggered_at: null,
                word_found: null
            }, { onConflict: ['guild_id'] });
        
        if (updateError) {
            console.error('Error setting secret word:', updateError);
            await interaction.editReply('Error setting secret word.');
            return;
        }
        
        await interaction.editReply(`Secret word set to: **${word}** for this server`);
    }
};
