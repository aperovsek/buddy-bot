const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
  new SlashCommandBuilder()
    .setName('log')
    .setDescription('Count messages per user in this channel')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Delete messages in this channel')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete (default: 10)')
        .setMinValue(1)
        .setMaxValue(1000)
    )
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Only delete messages from this user')
    ),
  new SlashCommandBuilder()
    .setName('reminder')
    .setDescription('Set a reminder')
    .addStringOption(option =>
      option.setName('time')
        .setDescription('When to remind you (e.g. 15, 2h, 1d, 16:45, 16:45 27.07.2025)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Reminder message')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option.setName('dm')
        .setDescription('Send reminder to DM (default: false)')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('reaction-roles')
    .setDescription('Send a message with reaction roles')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Message to display')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('emotes')
        .setDescription('Comma-separated emote list (e.g. 😀,😎, ...)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('roles')
        .setDescription('Comma-separated role list (e.g. @role1, @role2, ...)')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('help')  
    .setDescription('Show all commands and what they do')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('diploma')
    .setDescription('Lock in fr')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show personalized statistics')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Specify a user to view their stats')
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('secretword')
    .setDescription('Set the secret word of the week')
    .addStringOption(option =>
      option.setName('word')
        .setDescription('The secret word to set')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(8)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show server leaderboard by message count')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('test-weekly')
    .setDescription('Manually trigger weekly stats (admin only)')
    .setDefaultMemberPermissions(8)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure server channels for the bot')
    .addChannelOption(option =>
      option.setName('welcome-channel')
        .setDescription('Channel for welcome messages')
        .setRequired(false)
    )
    .addChannelOption(option =>
      option.setName('goodbye-channel')
        .setDescription('Channel for goodbye messages')
        .setRequired(false)
    )
    .addChannelOption(option =>
      option.setName('log-channel')
        .setDescription('Channel for log output')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('exclude-categories')
        .setDescription('Comma-separated list of category IDs to exclude from logging')
        .setRequired(false)
    )
    .addRoleOption(option =>
      option.setName('bot-role')
        .setDescription('Role to assign to bots')
        .setRequired(false)
    )
    .addRoleOption(option =>
      option.setName('member-role')
        .setDescription('Role to assign to new members')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('user-msg-id')
        .setDescription('Message ID for user stats embed')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('channel-msg-id')
        .setDescription('Message ID for channel stats embed')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('total-msg-id')
        .setDescription('Message ID for total stats embed')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(8)
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Slash commands registered!');
  } catch (error) {
    console.error(error);
  }
})();