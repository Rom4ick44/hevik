const fs = require('node:fs');
const path = require('node:path');
const { createReplayModule, getReplayCommands } = require('./replays');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  ContainerBuilder,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  ModalBuilder,
  Partials,
  PermissionFlagsBits,
  REST,
  Routes,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
  TextDisplayBuilder,
  ThumbnailBuilder
} = require('discord.js');

const DATA_FILE_NAMES = {
  afk: 'afk.json',
  leaves: 'leaves.json',
  profiles: 'profiles.json',
  reports: 'reports.json',
  settings: 'settings.json',
  warns: 'warns.json',
  aura: 'aura.json',
  events: 'events.json',
  cheatChecks: 'cheat-checks.json',
  tickets: 'tickets.json',
  tempVoices: 'temp-voices.json'
};

const DEFAULT_EMOJIS = {
  done: '',
  afk: '',
  weekend: '',
  profile: '',
  magic1: '',
  orl: '',
  discord: '',
  tg: '',
  twitch: '',
  youtube: '',
  tiktok: '',
  voice: '',
  no: '',
  main: '',
  tiger: '',
  scout: '',
  redgroup: '',
  bluegroup: '',
  groupcoller: '',
  coller: '',
  list: '',
  hwt_logo: '',
  hwt_apply: '',
  hwt_link: '',
  hwt_register: '',
  hwt_telegram: '',
  hwt_replay: '',
  hwt_clean: '',
  hwt_check: '',
  hwt_warn: '',
  hwt_voice: '',
  hwt_drive: '',
  hwt_youtube: '',
  hwt_twitch: '',
  hwt_tiktok: '',
  hwt_media: '',
  hwt_security: '',
  hwt_afk: '',
  hwt_profile: '',
  hwt_warn_remove: '',
  hwt_ticket: '',
  hwt_accept: '',
  hwt_reject: '',
  hwt_interview: '',
  hwt_delete: '',
  hwt_refresh: '',
  hwt_calendar: '',
  hwt_clock: '',
  hwt_roster: '',
  hwt_main: '',
  hwt_reserve: '',
  hwt_tag: '',
  hwt_no_voice: '',
  hwt_progress: '',
  hwt_rank: '',
  hwt_capt: '',
  hwt_mcl: '',
  hwt_upload: '',
  hwt_pending: '',
  hwt_success: '',
  hwt_error: '',
  hwt_dm: '',
  hwt_unlock: '',
  hwt_lock: '',
  hwt_staff: '',
  hwt_orlando: '',
  hwt_gg: '',
  hwt_info: '',
  hwt_vzz: ''
};

const DEFAULT_IMAGES = {
  globalPanel: '',
  ticketPanel: '',
  linksPanel: '',
  interactionPanel: '',
  afkPanel: '',
  warnPanel: '',
  captPanel: '',
  mclPanel: '',
  cheatCheckPanel: '',
  panelThumbnail: '',
  ticketThumbnail: '',
  linksThumbnail: '',
  interactionThumbnail: '',
  afkThumbnail: '',
  warnThumbnail: '',
  captThumbnail: '',
  mclThumbnail: '',
  cheatCheckThumbnail: '',
  replayThumbnail: '',
  leaveCard: '',
  profileCard: '',
  reportCard: '',
  replayPanel: ''
};

const BANNER_URL = DEFAULT_IMAGES.globalPanel;
const LOGO_FILE_NAME = 'family-logo.png';
const LOGO_FILE_PATH = path.join(process.cwd(), 'assets', LOGO_FILE_NAME);
const LOGO_URL = `attachment://${LOGO_FILE_NAME}`;
const PANEL_STRIPE_COLOR = 0xE5E7EB;
const PANEL_DARK_COLOR = 0x2b2d31;
function attachmentLogoUrl() {
  return fs.existsSync(LOGO_FILE_PATH) ? LOGO_URL : null;
}

const TICKET_TRACKS = {
  main: { label: 'MAIN', emojiKey: 'main' }
};

const TICKET_ACCEPT_ROLES = {
  main: { label: 'MAIN', roleConfigKey: 'test', emojiKey: 'main' }
};

const PROFILE_CHANNEL_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.SendMessagesInThreads,
  PermissionFlagsBits.ReadMessageHistory
];

const PROFILE_THREAD_DEFS = [
  { key: 'mcl', name: 'MCL', title: 'MCL', legacyNames: ['# MCL'] },
  { key: 'capt', name: 'CAPT', title: 'CAPT', legacyNames: ['# CAPT'] },
  { key: 'gg', name: 'GG', title: 'GG', legacyNames: ['#GG', '# GG'] },
  { key: 'replays', name: 'Replays', title: 'Replays', legacyNames: ['# Replays'] }
];

const PROFILE_CATEGORY_CAPACITY = 50;
const AFK_REMINDER_AFTER_MS = 12 * 60 * 60 * 1000;
const AFK_CLEANUP_INTERVAL_MS = 60 * 1000;
const INACTIVE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;
const REPLAY_REQUEST_TTL_MS = 24 * 60 * 60 * 1000;
const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const MAX_BACKUP_SNAPSHOTS = 14;
const DEFAULT_TEMP_VOICE_CATEGORY_NAME = 'custom';
const DEFAULT_TEMP_VOICE_CONTROL_NAME = 'manage-voice';
const DEFAULT_TEMP_VOICE_CREATE_NAME = 'create-voice';
const DEFAULT_TEMP_VOICE_USER_LIMIT = 5;

const DEFAULT_AURA_RANKS = [
  { name: 'Iron', emoji: '', min: 0 },
  { name: 'Bronze', emoji: '', min: 200 },
  { name: 'Silver', emoji: '', min: 500 },
  { name: 'Gold', emoji: '', min: 1000 },
  { name: 'Platinum', emoji: '', min: 2000 },
  { name: 'Diamond', emoji: '', min: 3500 },
  { name: 'Radiant', emoji: '', min: 5000 }
];

const DEFAULT_PROFILE_CATEGORY_ROLE_DEFS = [
  { label: 'main', roleConfigKey: 'main', roleIds: [] },
  { label: 'test', roleConfigKey: 'test', roleIds: [] },
  { label: 'heavyweight', roleConfigKey: 'heavyweight', roleIds: [] }
];

const DEFAULT_PROFILE_CATEGORY_FALLBACK_DEF = { label: 'profile', roleConfigKey: null, roleIds: [] };
const REQUIRED_PROFILE_ACCESS_ROLE_IDS = [];

const AURA_POINTS = {
  voiceHour: 12,
  ticketReviewed: 35,
  ticketAccepted: 55,
  captPlus: 12,
  mclPlus: 15
};

function loadDotEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.error(`Failed to parse ${filePath}`, error);
    return fallback;
  }
}

function configFilePath() {
  return process.env.CONFIG_PATH || path.join(process.cwd(), 'config.json');
}

class JsonStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.cache = new Map();
  }

  ensureDir() {
    fs.mkdirSync(this.dataDir, { recursive: true });
  }

  load(name, fallback) {
    this.ensureDir();
    if (!this.cache.has(name)) {
      const filePath = path.join(this.dataDir, DATA_FILE_NAMES[name]);
      this.cache.set(name, readJson(filePath, fallback));
    }
    return this.cache.get(name);
  }

  save(name, value) {
    this.ensureDir();
    const filePath = path.join(this.dataDir, DATA_FILE_NAMES[name]);
    this.cache.set(name, value);
    const data = JSON.stringify(value, null, 2);
    const maxRetries = 5;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        fs.writeFileSync(filePath, data);
        return;
      } catch (err) {
        if (err.code === 'EBUSY' && attempt < maxRetries - 1) {
          attempt++;
          const delay = Math.min(100 * Math.pow(2, attempt), 1000);
          const deadline = Date.now() + delay;
          while (Date.now() < deadline) { /* busy-wait for EBUSY retry */ }
          continue;
        }
        throw err;
      }
    }
  }
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeConfig(rawConfig) {
  const mergeUnique = (base, extra) => {
    const result = [];
    const add = (v) => {
      if (!v || typeof v !== 'string') return;
      const s = v.trim();
      if (!s) return;
      if (!result.includes(s)) result.push(s);
    };
    for (const v of ensureArray(base)) add(v);
    for (const v of ensureArray(extra)) add(v);
    return result;
  };

  const socials = {
    discord: [],
    telegram: [],
    youtube: [],
    twitch: [],
    tiktok: [],
    ...(rawConfig.socials || {})
  };

  socials.telegram = mergeUnique(socials.telegram, []);
  socials.twitch = mergeUnique(socials.twitch, []);

  return {
    ...rawConfig,
    theme: {
      accent: 0xffffff,
      muted: 0x959595,
      danger: 0xe02b2b,
      success: 0x57f287,
      ...(rawConfig.theme || {})
    },
    channels: rawConfig.channels || {},
    categories: rawConfig.categories || {},
    logs: {
      bot: '',
      leave: '',
      memberLeave: '',
      ticket: '',
      ticketDelete: '',
      profile: '',
      mcl: '',
      replay: '',
      ...(rawConfig.logs || {})
    },
    roles: {
      inactive: '',
      main: '',
      test: '',
      heavyweight: '',
      penalty: '',
      recruits: [],
      highrank: [],
      profileAccess: [],
      ticketAccess: [],
      ticketDeleteAccess: [],
      protectedFromLeaveRemoval: [],
      cheatVerified: '',
      cheathunter: [],
      ...(rawConfig.roles || {})
    },
    socials,
    ticket: {
      serverName: 'Family',
      serverEmoji: '',
      ...(rawConfig.ticket || {})
    },
    capt: {
      defaultSlots: 35,
      reserveEmoji: '🦁',
      ...(rawConfig.capt || {})
    },
    mcl: {
      defaultSlots: 8,
      ...(rawConfig.mcl || {})
    },
    replays: {
      enabled: true,
      dbPath: 'video.db',
      panelChannelId: '',
      requestChannelId: '',
      logChannelId: '',
      reviewerRoleIds: [],
      bannerUrl: '',
      ...(rawConfig.replays || {})
    },
    tempVoice: {
      enabled: true,
      categoryName: DEFAULT_TEMP_VOICE_CATEGORY_NAME,
      controlChannelName: DEFAULT_TEMP_VOICE_CONTROL_NAME,
      createChannelName: DEFAULT_TEMP_VOICE_CREATE_NAME,
      defaultUserLimit: DEFAULT_TEMP_VOICE_USER_LIMIT,
      allowedRoleIds: [],
      ...(rawConfig.tempVoice || {})
    },
    ownerId: rawConfig.ownerId || '',
    ownerRoleId: rawConfig.ownerRoleId || '',
    auraRanks: rawConfig.auraRanks || DEFAULT_AURA_RANKS,
    profileCategory: {
      roleDefs: rawConfig.profileCategory?.roleDefs || DEFAULT_PROFILE_CATEGORY_ROLE_DEFS,
      fallbackDef: rawConfig.profileCategory?.fallbackDef || DEFAULT_PROFILE_CATEGORY_FALLBACK_DEF
    },
    emojis: {
      ...DEFAULT_EMOJIS,
      ...(rawConfig.emojis || {})
    },
    images: {
      ...DEFAULT_IMAGES,
      ...(rawConfig.images || {})
    }
  };
}

function resolveConfig() {
  const configPath = configFilePath();
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}. Copy config.example.json to config.json and fill it in.`);
  }

  if (!process.env.BOT_TOKEN) {
    throw new Error('BOT_TOKEN environment variable is required.');
  }

  const config = normalizeConfig(JSON.parse(fs.readFileSync(configPath, 'utf8')));
  return config;
}

function limitEmbedText(value, maxLength, fallback = null) {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value);
  if (!text.length) {
    return fallback;
  }

  return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 3))}...` : text;
}

function sanitizeEmbedFields(fields) {
  return ensureArray(fields).slice(0, 25).map((field) => ({
    name: limitEmbedText(field.name, 256, '-') || '-',
    value: limitEmbedText(field.value, 1024, '-') || '-',
    inline: Boolean(field.inline)
  }));
}

function createEmbed(config, options) {
  const embed = new EmbedBuilder()
    .setColor(options.color ?? config.theme.accent ?? PANEL_STRIPE_COLOR);

  const title = limitEmbedText(options.title, 256);
  if (title) {
    embed.setTitle(title);
  }

  const description = limitEmbedText(options.description, 4096);
  if (description) {
    embed.setDescription(description);
  }

  if (options.fields?.length) {
    embed.addFields(sanitizeEmbedFields(options.fields));
  }

  if (options.footer) {
    embed.setFooter({ text: limitEmbedText(options.footer, 2048, '') || '' });
  }

  if (options.thumbnail) {
    embed.setThumbnail(options.thumbnail);
  }

  if (options.image) {
    embed.setImage(options.image);
  }

  if (options.timestamp) {
    embed.setTimestamp(options.timestamp === true ? new Date() : options.timestamp);
  }

  return embed;
}

function sanitizeName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё_-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'player';
}

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function formatTime(date = new Date()) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function pluralRu(count, one, few, many) {
  const n = Math.abs(Number(count)) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return many;
  if (n1 > 1 && n1 < 5) return few;
  if (n1 === 1) return one;
  return many;
}

function memberTag(memberId) {
  return `<@${memberId}>`;
}

function roleTag(roleId) {
  return `<@&${roleId}>`;
}

function mentionRoles(roleIds) {
  const ids = ensureArray(roleIds).filter(Boolean);
  return ids.length ? ids.map((roleId) => roleTag(roleId)).join(' ') : '';
}

function resolveChannelId(config, key) {
  const aliases = {
    captPlus: ['captPlus', 'capt-pluse', 'captPluse'],
    mclPlus: ['mclPlus', 'mcl-pluse', 'mclPluse'],
    cheatCheck: ['cheatCheck', 'cheat-check', 'cheatcheck']
  };

  const variants = aliases[key] || [key];
  for (const variant of variants) {
    const channelId = normalizeDiscordId(config.channels?.[variant]);
    if (channelId) {
      return channelId;
    }
  }

  if (key === 'cheatCheck') {
    return configRef.value?.channels?.cheatCheck || '';
  }

  return null;
}

function isPanelChannelConfigured(config, key) {
  return Boolean(resolveChannelId(config, key));
}

async function ensureGuildRolesCached(guild) {
  await guild.roles.fetch().catch(() => null);
}

function hasAnyRole(member, roleIds) {
  return ensureArray(roleIds).some((roleId) => member.roles.cache.has(roleId));
}

function canManageTickets(member, config) {
  const allowedRoleIds = [...ensureArray(config.roles.ticketAccess), ...ensureArray(config.roles.highrank)];
  return hasAnyRole(member, allowedRoleIds);
}

function canDeleteTickets(member, config) {
  const allowedRoleIds = [
    ...ensureArray(config.roles.ticketDeleteAccess)
  ];
  return hasAnyRole(member, allowedRoleIds);
}

function canUseSlashCommands(member, config) {
  return hasAnyRole(member, [...ensureArray(config.roles.highrank), ...ensureArray(config.roles.main ? [config.roles.main] : [])]);
}

function getProfileOwnerRoleIds(config) {
  return [...new Set([
    config.roles?.heavyweight,
    config.roles?.test,
    config.roles?.main
  ].filter(Boolean))];
}

function getProfileStaffAccessRoleIds(config) {
  return [...new Set([
    ...ensureArray(config.roles?.highrank),
    ...ensureArray(config.roles?.profileAccess)
  ].filter(Boolean))];
}

function canUseProfileFeature(member, config) {
  return hasAnyRole(member, getProfileOwnerRoleIds(config));
}

function canUseAuraCommand(member) {
  return hasAnyRole(member, [configRef.value?.roles?.heavyweight].filter(Boolean));
}

function canUseStatsCommand(member) {
  return hasAnyRole(member, [configRef.value?.roles?.main, ...ensureArray(configRef.value?.roles?.highrank), ...ensureArray(configRef.value?.roles?.recruits)].filter(Boolean));
}

function canUseSetupCommand(member) {
  return hasAnyRole(member, ensureArray(configRef.value?.roles?.highrank));
}

function getCheatHunterRoleIds(config) {
  return [...new Set(ensureArray(config.roles?.cheathunter).filter(Boolean))];
}

function getCheatVerifiedRoleId(config) {
  return config.roles?.cheatVerified || '';
}

function canManageCheatChecks(member, config) {
  return hasAnyRole(member, [...ensureArray(config.roles?.highrank), ...getCheatHunterRoleIds(config)]);
}

function auraDefaults() {
  return { voice: {}, rankOverrides: {}, reminders: {} };
}

function getAuraData(store) {
  const data = store.load('aura', auraDefaults());
  data.voice = data.voice || {};
  data.rankOverrides = data.rankOverrides || {};
  data.reminders = data.reminders || {};
  return data;
}

function getAuraVoiceEntry(data, userId) {
  data.voice[userId] = data.voice[userId] || {
    totalMs: 0,
    daily: {},
    sessionStartedAt: null
  };
  data.voice[userId].daily = data.voice[userId].daily || {};
  return data.voice[userId];
}

function addAuraVoiceDailyMs(entry, startedAtMs, endedAtMs) {
  let cursor = startedAtMs;
  while (cursor < endedAtMs) {
    const day = new Date(cursor).toISOString().slice(0, 10);
    const nextDay = new Date(`${day}T00:00:00.000Z`).getTime() + (24 * 60 * 60 * 1000);
    const chunkEnd = Math.min(endedAtMs, nextDay);
    entry.daily[day] = Math.max(0, Number(entry.daily[day]) || 0) + (chunkEnd - cursor);
    cursor = chunkEnd;
  }
}

function startAuraVoiceSession(store, userId, now = Date.now()) {
  const data = getAuraData(store);
  const entry = getAuraVoiceEntry(data, userId);
  if (!entry.sessionStartedAt) {
    entry.sessionStartedAt = new Date(now).toISOString();
    store.save('aura', data);
  }
}

function endAuraVoiceSession(store, userId, now = Date.now()) {
  const data = getAuraData(store);
  const entry = getAuraVoiceEntry(data, userId);
  if (!entry.sessionStartedAt) {
    return;
  }

  const startedAt = new Date(entry.sessionStartedAt).getTime();
  if (Number.isFinite(startedAt) && startedAt < now) {
    const durationMs = now - startedAt;
    entry.totalMs = Math.max(0, Number(entry.totalMs) || 0) + durationMs;
    addAuraVoiceDailyMs(entry, startedAt, now);
  }
  entry.sessionStartedAt = null;
  store.save('aura', data);
}

function getAuraVoiceMs(store, userId, now = Date.now()) {
  const data = getAuraData(store);
  const entry = data.voice?.[userId];
  if (!entry) {
    return 0;
  }

  let totalMs = Math.max(0, Number(entry.totalMs) || 0);
  const startedAt = entry.sessionStartedAt ? new Date(entry.sessionStartedAt).getTime() : null;
  if (Number.isFinite(startedAt) && startedAt < now) {
    totalMs += now - startedAt;
  }
  return totalMs;
}

async function syncAuraVoiceSessionsOnStartup(client, config, store) {
  const guild = await client.guilds.fetch(config.guildId).catch(() => null);
  if (!guild) {
    return;
  }

  const activeUserIds = new Set(
    [...guild.voiceStates.cache.values()]
      .filter((state) => state.channelId && !state.member?.user?.bot)
      .map((state) => state.id)
  );

  const data = getAuraData(store);
  let changed = false;
  for (const [userId, entry] of Object.entries(data.voice)) {
    if (entry?.sessionStartedAt && !activeUserIds.has(userId)) {
      entry.sessionStartedAt = null;
      changed = true;
    }
  }

  for (const userId of activeUserIds) {
    const entry = getAuraVoiceEntry(data, userId);
    if (!entry.sessionStartedAt) {
      entry.sessionStartedAt = new Date().toISOString();
      changed = true;
    }
  }

  if (changed) {
    store.save('aura', data);
  }
}

function collectTicketAuraStats(tickets, userId) {
  const reviewedTicketIds = new Set();
  let accepted = 0;
  let rejected = 0;
  let interviews = 0;

  for (const ticket of Object.values(tickets || {})) {
    if (!ticket) continue;
    if (ticket.acceptedById === userId) {
      accepted += 1;
      reviewedTicketIds.add(ticket.channelId || ticket.id);
    }
    if (ticket.rejectedById === userId) {
      rejected += 1;
      reviewedTicketIds.add(ticket.channelId || ticket.id);
    }
    if (ticket.interviewById === userId) {
      interviews += 1;
      reviewedTicketIds.add(ticket.channelId || ticket.id);
    }
  }

  return {
    reviewed: reviewedTicketIds.size,
    accepted,
    rejected,
    interviews
  };
}

function collectEventPlusStats(events, userId) {
  const stats = { capt: 0, mcl: 0 };
  for (const event of Object.values(events || {})) {
    if (!event || (event.type !== 'capt' && event.type !== 'mcl')) continue;

    const hasTrackedPlus = event.plusMessages && Object.prototype.hasOwnProperty.call(event.plusMessages, userId);
    const hasLegacyRosterEntry =
      !event.plusMessages &&
      (ensureArray(event.main).includes(userId) || ensureArray(event.reserve).includes(userId));

    if (hasTrackedPlus || hasLegacyRosterEntry) {
      stats[event.type] += 1;
    }
  }
  return stats;
}

function snowflakeTimestampMs(id) {
  try {
    return Number((BigInt(String(id)) >> 22n) + 1420070400000n);
  } catch {
    return null;
  }
}

function isAfterTimestamp(value, sinceMs) {
  if (!sinceMs) {
    return true;
  }

  const time = value ? new Date(value).getTime() : null;
  return Number.isFinite(time) && time >= sinceMs;
}

function collectTicketAuraStatsSince(tickets, userId, sinceMs = null) {
  const reviewedTicketIds = new Set();
  let accepted = 0;
  let rejected = 0;
  let interviews = 0;

  for (const ticket of Object.values(tickets || {})) {
    if (!ticket) continue;
    const ticketId = ticket.channelId || ticket.id;
    if (ticket.acceptedById === userId && isAfterTimestamp(ticket.acceptedAt, sinceMs)) {
      accepted += 1;
      reviewedTicketIds.add(ticketId);
    }
    if (ticket.rejectedById === userId && isAfterTimestamp(ticket.rejectedAt, sinceMs)) {
      rejected += 1;
      reviewedTicketIds.add(ticketId);
    }
    if (ticket.interviewById === userId && isAfterTimestamp(ticket.interviewAt, sinceMs)) {
      interviews += 1;
      reviewedTicketIds.add(ticketId);
    }
  }

  return { reviewed: reviewedTicketIds.size, accepted, rejected, interviews };
}

function collectEventPlusStatsSince(events, userId, sinceMs = null) {
  const stats = { capt: 0, mcl: 0 };
  for (const event of Object.values(events || {})) {
    if (!event || (event.type !== 'capt' && event.type !== 'mcl')) continue;

    const messageId = event.plusMessages?.[userId];
    const plusTime = messageId ? snowflakeTimestampMs(messageId) : null;
    const hasTrackedPlus = Boolean(messageId) && (!sinceMs || (plusTime && plusTime >= sinceMs));
    const hasLegacyRosterEntry =
      !event.plusMessages &&
      !sinceMs &&
      (ensureArray(event.main).includes(userId) || ensureArray(event.reserve).includes(userId));

    if (hasTrackedPlus || hasLegacyRosterEntry) {
      stats[event.type] += 1;
    }
  }
  return stats;
}

function getAuraVoiceMsSince(store, userId, sinceMs) {
  const data = getAuraData(store);
  const entry = data.voice?.[userId];
  if (!entry?.daily) {
    return 0;
  }

  let total = 0;
  for (const [day, ms] of Object.entries(entry.daily)) {
    const dayEnd = new Date(`${day}T23:59:59.999Z`).getTime();
    if (dayEnd >= sinceMs) {
      total += Math.max(0, Number(ms) || 0);
    }
  }
  return total;
}

function calculateAuraPoints({ voiceMs, ticketStats, plusStats }) {
  const voiceHours = voiceMs / (60 * 60 * 1000);
  return Math.floor(
    (voiceHours * AURA_POINTS.voiceHour) +
    (ticketStats.reviewed * AURA_POINTS.ticketReviewed) +
    (ticketStats.accepted * AURA_POINTS.ticketAccepted) +
    (plusStats.capt * AURA_POINTS.captPlus) +
    (plusStats.mcl * AURA_POINTS.mclPlus)
  );
}

function buildAuraSnapshot(store, userId, sinceMs = null) {
  const tickets = store.load('tickets', ticketsDefaults());
  const events = store.load('events', {});
  const ticketStats = sinceMs ? collectTicketAuraStatsSince(tickets, userId, sinceMs) : collectTicketAuraStats(tickets, userId);
  const plusStats = sinceMs ? collectEventPlusStatsSince(events, userId, sinceMs) : collectEventPlusStats(events, userId);
  const voiceMs = sinceMs ? getAuraVoiceMsSince(store, userId, sinceMs) : getAuraVoiceMs(store, userId);
  const auraPoints = calculateAuraPoints({ voiceMs, ticketStats, plusStats });
  return { voiceMs, ticketStats, plusStats, auraPoints };
}

function collectAuraUserIds(store) {
  const ids = new Set();
  const tickets = store.load('tickets', ticketsDefaults());
  const events = store.load('events', {});
  const aura = getAuraData(store);

  for (const [userId, entry] of Object.entries(aura.voice || {})) {
    if ((Number(entry.totalMs) || 0) > 0 || entry.sessionStartedAt) ids.add(userId);
  }
  for (const ticket of Object.values(tickets || {})) {
    for (const key of ['acceptedById', 'rejectedById', 'interviewById', 'deletedById']) {
      if (ticket?.[key]) ids.add(ticket[key]);
    }
  }
  for (const event of Object.values(events || {})) {
    for (const userId of Object.keys(event?.plusMessages || {})) ids.add(userId);
    for (const userId of ensureArray(event?.main)) ids.add(userId);
    for (const userId of ensureArray(event?.reserve)) ids.add(userId);
  }
  return [...ids];
}

function getLastActivityMs(store, userId) {
  const aura = getAuraData(store);
  const tickets = store.load('tickets', ticketsDefaults());
  const events = store.load('events', {});
  const times = [];

  const voiceEntry = aura.voice?.[userId];
  if (voiceEntry?.sessionStartedAt) times.push(Date.now());
  for (const day of Object.keys(voiceEntry?.daily || {})) {
    const dayEnd = new Date(`${day}T23:59:59.999Z`).getTime();
    if (Number.isFinite(dayEnd)) times.push(dayEnd);
  }

  for (const ticket of Object.values(tickets || {})) {
    if (ticket?.acceptedById === userId) times.push(new Date(ticket.acceptedAt).getTime());
    if (ticket?.rejectedById === userId) times.push(new Date(ticket.rejectedAt).getTime());
    if (ticket?.interviewById === userId) times.push(new Date(ticket.interviewAt).getTime());
  }

  for (const event of Object.values(events || {})) {
    const messageId = event?.plusMessages?.[userId];
    if (messageId) {
      const time = snowflakeTimestampMs(messageId);
      if (time) times.push(time);
    }
  }

  return times.filter(Number.isFinite).sort((a, b) => b - a)[0] || null;
}

function activityStatusText(lastActivityMs) {
  if (!lastActivityMs) {
    return '⚫ Нет данных';
  }

  const ageMs = Date.now() - lastActivityMs;
  if (ageMs < 3 * 24 * 60 * 60 * 1000) return '🟢 Активный';
  if (ageMs < INACTIVE_AFTER_MS) return '🟡 Тихий';
  return '🔴 Неактив';
}

function buildAuraAchievements({ voiceHours, ticketStats, plusStats, rank, auraPoints }) {
  const achievements = [];
  if (voiceHours >= 100) achievements.push('🎧 **Voice Addict** - 100+ часов в войсе');
  if (voiceHours >= 250) achievements.push('🔊 **Discord Resident** - 250+ часов в войсе');
  if (ticketStats.accepted >= 25) achievements.push('📨 **Recruit Machine** - 25+ принятых заявок');
  if (ticketStats.reviewed >= 50) achievements.push('🧾 **Paper Slayer** - 50+ рассмотренных заявок');
  if (plusStats.capt >= 50) achievements.push('⚔️ **CAPT Enjoyer** - 50+ плюсов на CAPT');
  if (plusStats.mcl >= 50) achievements.push('🏆 **MCL Veteran** - 50+ плюсов на MCL');
  if (auraPoints >= 2500) achievements.push('✨ **Aura Farmer** - 2500+ AURA');
  if (rank.name === 'Radiant') achievements.push('🌟 **Radiant Energy** - добрался до Radiant');
  return achievements.slice(0, 8);
}

function getAuraRank(points, auraRanks) {
  const ranks = auraRanks || DEFAULT_AURA_RANKS;
  let current = ranks[0];
  for (const rank of ranks) {
    if (points >= rank.min) {
      current = rank;
    }
  }

  const next = ranks.find((rank) => rank.min > points) || null;
  return { current, next };
}

function getAuraRankByValue(value, auraRanks) {
  const ranks = auraRanks || DEFAULT_AURA_RANKS;
  const normalized = String(value || '').toLowerCase();
  return ranks.find((rank) => rank.name.toLowerCase() === normalized) || null;
}

function getManualAuraRank(store, userId, auraRanks) {
  const data = getAuraData(store);
  const override = data.rankOverrides?.[userId];
  const rank = getAuraRankByValue(override?.rank, auraRanks);
  return rank ? { ...override, rank: rank.name, rankMeta: rank } : null;
}

function setManualAuraRank(store, userId, rankValue, updatedById, auraRanks) {
  const data = getAuraData(store);
  data.rankOverrides = data.rankOverrides || {};

  if (rankValue === 'auto') {
    delete data.rankOverrides[userId];
    store.save('aura', data);
    return null;
  }

  const rank = getAuraRankByValue(rankValue, auraRanks);
  if (!rank) {
    return null;
  }

  data.rankOverrides[userId] = {
    rank: rank.name,
    updatedById,
    updatedAt: new Date().toISOString()
  };
  store.save('aura', data);
  return rank;
}

function formatHours(ms) {
  const hours = ms / (60 * 60 * 1000);
  return hours >= 10 ? String(Math.floor(hours)) : hours.toFixed(1);
}

function buildAuraProgress(points, nextRank, auraRanks) {
  if (!nextRank) {
    return 'MAX RANK';
  }

  const ranks = auraRanks || DEFAULT_AURA_RANKS;
  const previousRank = [...ranks].reverse().find((rank) => rank.min <= points) || ranks[0];
  const span = Math.max(1, nextRank.min - previousRank.min);
  const progress = Math.max(0, Math.min(1, (points - previousRank.min) / span));
  const filled = Math.round(progress * 10);
  return `[${'#'.repeat(filled)}${'-'.repeat(10 - filled)}] ${Math.floor(progress * 100)}% до ${nextRank.name}`;
}

function buildAuraProfile(interaction, config, store, targetUser = interaction.user, targetMember = interaction.member) {
  const member = targetMember;
  const userId = targetUser.id;
  const { voiceMs, ticketStats, plusStats, auraPoints } = buildAuraSnapshot(store, userId);
  const voiceHours = voiceMs / (60 * 60 * 1000);
  const pointsRank = getAuraRank(auraPoints, config.auraRanks);
  const manualRank = getManualAuraRank(store, userId, config.auraRanks);
  const rank = manualRank?.rankMeta || pointsRank.current;
  const isRecruiter = member?.roles?.cache?.has?.(config.roles?.ticketAccess?.[0]);
  const lastActivityMs = getLastActivityMs(store, userId);

  const embed = createEmbed(config, {
    title: `${rank.emoji} AURA Profile: ${member?.displayName || targetUser.username}`,
    color: config.theme.accent,
    description: [
      `**Rank:** ${rank.emoji} **${rank.name}**`,
      manualRank ? `**Выдан вручную:** ${memberTag(manualRank.updatedById)}` : null,
      manualRank ? `**По очкам:** ${pointsRank.current.emoji} **${pointsRank.current.name}**` : null,
      `**Статус:** ${activityStatusText(lastActivityMs)}`,
      `**AURA:** \`${auraPoints}\``,
      `\`${buildAuraProgress(auraPoints, pointsRank.next, config.auraRanks)}\``
    ].filter(Boolean).join('\n'),
    timestamp: true
  });

  embed.setThumbnail(targetUser.displayAvatarURL({ size: 256 }));
  embed.addFields(
    {
      name: 'Voice',
      value: [
        `Часов в войсе: **${formatHours(voiceMs)}**`,
        `AURA: **${Math.floor(voiceHours * AURA_POINTS.voiceHour)}**`
      ].join('\n'),
      inline: true
    },
    {
      name: 'Tickets',
      value: [
        `Рассмотрел: **${ticketStats.reviewed}**`,
        `Принял: **${ticketStats.accepted}**`
      ].join('\n'),
      inline: true
    },
    {
      name: 'Events',
      value: [
        `CAPT плюсы: **${plusStats.capt}**`,
        `MCL плюсы: **${plusStats.mcl}**`
      ].join('\n'),
      inline: true
    }
  );

  if (isRecruiter) {
    embed.addFields({
      name: 'Invites - рекруты',
      value: [
        `Рассмотрел заявок: **${ticketStats.reviewed}**`,
        `Принял в семью: **${ticketStats.accepted}**`,
        `Отклонил заявок: **${ticketStats.rejected}**`,
        `Вызвал на обзвон: **${ticketStats.interviews}**`
      ].join('\n'),
      inline: false
    });
  }

  const achievements = buildAuraAchievements({ voiceHours, ticketStats, plusStats, rank: pointsRank.current, auraPoints });
  embed.addFields({
    name: 'Ачивки',
    value: achievements.length ? achievements.join('\n') : 'Пока пусто, но потенциал чувствуется.',
    inline: false
  });

  return embed;
}

function buildRecruiterStatsProfile(interaction, config, store, targetUser = interaction.user, targetMember = interaction.member) {
  const tickets = store.load('tickets', ticketsDefaults());
  const stats = collectTicketAuraStats(tickets, targetUser.id);
  const member = targetMember;

  const embed = createEmbed(config, {
    title: `Invites: ${member?.displayName || targetUser.username}`,
    color: config.theme.accent,
    description: [
      `**Рекрут:** ${memberTag(targetUser.id)}`,
      '',
      `**Рассмотрел заявок:** ${stats.reviewed}`,
      `**Принял в семью:** ${stats.accepted}`,
      `**Отклонил заявок:** ${stats.rejected}`,
      `**Вызвал на обзвон:** ${stats.interviews}`
    ].join('\n'),
    timestamp: true
  });

  embed.setThumbnail(targetUser.displayAvatarURL({ size: 256 }));
  return embed;
}

function buildTopEmbed(config, store, category = 'aura') {
  const ids = collectAuraUserIds(store);
  const rows = ids.map((userId) => {
    const snapshot = buildAuraSnapshot(store, userId);
    const voiceHours = snapshot.voiceMs / (60 * 60 * 1000);
    const recruiterStats = snapshot.ticketStats;
    const values = {
      aura: snapshot.auraPoints,
      voice: voiceHours,
      capt: snapshot.plusStats.capt,
      mcl: snapshot.plusStats.mcl,
      recruiters: recruiterStats.accepted
    };
    return { userId, snapshot, value: values[category] ?? snapshot.auraPoints };
  }).filter((row) => row.value > 0);

  rows.sort((a, b) => b.value - a.value);
  const labels = {
    aura: 'AURA',
    voice: 'Voice',
    capt: 'CAPT плюсы',
    mcl: 'MCL плюсы',
    recruiters: 'Принятые заявки'
  };

  const description = rows.slice(0, 10).map((row, index) => {
    const value = category === 'voice' ? `${formatHours(row.snapshot.voiceMs)} ч.` : Math.floor(row.value);
    const rank = getManualAuraRank(store, row.userId, config.auraRanks)?.rankMeta || getAuraRank(row.snapshot.auraPoints, config.auraRanks).current;
    return `**${index + 1}.** ${rank.emoji} ${memberTag(row.userId)} - **${value}**`;
  }).join('\n') || 'Пока нет данных для топа.';

  return createEmbed(config, {
    title: `🏅 TOP: ${labels[category] || 'AURA'}`,
    description,
    timestamp: true
  });
}

function buildWeeklyEmbed(config, store) {
  const sinceMs = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const ids = collectAuraUserIds(store);
  const rows = ids.map((userId) => ({
    userId,
    snapshot: buildAuraSnapshot(store, userId, sinceMs)
  })).filter((row) => row.snapshot.auraPoints > 0);

  rows.sort((a, b) => b.snapshot.auraPoints - a.snapshot.auraPoints);
  const topText = rows.slice(0, 10).map((row, index) => (
    `**${index + 1}.** ${memberTag(row.userId)} - **${row.snapshot.auraPoints} AURA**`
  )).join('\n') || 'За неделю пока нет активности.';

  const totals = rows.reduce((acc, row) => {
    acc.voiceMs += row.snapshot.voiceMs;
    acc.reviewed += row.snapshot.ticketStats.reviewed;
    acc.accepted += row.snapshot.ticketStats.accepted;
    acc.rejected += row.snapshot.ticketStats.rejected;
    acc.capt += row.snapshot.plusStats.capt;
    acc.mcl += row.snapshot.plusStats.mcl;
    return acc;
  }, { voiceMs: 0, reviewed: 0, accepted: 0, rejected: 0, capt: 0, mcl: 0 });

  const embed = createEmbed(config, {
    title: '📅 Weekly Report',
    description: topText,
    timestamp: true
  });
  embed.addFields({
    name: 'Итоги за 7 дней',
    value: [
      `Войс: **${formatHours(totals.voiceMs)} ч.**`,
      `Заявки рассмотрены: **${totals.reviewed}**`,
      `Приняты: **${totals.accepted}**`,
      `Отклонены: **${totals.rejected}**`,
      `CAPT плюсы: **${totals.capt}**`,
      `MCL плюсы: **${totals.mcl}**`
    ].join('\n'),
    inline: false
  });
  return embed;
}

async function buildFamilyStatsEmbed(guild, config, store) {
  await guild.members.fetch().catch(() => null);
  const profiles = store.load('profiles', {});
  const tickets = store.load('tickets', ticketsDefaults());
  const afk = store.load('afk', {});
  const leaves = store.load('leaves', {});
  const memberCount = guild.memberCount || guild.members.cache.size;
  const heavyweightCount = config.roles.heavyweight ? guild.members.cache.filter((m) => m.roles.cache.has(config.roles.heavyweight)).size : 0;
  const testCount = config.roles.test ? guild.members.cache.filter((m) => m.roles.cache.has(config.roles.test)).size : 0;
  const recruitCount = guild.members.cache.filter((m) => hasAnyRole(m, ensureArray(config.roles?.ticketAccess))).size;
  const acceptedTickets = Object.values(tickets).filter((ticket) => ticket.status === 'accepted').length;
  const rejectedTickets = Object.values(tickets).filter((ticket) => ticket.status === 'rejected').length;
  const openTickets = Object.values(tickets).filter((ticket) => ['open', 'interview'].includes(ticket.status)).length;

  const embed = createEmbed(config, {
    title: '🏠 Family Stats',
    description: [
      `Участников на сервере: **${memberCount}**`,
      `Личных профилей: **${Object.keys(profiles).length}**`,
      `AFK сейчас: **${Object.keys(afk).length}**`,
      `В отпуске: **${Object.keys(leaves).length}**`
    ].join('\n'),
    timestamp: true
  });

  embed.addFields(
    {
      name: 'Роли',
      value: [
        `HEAVYWEIGHT: **${heavyweightCount}**`,
        `TEST: **${testCount}**`,
        `Рекруты: **${recruitCount}**`
      ].join('\n'),
      inline: true
    },
    {
      name: 'Заявки',
      value: [
        `Открытые/обзвон: **${openTickets}**`,
        `Принятые: **${acceptedTickets}**`,
        `Отклоненные: **${rejectedTickets}**`
      ].join('\n'),
      inline: true
    }
  );
  return embed;
}

async function buildInactiveListEmbed(guild, config, store) {
  await guild.members.fetch().catch(() => null);
  const trackedIds = new Set(collectAuraUserIds(store));
  for (const member of guild.members.cache.values()) {
    if (member.user.bot) continue;
    if (hasAnyRole(member, [config.roles.heavyweight, config.roles.test, ...ensureArray(config.roles.ticketAccess)])) {
      trackedIds.add(member.id);
    }
  }

  const rows = [...trackedIds].map((userId) => ({
    userId,
    lastActivityMs: getLastActivityMs(store, userId)
  })).filter((row) => !row.lastActivityMs || Date.now() - row.lastActivityMs >= INACTIVE_AFTER_MS);

  rows.sort((a, b) => (a.lastActivityMs || 0) - (b.lastActivityMs || 0));
  const description = rows.slice(0, 25).map((row, index) => {
    const last = row.lastActivityMs ? formatDate(new Date(row.lastActivityMs)) : 'нет данных';
    return `**${index + 1}.** ${memberTag(row.userId)} - ${last}`;
  }).join('\n') || 'Неактивных по данным бота нет.';

  return createEmbed(config, {
    title: '🔴 Inactive List',
    description,
    footer: 'Неактив = нет войса, плюсов и действий по заявкам 14+ дней',
    timestamp: true
  });
}

async function ensureProtectedMember(member, source = 'auto-check') {
  if (!member) {
    return;
  }

  const config = configRef.value;
  const ownerId = config.ownerId;
  const ownerRoleId = config.ownerRoleId;

  if (ownerId && member.id !== ownerId) {
    return;
  }

  const actions = [];
  if (member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now()) {
    await member.timeout(null, `Auto-remove timeout (${source})`);
    actions.push('timeout removed');
  }

  if (ownerRoleId && member.guild.roles.cache.has(ownerRoleId) && !member.roles.cache.has(ownerRoleId)) {
    await member.roles.add(ownerRoleId, `Auto-add owner role (${source})`);
    actions.push(`role ${ownerRoleId} added`);
  }

  if (actions.length) {
    console.log(`Protected member ${member.id}: ${actions.join(', ')}.`);
  }
}

async function ensureProtectedMemberOnStartup(client, config) {
  const guild = await client.guilds.fetch(config.guildId).catch(() => null);
  if (!guild) {
    console.warn(`Protected member check skipped: guild ${config.guildId} not found.`);
    return;
  }

  const ownerId = config.ownerId;
  if (!ownerId) {
    return;
  }

  const member = await guild.members.fetch(ownerId).catch(() => null);
  if (!member) {
    console.warn(`Protected member check skipped: member ${ownerId} not found.`);
    return;
  }

  await ensureProtectedMember(member, 'startup');
}

function profileErrorMessage(error) {
  if (error?.code === 50013) {
    return 'Не хватает прав бота для создания/изменения личного профиля. Проверьте Manage Channels и права в категории профилей.';
  }
  if (error?.code === 50001) {
    return 'У бота нет доступа к категории или каналу личных профилей.';
  }
  if (error?.code === 10003) {
    return 'Категория или канал профиля не найден. Проверьте categories.profiles в config.json.';
  }
  return `Личный профиль не сработал: ${error?.message || 'неизвестная ошибка'}.`;
}

function resolveEmoji(value) {
  if (!value || typeof value !== 'string') {
    return undefined;
  }

  const customEmoji = value.match(/^<a?:([^:]+):(\d+)>$/);
  if (customEmoji) {
    return { name: customEmoji[1], id: customEmoji[2] };
  }

  return value;
}

function emojiText(config, key, fallback = '') {
  return config.emojis[key] || fallback;
}

function buttonEmoji(config, key, fallback = '') {
  return resolveEmoji(config.emojis[key] || fallback);
}

function withEmojiLabel(text, emoji) {
  return emoji ? `${emoji} ${text}` : text;
}

function imageFor(config, key) {
  return config.images[key] || config.images.globalPanel || BANNER_URL || null;
}

function thumbnailFor(config, key) {
  return config.images[`${key}Thumbnail`] || config.images.panelThumbnail || (fs.existsSync(LOGO_FILE_PATH) ? LOGO_URL : null);
}

function applyPanelMedia(config, embed, imageKey, thumbnailKey = imageKey) {
  applyOptionalImage(embed, imageFor(config, imageKey));
  const thumbnailUrl = thumbnailFor(config, thumbnailKey);
  if (thumbnailUrl) {
    embed.setThumbnail(thumbnailUrl);
  }
  return embed;
}

function panelMessagePayload(config, embed, components = []) {
  const payload = { embeds: [embed], components };
  const thumbnailUrl = embed?.data?.thumbnail?.url;
  if (thumbnailUrl === LOGO_URL && fs.existsSync(LOGO_FILE_PATH)) {
    payload.files = [{ attachment: LOGO_FILE_PATH, name: LOGO_FILE_NAME }];
  }
  return payload;
}

function familyApplyV2Payload(config) {
  const container = new ContainerBuilder()
    .setAccentColor(PANEL_STRIPE_COLOR)
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder()
          .setURL(imageFor(config, 'ticketPanel'))
          .setDescription('HEAVYWEIGHT banner')
      )
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent([
            `# ${emojiText(config, 'hwt_apply', '✦')} HEAVYWEIGHT × ЗАЯВКИ В СЕМЬЮ`,
            '',
            'Добро пожаловать в семейный Discord сервер **HEAVYWEIGHT**.',
            '',
            `Заявки принимаются только на сервере **${config.ticket.serverName}**.`,
            'Заполните форму подробно и корректно — ответ придёт в личные сообщения.'
          ].join('\n'))
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder()
            .setURL(fs.existsSync(LOGO_FILE_PATH) ? LOGO_URL : thumbnailFor(config, 'panel'))
            .setDescription('HEAVYWEIGHT logo')
        )
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `### ${emojiText(config, 'hwt_info', emojiText(config, 'hwt_link', 'ℹ️'))} РАССМОТРЕНИЕ ЗАЯВКИ`,
        '',
        '• Среднее время рассмотрения — менее **5 часов**',
        '• Если не хватает навыков или откатов, заявка может быть отклонена',
        `• На роль ${roleTag(config.roles?.test || "")} принимаем **без откатов**`,
        '• Перед отправкой проверьте, что личные сообщения открыты'
      ].join('\n'))
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `### ${emojiText(config, 'hwt_gg', emojiText(config, 'hwt_replay', '📌'))} GG / GUNGAME`,
        '',
        '• Откат не старше **1 недели**',
        '• Продолжительность от **5 минут**',
        '• Без музыки и нарезок'
      ].join('\n')),
      new TextDisplayBuilder().setContent([
        `### ${emojiText(config, 'hwt_mcl', emojiText(config, 'hwt_security', '⚔️'))} COMPETITIVE`,
        '',
        '• **B33 / MCL / CAPT**',
        '• Откат не старше **60 дней**',
        '• Укажите стак, если идёте составом'
      ].join('\n'))
    )
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
        .setSpacing(SeparatorSpacingSize.Large)
    )
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent([
        `### ${emojiText(config, 'hwt_accept', emojiText(config, 'hwt_check', '✅'))} МИНИМАЛЬНЫЕ УСЛОВИЯ`,
        '',
        'Возраст от **16 лет** и наличие актуальных откатов с **CAPT / MCL / GG**.',
        '',
        '-# HEAVYWEIGHT • Заявки и отбор'
      ].join('\n'))
    )
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('apply_family')
          .setLabel('✦ Подать заявку')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(buttonEmoji(config, 'hwt_apply', '✦'))
      )
    );

  const payload = {
    components: [container],
    flags: MessageFlags.IsComponentsV2
  };

  if (fs.existsSync(LOGO_FILE_PATH)) {
    payload.files = [{ attachment: LOGO_FILE_PATH, name: LOGO_FILE_NAME }];
  }

  return payload;
}

function textDisplay(content) {
  return new TextDisplayBuilder().setContent(limitEmbedText(content, 4000, '-') || '-');
}

function componentsV2PayloadFromEmbed(config, embed, components = [], options = {}) {
  const data = embed.data || {};
  const container = new ContainerBuilder()
    .setAccentColor(data.color ?? PANEL_STRIPE_COLOR);

  const imageUrl = data.image?.url || (options.includeDefaultImage === false ? null : imageFor(config, 'globalPanel'));
  if (imageUrl) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(imageUrl)
      )
    );
  }

  if (options.intro) {
    container.addTextDisplayComponents(textDisplay(options.intro));
    container.addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small));
  }

  const header = [
    data.title ? `# ${data.title}` : null,
    data.description || null
  ].filter(Boolean).join('\n\n');

  const thumbnailUrl = data.thumbnail?.url || thumbnailFor(config, 'panel');
  if (thumbnailUrl) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(textDisplay(header || ' '))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailUrl))
    );
  } else if (header) {
    container.addTextDisplayComponents(textDisplay(header));
  }

  for (const field of ensureArray(data.fields)) {
    container
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
      .addTextDisplayComponents(textDisplay([
        `### ${field.name}`,
        '',
        field.value
      ].join('\n')));
  }

  if (data.footer?.text) {
    container
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(textDisplay(`-# ${data.footer.text}`));
  }

  for (const row of ensureArray(components)) {
    container.addActionRowComponents(row);
  }

  const payload = {
    components: [container],
    flags: MessageFlags.IsComponentsV2 | (options.ephemeral ? MessageFlags.Ephemeral : 0)
  };
  if (options.allowedMentions) {
    payload.allowedMentions = options.allowedMentions;
  }

  const usesLocalLogo = JSON.stringify(container.toJSON()).includes(LOGO_URL);
  if (usesLocalLogo && fs.existsSync(LOGO_FILE_PATH)) {
    payload.files = [{ attachment: LOGO_FILE_PATH, name: LOGO_FILE_NAME }];
  }

  return payload;
}

function buildTicketPanelMenu(config) {
  return new ButtonBuilder()
    .setCustomId('apply_family')
    .setLabel('✦ Подать заявку')
    .setStyle(ButtonStyle.Primary)
    .setEmoji(buttonEmoji(config, 'hwt_apply', '✦'));
}

function firstUrl(values) {
  return ensureArray(values).find((value) => typeof value === 'string' && /^https?:\/\//i.test(value));
}

function linkButton(label, url, emoji = null) {
  const button = new ButtonBuilder()
    .setLabel(label)
    .setStyle(ButtonStyle.Link)
    .setURL(url);
  return maybeSetButtonEmoji(button, emoji);
}

function buildPrimaryLinkRow(config, extraButtons = []) {
  const buttons = [
    linkButton('Регистрация', 'https://majestic-rp.ru/register?utm_campaign=YDARNIK', config.emojis.hwt_register || '👥'),
    linkButton('Telegram', firstUrl(config.socials?.telegram) || '', config.emojis.hwt_telegram || config.emojis.tg || '✈️'),
    ...extraButtons
  ].slice(0, 5);

  return new ActionRowBuilder().addComponents(...buttons);
}

function buildCheatCheckPanelPayload(config) {
  const container = new ContainerBuilder()
    .setAccentColor(PANEL_STRIPE_COLOR)
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder()
          .setURL(imageFor(config, 'cheatCheckPanel'))
          .setDescription('Проверка на запрещенное ПО')
      )
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(textDisplay([
          '# ПРОВЕРКА НА ЗАПРЕЩЕННОЕ ПО',
          '',
          'Если вас попросили пройти проверку, нажмите кнопку ниже и заполните короткую форму.',
          '',
          `Запрос увидит роль ${mentionRoles(getCheatHunterRoleIds(config)) || ""}.`
        ].join('\n')))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailFor(config, 'cheatCheck') || attachmentLogoUrl()))
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(textDisplay([
      `### ${emojiText(config, 'hwt_security', '🛡️')} КАК ЭТО РАБОТАЕТ`,
      '',
      '• Нажмите `Запросить проверку`.',
      '• Укажите ник / статик и комментарий.',
      '• Cheat Hunter получит уведомление в отдельном канале.',
      '• После чистой проверки вам выдадут роль проверенного.'
    ].join('\n')))
    .addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('cheatcheck:request')
          .setLabel('Запросить проверку')
          .setStyle(ButtonStyle.Primary)
          .setEmoji(buttonEmoji(config, 'hwt_security', '🛡️'))
      )
    );

  const payload = { components: [container], flags: MessageFlags.IsComponentsV2 };
  if (fs.existsSync(LOGO_FILE_PATH)) {
    payload.files = [{ attachment: LOGO_FILE_PATH, name: LOGO_FILE_NAME }];
  }
  return payload;
}

function buildCheatCheckNotificationPayload(config, values, requesterId, state = {}) {
  const approvedById = state.approvedById || null;
  const rejectedById = state.rejectedById || null;
  const claimedById = state.claimedById || null;
  const history = ensureArray(state.history).slice(-6);
  const status = rejectedById
    ? 'rejected'
    : approvedById
      ? 'clean'
      : claimedById
        ? 'claimed'
        : 'pending';
  const statusText = {
    rejected: `${emojiText(config, 'hwt_error', emojiText(config, 'hwt_reject', emojiText(config, 'hwt_warn', '❌')))} Проверка отклонена: ${memberTag(rejectedById)}`,
    clean: `${emojiText(config, 'hwt_success', emojiText(config, 'hwt_clean', '✅'))} Проверка отмечена как чистая: ${memberTag(approvedById)}`,
    claimed: `${emojiText(config, 'hwt_staff', emojiText(config, 'hwt_pending', '⏳'))} Проверку взял: ${memberTag(claimedById)}`,
    pending: `${emojiText(config, 'hwt_pending', emojiText(config, 'hwt_progress', emojiText(config, 'hwt_warn', '⏳')))} Ожидает проверки`
  }[status];
  const hunterRoleIds = getCheatHunterRoleIds(config);

  const container = new ContainerBuilder()
    .setAccentColor(rejectedById ? config.theme.danger : approvedById ? 0x57F287 : claimedById ? config.theme.accent : PANEL_STRIPE_COLOR)
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(textDisplay([
          `# ЗАПРОС НА ПРОВЕРКУ`,
          '',
          `${mentionRoles(hunterRoleIds) || ""} новый запрос от ${memberTag(requesterId)}.`,
          '',
          statusText
        ].join('\n')))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailFor(config, 'cheatCheck') || attachmentLogoUrl()))
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Large))
    .addTextDisplayComponents(textDisplay([
      `### ${emojiText(config, 'hwt_media', '📋')} ДАННЫЕ`,
      '',
      `• Игрок: ${memberTag(requesterId)}`,
      values.nickname ? `• Ник / статик: **${values.nickname}**` : '• Ник / статик: не указан',
      values.reason ? `• Комментарий: ${values.reason}` : '• Комментарий: не указан'
    ].join('\n')));

  if (history.length) {
    container
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small))
      .addTextDisplayComponents(textDisplay([
        `### ${emojiText(config, 'hwt_clock', '')} ИСТОРИЯ`.trim(),
        '',
        ...history.map((entry) => `• <t:${Math.floor(new Date(entry.at).getTime() / 1000)}:f> — ${entry.text}`)
      ].join('\n')));
  }

  if (!approvedById && !rejectedById) {
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`cheatcheck:claim:${requesterId}`)
          .setLabel(claimedById ? 'Уже взято' : 'Взять проверку')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(buttonEmoji(config, 'hwt_staff', '👤'))
          .setDisabled(Boolean(claimedById)),
        new ButtonBuilder()
          .setCustomId(`cheatcheck:clean:${requesterId}`)
          .setLabel('Чистый')
          .setStyle(ButtonStyle.Success)
          .setEmoji(buttonEmoji(config, 'hwt_success', config.emojis.hwt_clean || '✅')),
        new ButtonBuilder()
          .setCustomId(`cheatcheck:reject:${requesterId}`)
          .setLabel('Отклонить')
          .setStyle(ButtonStyle.Danger)
          .setEmoji(buttonEmoji(config, 'hwt_error', config.emojis.hwt_reject || '❌'))
      )
    );
  }

  const payload = {
    components: [container],
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: {
      roles: hunterRoleIds,
      users: [requesterId]
    }
  };
  if (fs.existsSync(LOGO_FILE_PATH)) {
    payload.files = [{ attachment: LOGO_FILE_PATH, name: LOGO_FILE_NAME }];
  }
  return payload;
}

function buildSocialLinkComponents(config) {
  return [buildPrimaryLinkRow(config)];
}

function formatLinkList(links, emptyText = '• Пока пусто') {
  const items = ensureArray(links).filter(Boolean);
  return items.length ? items.map((link) => `• ${link}`).join('\n') : emptyText;
}

function maybeSetButtonEmoji(button, emoji) {
  const resolved = resolveEmoji(emoji);
  if (resolved) {
    button.setEmoji(resolved);
  }
  return button;
}

function formatRoleList(guild, roleIds) {
  const ids = ensureArray(roleIds).filter(Boolean);
  if (!ids.length) {
    return 'нет';
  }

  return ids
    .map((roleId) => (guild.roles.cache.has(roleId) ? roleTag(roleId) : `роль ${roleId}`))
    .join(', ');
}

function emojiMatches(reactionEmoji, configuredEmoji) {
  const parsed = resolveEmoji(configuredEmoji);
  if (!parsed) {
    return false;
  }

  if (typeof parsed === 'string') {
    return reactionEmoji.name === parsed;
  }

  return reactionEmoji.id === parsed.id;
}

function buildLinksDescription(config) {
  const sections = [
    [emojiText(config, 'discord', '•'), 'Discord', config.socials.discord],
    [emojiText(config, 'tg', '•'), 'Telegram', config.socials.telegram],
    [emojiText(config, 'youtube', '•'), 'YouTube', config.socials.youtube],
    [emojiText(config, 'twitch', '•'), 'Twitch', config.socials.twitch],
    [emojiText(config, 'tiktok', '•'), 'TikTok', config.socials.tiktok]
  ];

  return sections
    .map(([icon, label, links]) => {
      const items = ensureArray(links);
      const body = items.length ? items.map((link) => `• ${link}`).join('\n') : '• Пока пусто';
      return `${icon} **${label}:**\n${body}`;
    })
    .join('\n\n');
}

function chunkLinesByLength(lines, maxLength = 1000) {
  const chunks = [];
  let current = [];
  let currentLength = 0;

  for (const rawLine of lines) {
    const line = String(rawLine || '').slice(0, maxLength);
    const nextLength = currentLength + line.length + (current.length ? 1 : 0);

    if (current.length && nextLength > maxLength) {
      chunks.push(current);
      current = [line];
      currentLength = line.length;
    } else {
      current.push(line);
      currentLength = nextLength;
    }
  }

  if (current.length) {
    chunks.push(current);
  }

  return chunks;
}

function buildLinksFields(config) {
  const baseFields = [
    {
      name: `${emojiText(config, 'hwt_link', '🌐')} ОФИЦИАЛЬНЫЕ ССЫЛКИ`,
      value: [
        `• ${emojiText(config, 'hwt_telegram', '✈️')} [Telegram-канал](${firstUrl(config.socials?.telegram) || ''})`,
        `• ${emojiText(config, 'hwt_youtube', '▶️')} [YouTube канал](${firstUrl(config.socials?.youtube) || ''})`
      ].join('\n'),
      inline: true
    },
    {
      name: `${emojiText(config, 'hwt_logo', '🔗')} ПРОМОКОДЫ СЕМЬИ`,
      value: [
        '• `/PROMO YDARNIK`'
      ].join('\n'),
      inline: true
    }
  ];

  const mediaSections = [
    [`${emojiText(config, 'discord', '💬')} DISCORD`, config.socials.discord],
    [`${emojiText(config, 'hwt_telegram', '📣')} TELEGRAM`, config.socials.telegram],
    [`${emojiText(config, 'hwt_youtube', '▶️')} YOUTUBE`, config.socials.youtube],
    [`${emojiText(config, 'hwt_twitch', '🟣')} TWITCH`, config.socials.twitch],
    [`${emojiText(config, 'hwt_tiktok', '🎵')} TIKTOK`, config.socials.tiktok]
  ];

  for (const [name, links] of mediaSections) {
    const chunks = chunkLinesByLength(formatLinkList(links).split('\n'), 1000);
    chunks.forEach((chunk, index) => {
      baseFields.push({
        name: `${name}${chunks.length > 1 ? ` ${index + 1}/${chunks.length}` : ''}`,
        value: chunk.join('\n'),
        inline: false
      });
    });
  }

  return baseFields;
}

function parseAfkUntil(rawValue, now = new Date()) {
  const text = String(rawValue || '').trim().toLowerCase();
  if (!text) {
    return null;
  }

  const relativeMatch = text.match(/^(\d{1,3})\s*(м|мин|минут|h|ч|час|часа|часов|d|д|дн|день|дня|дней)$/i);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2];
    const multiplier = /^(м|мин|минут)$/i.test(unit)
      ? 60 * 1000
      : /^(d|д|дн|день|дня|дней)$/i.test(unit)
        ? 24 * 60 * 60 * 1000
        : 60 * 60 * 1000;
    return new Date(now.getTime() + amount * multiplier);
  }

  const timeMatch = text.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    if (hours > 23 || minutes > 59) return null;
    const target = new Date(now);
    target.setHours(hours, minutes, 0, 0);
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target;
  }

  const dateTimeMatch = text.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?\s+(\d{1,2}):(\d{2})$/);
  if (dateTimeMatch) {
    const day = Number(dateTimeMatch[1]);
    const month = Number(dateTimeMatch[2]) - 1;
    const yearRaw = dateTimeMatch[3] ? Number(dateTimeMatch[3]) : now.getFullYear();
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    const hours = Number(dateTimeMatch[4]);
    const minutes = Number(dateTimeMatch[5]);
    if (month < 0 || month > 11 || hours > 23 || minutes > 59) return null;
    const target = new Date(year, month, day, hours, minutes, 0, 0);
    if (
      target.getFullYear() !== year ||
      target.getMonth() !== month ||
      target.getDate() !== day ||
      target.getTime() <= now.getTime()
    ) {
      return null;
    }
    return target;
  }

  return null;
}

function buildAfkList(afkMap) {
  const entries = Object.values(afkMap || {});
  if (!entries.length) {
    return 'Сейчас никто не находится в AFK.';
  }

  const lines = [
    `• Всего в AFK ${entries.length} ${pluralRu(entries.length, 'человек', 'человека', 'человек')}`,
    ''
  ];

  lines.push(...entries
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((entry, index) => {
      const reason = entry.reason?.trim() || 'не указана';
      const createdAt = new Date(entry.createdAt);
      const expiresAt = entry.expiresAt ? new Date(entry.expiresAt) : null;
      const until = expiresAt && Number.isFinite(expiresAt.getTime())
        ? formatTime(expiresAt)
        : (entry.until?.trim() || 'не указано');
      const started = Number.isFinite(createdAt.getTime()) ? formatTime(createdAt) : 'не указано';
      return `**${index + 1})** ${memberTag(entry.userId)} Причина: \`${limitEmbedText(reason, 120, 'не указана')}\`\nУшел в AFK: \`${started}\` | Вернусь в: \`${until}\``;
    }));

  return lines.join('\n');
}

function buildLeaveList(leavesMap) {
  const entries = Object.values(leavesMap || {});
  if (!entries.length) {
    return 'Сейчас никто не находится в отпуске.';
  }

  return entries
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((entry, index) => {
      const until = entry.until?.trim() ? entry.until : 'не указано';
      return `${index + 1}. ${memberTag(entry.userId)} — ${entry.reason}. Ушел: ${formatDate(new Date(entry.createdAt))}, вернется: ${until}.`;
    })
    .join('\n');
}

function buildMclDescriptionV2(config, event) {
  return [
    `**Формат:** \`${event.mode}\``,
    event.serverName ? `**Сервер:** \`${event.serverName}\`` : null,
    event.dateText ? `**Дата:** \`${event.dateText}\`` : null,
    event.timeText ? `**Время:** \`${event.timeText}\`` : `**Время:** \`${event.whenText}\``
  ].filter((line) => line !== null).join('\n');
}

function buildMclAnnouncementDescription(config, event) {
  return [
    buildMclDescriptionV2(config, event),
    '',
    `**Основной состав:** ${ensureArray(event.main).length}/${event.slots}`,
    '',
    'Список участников находится в ветке сбора.'
  ].join('\n');
}

function buildCaptDescription(config, event) {
  return [
    `**Противник:** \`${event.opponent || 'не указан'}\``,
    `**Время проведения:** \`${event.whenText}\``
  ].join('\n');
}

function formatRosterList(userIds, emptyText) {
  const ids = ensureArray(userIds);
  return ids.length
    ? ids.map((userId, index) => `${index + 1}. ${memberTag(userId)}`).join('\n')
    : emptyText;
}

function formatLeaverList(event) {
  const leavers = ensureArray(event.leavers);
  if (!leavers.length) {
    return '<Пока нет действий>';
  }

  return leavers
    .slice(-25)
    .map((entry, index) => {
      const actionText = {
        'manual-add': 'добавил',
        'manual-remove': 'выписал',
        'reaction-remove': 'выписал',
        'кнопка': 'выписался кнопкой',
        '-': 'выписался',
        'удалил +': 'удалил +'
      }[entry.action] || entry.action || 'выписался';
      const actorText = entry.actorId ? `${memberTag(entry.actorId)} ` : '';
      return `${index + 1}. ${memberTag(entry.userId)} — ${actorText}${actionText}`;
    })
    .join('\n');
}

function buildEventRosterFields(config, event) {
  const fields = [
    {
      name: `${emojiText(config, 'hwt_main', emojiText(config, 'hwt_check', '✅'))} Основной состав (${ensureArray(event.main).length}/${event.slots})`,
      value: formatRosterList(event.main, '<Список пуст>'),
      inline: true
    },
    {
      name: `${emojiText(config, 'hwt_roster', emojiText(config, 'hwt_media', '📋'))} Действия (${ensureArray(event.leavers).length})`,
      value: formatLeaverList(event),
      inline: true
    },
    {
      name: `${emojiText(config, 'hwt_reserve', emojiText(config, 'hwt_voice', '🔊'))} Резерв (${ensureArray(event.reserve).length})`,
      value: formatRosterList(event.reserve, '<Резерв пуст>'),
      inline: false
    }
  ];

  return fields;
}

function applyOptionalImage(embed, imageUrl) {
  if (imageUrl) {
    embed.setImage(imageUrl);
  }
  return embed;
}

function buildPremiumPanelEmbed(config, options) {
  const embed = createEmbed(config, {
    title: options.title,
    description: options.description,
    fields: options.fields,
    footer: options.footer,
    color: PANEL_STRIPE_COLOR
  });

  applyPanelMedia(config, embed, options.imageKey || 'globalPanel', options.thumbnailKey || options.imageKey || 'panel');
  return embed;
}

function buildFamilyApplyEmbed(config) {
  return applyPanelMedia(config, new EmbedBuilder()
    .setColor(0xE5E7EB)
    .setTitle(`${emojiText(config, 'hwt_apply', '✦')} HEAVYWEIGHT × ЗАЯВКИ В СЕМЬЮ`)
    .setDescription([
      'Добро пожаловать в семейный Discord сервер **HEAVYWEIGHT**.',
      '',
      `Заявки принимаются только на сервере **${config.ticket.serverName}**.`,
      'Заполните форму подробно и корректно — ответ придёт в личные сообщения.'
    ].join('\n')), 'ticketPanel', 'ticket')
    .addFields(
      {
        name: `${emojiText(config, 'hwt_info', emojiText(config, 'hwt_link', 'ℹ️'))} РАССМОТРЕНИЕ ЗАЯВКИ`,
        value: [
          '• Среднее время рассмотрения — менее **5 часов**',
          '• Если не хватает навыков или откатов, заявка может быть отклонена',
          `• На роль ${roleTag(config.roles?.test || "")} принимаем **без откатов**`,
          '• Перед отправкой проверьте, что личные сообщения открыты'
        ].join('\n'),
        inline: false
      },
      {
        name: `${emojiText(config, 'hwt_gg', emojiText(config, 'hwt_replay', '📌'))} GG / GUNGAME`,
        value: [
          '• Откат не старше **1 недели**',
          '• Продолжительность от **5 минут**',
          '• Без музыки и нарезок'
        ].join('\n'),
        inline: true
      },
      {
        name: `${emojiText(config, 'hwt_mcl', emojiText(config, 'hwt_security', '⚔️'))} COMPETITIVE`,
        value: [
          '• **B33 / MCL / CAPT**',
          '• Откат не старше **60 дней**',
          '• Укажите стак, если идёте составом'
        ].join('\n'),
        inline: true
      },
      {
        name: `${emojiText(config, 'hwt_accept', emojiText(config, 'hwt_check', '✅'))} МИНИМАЛЬНЫЕ УСЛОВИЯ`,
        value: 'Возраст от **16 лет** и наличие актуальных откатов с **CAPT / MCL / GG**.',
        inline: false
      }
    )
    .setFooter({ text: 'HEAVYWEIGHT • Заявки и отбор' });
}

function buildPanelEmbeds(config, afkData) {
  const ticketEmbed = buildFamilyApplyEmbed(config);

  const linksEmbed = buildPremiumPanelEmbed(config, {
    title: 'HEAVYWEIGHT × ОСНОВНАЯ ИНФОРМАЦИЯ',
    description: [
      'Добро пожаловать в семейный Discord сервер **HEAVYWEIGHT**.',
      '',
      '**Здесь собрана вся важная информация:**',
      'ссылки, промокоды, логотипы, баннеры и полезные материалы.'
    ].join('\n'),
    fields: buildLinksFields(config),
    footer: 'HEAVYWEIGHT • Основная информация',
    imageKey: 'linksPanel',
    thumbnailKey: 'links'
  });

  const interactionEmbed = buildPremiumPanelEmbed(config, {
    title: 'ПАНЕЛЬ УПРАВЛЕНИЯ',
    description: [
      'Быстрые действия для профиля и отпуска.',
      '',
      'Выберите нужную кнопку ниже — бот откроет форму или выполнит действие.'
    ].join('\n'),
    fields: [
      { name: `${emojiText(config, 'hwt_afk', emojiText(config, 'hwt_warn', emojiText(config, 'weekend', '🌙')))} ОТПУСК`, value: 'Временно снять активные роли и уйти в неактив.', inline: false },
      { name: `${emojiText(config, 'hwt_profile', emojiText(config, 'hwt_register', emojiText(config, 'profile', '👤')))} МОЙ ПРОФИЛЬ`, value: 'Создать личный закрытый канал для отчетов и откатов.', inline: false }
    ],
    footer: 'Управление',
    imageKey: 'interactionPanel',
    thumbnailKey: 'interaction'
  });

  const afkEmbed = buildPremiumPanelEmbed(config, {
    title: 'AFK',
    description: null,
    fields: [
      { name: 'Люди находящиеся в АФК:', value: buildAfkList(afkData), inline: false }
    ],
    footer: 'AFK',
    imageKey: 'afkPanel',
    thumbnailKey: 'afk'
  });

  const warnEmbed = buildPremiumPanelEmbed(config, {
    title: 'WARN SYSTEM',
    description: 'Выдача и снятие предупреждений через slash-команды.',
    fields: [
      { name: `${emojiText(config, 'hwt_warn', '⚠️')} /warn-add`, value: 'Выдать предупреждение игроку.', inline: true },
      { name: `${emojiText(config, 'hwt_warn_remove', emojiText(config, 'hwt_check', '✅'))} /warn-remove`, value: 'Снять одно или несколько предупреждений.', inline: true },
      { name: `${emojiText(config, 'hwt_security', '🛡️')} AFK-ЗАЩИТА`, value: 'Если игрок находится в AFK, бот не позволит выдать ему warn.', inline: false }
    ],
    footer: 'Warn',
    imageKey: 'warnPanel',
    thumbnailKey: 'warn'
  });

  const captEmbed = buildPremiumPanelEmbed(config, {
    title: 'CAPT REGISTRATION',
    description: 'Панель для создания сборов на **Attack / Deff**.',
    fields: [
      { name: `${emojiText(config, 'hwt_capt', emojiText(config, 'hwt_apply', '🧾'))} СОЗДАТЬ СБОР`, value: '`/capt-create`', inline: true },
      { name: `${emojiText(config, 'hwt_refresh', emojiText(config, 'hwt_check', '🔄'))} ОТКРЫТЬ / ЗАКРЫТЬ`, value: '`/capt-toggle`', inline: true },
      { name: `${emojiText(config, 'hwt_roster', emojiText(config, 'hwt_register', '➕'))} КАК ЗАПИСАТЬСЯ`, value: 'После создания бот откроет ветку. Игроки пишут `+`, бот ведет основу и резерв.', inline: false }
    ],
    footer: 'CAPT',
    imageKey: 'captPanel',
    thumbnailKey: 'capt'
  });

  const mclEmbed = buildPremiumPanelEmbed(config, {
    title: 'MCL REGISTRATION',
    description: 'Панель для создания **MCL / VZZ / CW** сборов.',
    fields: [
      { name: `${emojiText(config, 'hwt_mcl', emojiText(config, 'hwt_apply', '🧾'))} СОЗДАТЬ СБОР`, value: '`/mcl-create`', inline: true },
      { name: `${emojiText(config, 'hwt_roster', emojiText(config, 'hwt_media', '📋'))} СОСТАВ`, value: 'Бот ведет основу, резерв и действия в отдельной ветке.', inline: true },
      { name: `${emojiText(config, 'hwt_tag', emojiText(config, 'hwt_voice', '🔊'))} ТЕГИ`, value: 'В ветке доступны кнопки `Тегнуть всех` и `Тех кого нет в войсе`.', inline: false }
    ],
    footer: 'MCL',
    imageKey: 'mclPanel',
    thumbnailKey: 'mcl'
  });

  const cheatCheckEmbed = buildPremiumPanelEmbed(config, {
    title: 'ПРОВЕРКА НА ЗАПРЕЩЕННОЕ ПО',
    description: 'Нажмите кнопку ниже, чтобы отправить запрос на проверку.',
    fields: [
      { name: `${emojiText(config, 'hwt_link', '📨')} КУДА УЙДЕТ ЗАПРОС`, value: `В канал <#${config.channels?.cheatCheckRequests || ''}>.`, inline: false },
      { name: `${emojiText(config, 'hwt_security', '🕵️')} КОГО ТЕГНЕТ`, value: mentionRoles(getCheatHunterRoleIds(config)) || 'cheat-hunter', inline: true },
      { name: `${emojiText(config, 'hwt_success', emojiText(config, 'hwt_clean', '✅'))} ПОСЛЕ ПРОВЕРКИ`, value: `Роль ${roleTag(getCheatVerifiedRoleId(config))} выдается кнопкой \`Чистый\` или через \`/vefigch @user\`.`, inline: false }
    ],
    footer: 'Проверка на запрещенное ПО',
    imageKey: 'cheatCheckPanel',
    thumbnailKey: 'cheatCheck'
  });

  return {
    ticket: ticketEmbed,
    links: linksEmbed,
    interaction: interactionEmbed,
    afk: afkEmbed,
    warn: warnEmbed,
    captPlus: captEmbed,
    mclPlus: mclEmbed,
    cheatCheck: cheatCheckEmbed
  };
}

function panelComponents(config) {
  const leaveButton = maybeSetButtonEmoji(
    new ButtonBuilder().setCustomId('interaction:leave').setLabel('Отпуск').setStyle(ButtonStyle.Secondary),
    config.emojis.hwt_afk || config.emojis.weekend
  );
  const profileButton = maybeSetButtonEmoji(
    new ButtonBuilder().setCustomId('interaction:profile').setLabel('Мой профиль').setStyle(ButtonStyle.Secondary),
    config.emojis.hwt_profile || config.emojis.profile
  );

  const afkStartButton = maybeSetButtonEmoji(
    new ButtonBuilder().setCustomId('afk:start').setLabel('Уйти в AFK').setStyle(ButtonStyle.Secondary),
    config.emojis.hwt_afk || config.emojis.afk
  );
  const afkEndButton = maybeSetButtonEmoji(
    new ButtonBuilder().setCustomId('afk:end').setLabel('Вернуться из AFK').setStyle(ButtonStyle.Secondary),
    config.emojis.hwt_refresh || config.emojis.hwt_check || config.emojis.done
  );
  const cheatCheckButton = maybeSetButtonEmoji(
    new ButtonBuilder().setCustomId('cheatcheck:request').setLabel('Запросить проверку').setStyle(ButtonStyle.Primary),
    config.emojis.hwt_security || config.emojis.voice || config.emojis.done
  );

  return {
    ticket: [new ActionRowBuilder().addComponents(buildTicketPanelMenu(config))],
    links: buildSocialLinkComponents(config),
    interaction: [new ActionRowBuilder().addComponents(leaveButton, profileButton)],
    afk: [new ActionRowBuilder().addComponents(afkStartButton, afkEndButton)],
    warn: [],
    captPlus: [],
    mclPlus: [],
    cheatCheck: [new ActionRowBuilder().addComponents(cheatCheckButton)]
  };
}

function buildProfileActionComponents(config) {
  const threadsButton = maybeSetButtonEmoji(
    new ButtonBuilder().setCustomId('profile:create-threads').setLabel('Создать ветки').setStyle(ButtonStyle.Secondary),
    config.emojis.hwt_ticket || config.emojis.hwt_roster || config.emojis.list || config.emojis.profile
  );
  const recreateThreadsButton = maybeSetButtonEmoji(
    new ButtonBuilder().setCustomId('profile:recreate-threads').setLabel('Пересоздать ветки').setStyle(ButtonStyle.Danger),
    config.emojis.hwt_refresh || config.emojis.no
  );

  return [new ActionRowBuilder().addComponents(threadsButton, recreateThreadsButton)];
}

function buildProfileEmbed(config, profile, userId) {
  return createEmbed(config, {
    title: `${emojiText(config, 'hwt_profile', emojiText(config, 'profile', ''))} Личный профиль`,
    description: [
      `**Владелец:** ${memberTag(userId || profile.userId)}`,
      `**Ник:** ${profile.nickname || 'не указан'}`,
      `**Статик:** ${profile.staticCode || 'не указан'}`
    ].join('\n')
  });
}

function buildProfileActionPayload(config, profile, userId, options = {}) {
  return componentsV2PayloadFromEmbed(config, buildProfileEmbed(config, profile, userId), buildProfileActionComponents(config), {
    includeDefaultImage: false,
    intro: memberTag(userId || profile.userId),
    allowedMentions: {
      users: options.ping === false ? [] : [userId || profile.userId]
    }
  });
}

async function fetchProfileThread(channel, profile, def) {
  const storedId = profile.profileThreads?.[def.key];
  if (storedId) {
    const storedThread = await channel.client.channels.fetch(storedId).catch(() => null);
    if (storedThread?.isThread?.() && storedThread.parentId === channel.id) {
      return storedThread;
    }
  }

  const names = [def.name, ...ensureArray(def.legacyNames)];
  return channel.threads?.cache?.find((thread) => names.includes(thread.name)) || null;
}

async function ensureThreadMember(thread, userId) {
  if (thread?.members?.add && userId) {
    await thread.members.add(userId).catch(() => {});
  }
}

async function ensureProfileThreads(guild, config, store, profile, options = {}) {
  const createMissing = options.createMissing !== false;
  if (!profile?.channelId) {
    return { ok: false, reason: 'profile-missing', created: [], existing: [], missing: PROFILE_THREAD_DEFS };
  }

  const channel = await guild.channels.fetch(profile.channelId).catch(() => null);
  if (!channel?.isTextBased?.() || !channel.threads) {
    return { ok: false, reason: 'channel-missing', created: [], existing: [], missing: PROFILE_THREAD_DEFS };
  }

  const profiles = store.load('profiles', {});
  const latestProfile = profiles[profile.userId] || profile;
  latestProfile.profileThreads = latestProfile.profileThreads || {};

  const created = [];
  const existing = [];
  const missing = [];

  for (const def of PROFILE_THREAD_DEFS) {
    let thread = await fetchProfileThread(channel, latestProfile, def);
    if (!thread && createMissing) {
      const starterMessage = await channel.send({ content: `**${def.title || def.name}**` }).catch(() => null);
      thread = starterMessage
        ? await starterMessage.startThread({
        name: def.name,
        autoArchiveDuration: 1440,
        reason: 'Profile thread setup'
        }).catch(() => null)
        : await channel.threads.create({
          name: def.name,
          autoArchiveDuration: 1440,
          reason: 'Profile thread setup'
        }).catch(() => null);
      if (thread) {
        created.push(def);
      }
    } else if (thread) {
      existing.push(def);
    }

    if (thread) {
      await ensureThreadMember(thread, latestProfile.userId);
      latestProfile.profileThreads[def.key] = thread.id;
    } else {
      delete latestProfile.profileThreads[def.key];
      missing.push(def);
    }
  }

  profiles[latestProfile.userId] = latestProfile;
  store.save('profiles', profiles);

  return { ok: missing.length === 0, channelId: channel.id, profile: latestProfile, created, existing, missing };
}

async function cleanupProfileThreadStarterMessages(channel) {
  const titleContents = new Set(PROFILE_THREAD_DEFS.map((def) => `**${def.title || def.name}**`));
  const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
  if (!messages) {
    return 0;
  }

  let deleted = 0;
  for (const message of messages.values()) {
    if (message.author?.id !== channel.client.user.id) continue;
    if (!titleContents.has(message.content)) continue;

    const ok = await message.delete().then(() => true).catch(() => false);
    if (ok) {
      deleted += 1;
    }
  }

  return deleted;
}

async function recreateProfileThreads(guild, config, store, profile) {
  if (!profile?.channelId) {
    return { ok: false, reason: 'profile-missing', deleted: 0, created: [], missing: PROFILE_THREAD_DEFS };
  }

  const channel = await guild.channels.fetch(profile.channelId).catch(() => null);
  if (!channel?.isTextBased?.() || !channel.threads) {
    return { ok: false, reason: 'channel-missing', deleted: 0, created: [], missing: PROFILE_THREAD_DEFS };
  }

  const profiles = store.load('profiles', {});
  const latestProfile = profiles[profile.userId] || profile;
  latestProfile.profileThreads = latestProfile.profileThreads || {};
  const deletedThreadIds = new Set();
  let deleted = 0;

  for (const def of PROFILE_THREAD_DEFS) {
    const thread = await fetchProfileThread(channel, latestProfile, def);
    if (thread && !deletedThreadIds.has(thread.id)) {
      const ok = await thread.delete('Profile threads recreated').then(() => true).catch(() => false);
      if (ok) {
        deleted += 1;
        deletedThreadIds.add(thread.id);
      }
    }
    delete latestProfile.profileThreads[def.key];
  }

  await cleanupProfileThreadStarterMessages(channel);
  profiles[latestProfile.userId] = latestProfile;
  store.save('profiles', profiles);

  const result = await ensureProfileThreads(guild, config, store, latestProfile, { createMissing: true });
  return { ...result, deleted };
}

async function resolveProfileTargetChannel(guild, config, store, profile, threadKey) {
  const result = await ensureProfileThreads(guild, config, store, profile, { createMissing: true });
  const latestProfile = result.profile || profile;
  const threadId = latestProfile?.profileThreads?.[threadKey];
  if (threadId) {
    const thread = await guild.channels.fetch(threadId).catch(() => null);
    if (thread?.isTextBased?.()) {
      return { channel: thread, threadId };
    }
  }

  const channel = latestProfile?.channelId
    ? await guild.channels.fetch(latestProfile.channelId).catch(() => null)
    : null;
  return { channel: channel?.isTextBased?.() ? channel : null, threadId: null };
}

function settingsDefaults(config) {
  const uniq = (arr) => [...new Set(ensureArray(arr).filter(Boolean))];
  return {
    profileAccessRoles: uniq([
      ...ensureArray(config.roles?.profileAccess),
      ...ensureArray(config.replays?.reviewerRoleIds)
    ]),
    panelMessages: {},
    profileActionMessages: {},
    profileCategoryIds: []
  };
}

function ticketsDefaults() {
  return {};
}

const SETUP_CHANNEL_TARGETS = {
  ticket: { label: 'Заявки в семью', configPath: ['channels', 'ticket'] },
  links: { label: 'Links', configPath: ['channels', 'links'] },
  interaction: { label: 'Interaction', configPath: ['channels', 'interaction'] },
  afk: { label: 'AFK', configPath: ['channels', 'afk'] },
  warn: { label: 'Warn', configPath: ['channels', 'warn'] },
  captPlus: { label: 'CAPT Plus', configPath: ['channels', 'captPlus'] },
  mclPlus: { label: 'MCL Plus', configPath: ['channels', 'mclPlus'] },
  cheatCheck: { label: 'Панель проверки ПО', configPath: ['channels', 'cheatCheck'] },
  cheatCheckRequests: { label: 'Уведомления проверки ПО', configPath: ['channels', 'cheatCheckRequests'] },
  replaysPanel: { label: 'Replays panel', configPath: ['replays', 'panelChannelId'] },
  replaysLog: { label: 'Replays log', configPath: ['replays', 'logChannelId'] },
  replaysReviewLog: { label: 'Replays review log', configPath: ['replays', 'reviewLogChannelId'] }
};

const SETUP_ROLE_TARGETS = {
  highrank: { label: 'High', configPath: ['roles', 'highrank'], array: true },
  recruits: { label: 'Recruit pings', configPath: ['roles', 'recruits'], array: true },
  ticketAccess: { label: 'Ticket access', configPath: ['roles', 'ticketAccess'], array: true },
  ticketDeleteAccess: { label: 'Ticket delete access', configPath: ['roles', 'ticketDeleteAccess'], array: true },
  cheathunter: { label: 'Cheat Hunter', configPath: ['roles', 'cheathunter'], array: true },
  cheatVerified: { label: 'Cheat verified', configPath: ['roles', 'cheatVerified'], array: false },
  heavyweight: { label: 'HEAVYWEIGHT', configPath: ['roles', 'heavyweight'], array: false },
  main: { label: 'MAIN', configPath: ['roles', 'main'], array: false },
  test: { label: 'TEST', configPath: ['roles', 'test'], array: false },
  penalty: { label: 'Penalty', configPath: ['roles', 'penalty'], array: false },
  replayReviewer: { label: 'Replay reviewer', configPath: ['replays', 'reviewerRoleIds'], array: true },
  profileAccess: { label: 'Profile access', configPath: ['roles', 'profileAccess'], array: true }
};

function getNestedValue(object, keys) {
  let cursor = object;
  for (const key of keys) {
    if (!cursor || typeof cursor !== 'object') return undefined;
    cursor = cursor[key];
  }
  return cursor;
}

function setNestedValue(object, keys, value) {
  let cursor = object;
  for (const key of keys.slice(0, -1)) {
    if (!cursor[key] || typeof cursor[key] !== 'object' || Array.isArray(cursor[key])) {
      cursor[key] = {};
    }
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
}

function updateRuntimeConfig(config, keys, value) {
  setNestedValue(config, keys, value);
}

function saveConfigMutation(config, mutate) {
  const filePath = configFilePath();
  const rawConfig = readJson(filePath, {});
  const result = mutate(rawConfig);
  fs.writeFileSync(filePath, `${JSON.stringify(rawConfig, null, 2)}\n`);
  return result;
}

function backupTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function createDataBackup(config) {
  const dataDir = path.join(process.cwd(), 'data');
  const backupRoot = path.join(dataDir, 'backups');
  const targetDir = path.join(backupRoot, backupTimestamp());
  fs.mkdirSync(targetDir, { recursive: true });

  const copied = [];
  for (const fileName of Object.values(DATA_FILE_NAMES)) {
    const source = path.join(dataDir, fileName);
    if (!fs.existsSync(source)) continue;
    fs.copyFileSync(source, path.join(targetDir, fileName));
    copied.push(fileName);
  }

  const dbPath = path.resolve(config.replays?.dbPath || path.join(process.cwd(), 'video.db'));
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, path.join(targetDir, path.basename(dbPath)));
    copied.push(path.basename(dbPath));
  }

  const snapshots = fs.existsSync(backupRoot)
    ? fs.readdirSync(backupRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
    : [];
  const stale = snapshots.slice(0, Math.max(0, snapshots.length - MAX_BACKUP_SNAPSHOTS));
  for (const name of stale) {
    fs.rmSync(path.join(backupRoot, name), { recursive: true, force: true });
  }

  return { dir: targetDir, copied };
}

function startAutoBackups(config) {
  const run = () => {
    try {
      const result = createDataBackup(config);
      console.log(`Backup created: ${result.dir} (${result.copied.length} files)`);
    } catch (error) {
      console.error('Failed to create data backup', error);
    }
  };

  run();
  return setInterval(run, BACKUP_INTERVAL_MS);
}

function setupTargetChoices(targets) {
  return Object.entries(targets).map(([value, def]) => ({ name: def.label, value }));
}

async function findBlockingTicketForUser(guild, tickets, userId) {
  let changed = false;

  for (const ticket of Object.values(tickets || {})) {
    if (!ticket || ticket.userId !== userId || !['open', 'interview'].includes(ticket.status)) {
      continue;
    }

    const channel = ticket.channelId
      ? await guild.channels.fetch(ticket.channelId).catch(() => null)
      : null;
    if (channel) {
      return { ticket, changed };
    }

    ticket.status = 'deleted';
    ticket.deletedAt = ticket.deletedAt || new Date().toISOString();
    ticket.deletedReason = ticket.deletedReason || 'missing-channel';
    changed = true;
  }

  return { ticket: null, changed };
}

async function upsertPanelPayload(client, config, store, key, payload, options = {}) {
  const settings = store.load('settings', settingsDefaults(config));
  const channelId = resolveChannelId(config, key);
  const channel = channelId ? await client.channels.fetch(channelId).catch(() => null) : null;
  const isComponentsV2 = Boolean(Number(payload?.flags ?? 0) & MessageFlags.IsComponentsV2);

  if (!channel || !channel.isTextBased()) {
    if (options.optional) {
      return null;
    }
    throw new Error(`Channel ${key} (${channelId || 'not set'}) is not available.`);
  }

  if (!settings.panelMessages) settings.panelMessages = {};
  const messageId = settings.panelMessages[key];
  if (messageId) {
    try {
      const message = await channel.messages.fetch(messageId);
      if (isComponentsV2 && (message.embeds?.length || message.content)) {
        await message.delete().catch(() => null);
      } else {
        await message.edit(payloadForPanelEdit(payload, message));
        return message;
      }
    } catch (error) {
      const shouldRecreate =
        error?.code === 10008 ||
        error?.message === 'Unknown Message' ||
        String(error?.message || '').includes('MESSAGE_CANNOT_USE_LEGACY_FIELDS_WITH_COMPONENTS_V2') ||
        String(error?.rawError?.message || '').includes('MESSAGE_CANNOT_USE_LEGACY_FIELDS_WITH_COMPONENTS_V2');
      if (!shouldRecreate) {
        console.warn(`Panel ${key} could not be edited, recreating.`, error.message);
      }
    }
  }

  const message = await channel.send(payload);
  settings.panelMessages[key] = message.id;
  store.save('settings', settings);
  return message;
}

async function editOrRecreatePanelPayload(client, config, store, key, message, payload) {
  const isComponentsV2 = Boolean(Number(payload?.flags ?? 0) & MessageFlags.IsComponentsV2);
  if (isComponentsV2 && (message.embeds?.length || message.content)) {
    await message.delete().catch(() => null);
    return upsertPanelPayload(client, config, store, key, payload);
  }

  try {
    await message.edit(payloadForPanelEdit(payload, message));
    return message;
  } catch (error) {
    const shouldRecreate =
      error?.code === 10008 ||
      error?.message === 'Unknown Message' ||
      String(error?.message || '').includes('MESSAGE_CANNOT_USE_LEGACY_FIELDS_WITH_COMPONENTS_V2') ||
      String(error?.rawError?.message || '').includes('MESSAGE_CANNOT_USE_LEGACY_FIELDS_WITH_COMPONENTS_V2');
    if (!shouldRecreate) {
      console.warn(`Panel ${key} could not be edited, recreating.`, error.message);
    }
    return upsertPanelPayload(client, config, store, key, payload);
  }
}

function payloadForPanelEdit(payload, message) {
  const hasLogoAttachment = [...(message.attachments?.values?.() || [])].some((attachment) => attachment.name === LOGO_FILE_NAME);
  const usesLogoFile = payload?.files?.some?.((file) => file.name === LOGO_FILE_NAME);
  if (!hasLogoAttachment || !usesLogoFile) {
    return payload;
  }

  const nextPayload = { ...payload };
  delete nextPayload.files;
  return nextPayload;
}

async function upsertPanelMessage(client, config, store, key, embed, components = [], options = {}) {
  return upsertPanelPayload(client, config, store, key, panelMessagePayload(config, embed, components), options);
}

function createCommands(config) {
  return [
    new SlashCommandBuilder().setName('deploy-panels').setDescription('Deploy or refresh all HEAVYWEIGHT panels.'),
    new SlashCommandBuilder().setName('refresh-panels').setDescription('Recreate all configured HEAVYWEIGHT panels.'),
    new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Configure bot channels and roles.')
      .addSubcommand((subcommand) =>
        subcommand
          .setName('channel')
          .setDescription('Set a channel in config.json.')
          .addStringOption((option) =>
            option
              .setName('key')
              .setDescription('Channel setting')
              .setRequired(true)
              .addChoices(...setupTargetChoices(SETUP_CHANNEL_TARGETS))
          )
          .addChannelOption((option) =>
            option
              .setName('channel')
              .setDescription('Discord channel')
              .setRequired(true)
              .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('role')
          .setDescription('Set, add, or remove a role in config.json.')
          .addStringOption((option) =>
            option
              .setName('key')
              .setDescription('Role setting')
              .setRequired(true)
              .addChoices(...setupTargetChoices(SETUP_ROLE_TARGETS))
          )
          .addRoleOption((option) => option.setName('role').setDescription('Discord role').setRequired(true))
          .addStringOption((option) =>
            option
              .setName('action')
              .setDescription('How to update this setting')
              .addChoices(
                { name: 'set', value: 'set' },
                { name: 'add', value: 'add' },
                { name: 'remove', value: 'remove' }
              )
          )
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName('show')
          .setDescription('Show current channel and role setup.')
      ),
    new SlashCommandBuilder()
      .setName('aura')
      .setDescription('Show a private AURA profile.')
      .addUserOption((option) => option.setName('user').setDescription('User profile to view')),
    new SlashCommandBuilder()
      .setName('aura-rank')
      .setDescription('Set a manual AURA rank. Only duxagg can use this.')
      .addStringOption((option) =>
        option
          .setName('rank')
          .setDescription('Rank to set, or Auto to use points again')
          .setRequired(true)
          .addChoices(
            ...DEFAULT_AURA_RANKS.map((rank) => ({ name: rank.name, value: rank.name.toLowerCase() })),
            { name: 'Auto', value: 'auto' }
          )
      )
      .addUserOption((option) => option.setName('user').setDescription('User to update. Defaults to you.')),
    new SlashCommandBuilder()
      .setName('recruiter-stats')
      .setDescription('Show private recruiter invite stats.')
      .addUserOption((option) => option.setName('user').setDescription('Recruiter profile to view')),
    new SlashCommandBuilder()
      .setName('top')
      .setDescription('Show server leaderboards.')
      .addStringOption((option) =>
        option
          .setName('category')
          .setDescription('Leaderboard category')
          .addChoices(
            { name: 'AURA', value: 'aura' },
            { name: 'Voice', value: 'voice' },
            { name: 'CAPT плюсы', value: 'capt' },
            { name: 'MCL плюсы', value: 'mcl' },
            { name: 'Рекруты', value: 'recruiters' }
          )
      ),
    new SlashCommandBuilder().setName('weekly').setDescription('Show weekly activity report.'),
    new SlashCommandBuilder().setName('family-stats').setDescription('Show family server stats.'),
    new SlashCommandBuilder().setName('inactive-list').setDescription('Show users with low activity.'),
    new SlashCommandBuilder()
      .setName('vefigch')
      .setDescription('Give the verified cheat-check role to a member.')
      .addUserOption((option) => option.setName('user').setDescription('User to verify').setRequired(true)),
    new SlashCommandBuilder()
      .setName('warn-add')
      .setDescription('Issue a warn to a member.')
      .addUserOption((option) => option.setName('user').setDescription('User to warn').setRequired(true))
      .addStringOption((option) => option.setName('reason').setDescription('Warn reason').setRequired(true)),
    new SlashCommandBuilder()
      .setName('warn-remove')
      .setDescription('Remove warns from a member.')
      .addUserOption((option) => option.setName('user').setDescription('User to update').setRequired(true))
      .addIntegerOption((option) => option.setName('count').setDescription('How many warns to remove').setRequired(true).setMinValue(1)),
    new SlashCommandBuilder()
      .setName('capt-create')
      .setDescription('Create an Attack / Deff registration post.')
      .addStringOption((option) =>
        option.setName('type').setDescription('Attack or Deff').setRequired(true).addChoices(
          { name: 'Attack', value: 'Attack' },
          { name: 'Deff', value: 'Deff' }
        )
      )
      .addStringOption((option) => option.setName('opponent').setDescription('Enemy name').setRequired(true))
      .addStringOption((option) => option.setName('time').setDescription('Event time text').setRequired(true))
      .addRoleOption((option) => option.setName('mention_role').setDescription('Optional role mention'))
      .addIntegerOption((option) => option.setName('slots').setDescription('Main roster slots').setMinValue(1)),
    new SlashCommandBuilder()
      .setName('capt-toggle')
      .setDescription('Open or close an existing capt registration.')
      .addStringOption((option) => option.setName('message_id').setDescription('Capt panel message ID').setRequired(true))
      .addBooleanOption((option) => option.setName('open').setDescription('Open or close registration').setRequired(true)),
    new SlashCommandBuilder()
      .setName('mcl-create')
      .setDescription('Create a custom MCL registration post.')
      .addStringOption((option) => option.setName('mode').setDescription('Event name, for example MCL, VZZ, CW').setRequired(true))
      .addStringOption((option) => option.setName('date').setDescription('Event date text').setRequired(true))
      .addStringOption((option) => option.setName('time').setDescription('Event time text').setRequired(true))
      .addStringOption((option) => option.setName('server').setDescription('Server name').setRequired(true))
      .addIntegerOption((option) => option.setName('slots').setDescription('Main roster slots').setMinValue(1)),
    new SlashCommandBuilder().setName('afk-refresh').setDescription('Clear the AFK list and refresh the AFK panel.'),
    new SlashCommandBuilder()
      .setName('settings-profile-role')
      .setDescription('Add or remove a role that can access profile channels.')
      .addStringOption((option) =>
        option.setName('action').setDescription('Add or remove').setRequired(true).addChoices(
          { name: 'add', value: 'add' },
          { name: 'remove', value: 'remove' }
        )
      )
      .addRoleOption((option) => option.setName('role').setDescription('Role to update').setRequired(true)),
    new SlashCommandBuilder()
      .setName('profiles-sort')
      .setDescription('Sort existing profile channels by member roles.'),
    new SlashCommandBuilder()
      .setName('ticket-accept')
      .setDescription('Accept the application in the current ticket channel and write logs.')
      .addStringOption((option) => option.setName('note').setDescription('Optional note for the log'))
  , ...getReplayCommands(config)].map((command) => command.toJSON());
}

async function registerCommands(config) {
  const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
    body: createCommands(config)
  });
}

async function sendLog(client, channelId, payload) {
  if (!channelId) {
    return;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    return;
  }

  await channel.send(payload).catch((error) => {
    console.error(`Failed to send log to ${channelId}`, error);
  });
}

function cheatCheckHistoryEntry(action, actorId) {
  const labels = {
    created: 'запрос создан',
    claimed: 'проверку взял',
    clean: 'отмечено как чистый',
    rejected: 'проверка отклонена'
  };
  return {
    action,
    actorId,
    text: `${memberTag(actorId)} — ${labels[action] || action}`,
    at: new Date().toISOString()
  };
}

async function sendCheatCheckDm(client, config, userId, options) {
  const user = await client.users.fetch(userId).catch(() => null);
  if (!user) return;
  await user.send(simpleV2Payload(config, {
    title: options.title,
    description: options.description,
    color: options.color ?? config.theme.accent,
    includeDefaultImage: false
  })).catch(() => {});
}

async function sendCheatCheckLifecycleLog(client, config, request, action, actorId, extraLines = []) {
  const channelId = config.logs?.cheatCheckLifecycle || config.logs?.cheatCheck || '';
  await sendLog(client, channelId, simpleV2Payload(config, {
    title: `${emojiText(config, 'hwt_security', '')} Cheat Check`.trim(),
    description: [
      `**Действие:** ${action}`,
      `**Игрок:** ${memberTag(request.requesterId)}`,
      `**Сотрудник:** ${memberTag(actorId)}`,
      request.messageId ? `**Сообщение:** https://discord.com/channels/${config.guildId}/${request.channelId}/${request.messageId}` : null,
      ...extraLines
    ].filter(Boolean).join('\n'),
    color: config.theme.muted,
    includeDefaultImage: false
  }));
}

async function sendCheatCheckRequest(interaction, config, client, values, store = null) {
  const channelId = config.channels?.cheatCheckRequests || '';
  const channel = channelId ? await client.channels.fetch(channelId).catch(() => null) : null;
  if (!channel?.isTextBased?.()) {
    return { ok: false, message: `Канал уведомлений для проверки не найден: ${channelId}.` };
  }

  const initialState = {
    status: 'pending',
    history: [cheatCheckHistoryEntry('created', interaction.user.id)]
  };
  const sent = await channel.send(buildCheatCheckNotificationPayload(config, values, interaction.user.id, initialState));
  if (store?.load && store?.save) {
    const requests = store.load('cheatChecks', {});
    requests[sent.id] = {
      requesterId: interaction.user.id,
      channelId: channel.id,
      messageId: sent.id,
      values,
      status: 'pending',
      history: initialState.history,
      createdAt: new Date().toISOString()
    };
    store.save('cheatChecks', requests);
  }

  await sendCheatCheckDm(client, config, interaction.user.id, {
    title: `${emojiText(config, 'hwt_pending', '')} Запрос на проверку отправлен`.trim(),
    description: `Ваш запрос на проверку отправлен в канал <#${channel.id}>. Когда Cheat Hunter возьмет его в работу или завершит проверку, бот пришлет уведомление.`,
    color: config.theme.muted
  });

  return { ok: true, channelId: channel.id };
}

async function sendLeaveLog(client, config, member, action, payload) {
  await sendLog(client, config.logs.leave, {
    embeds: [
      createEmbed(config, {
        title: action === 'start' ? `${emojiText(config, 'weekend', '')} Логи отпуска` : `${emojiText(config, 'done', '')} Возврат из отпуска`,
        color: action === 'start' ? config.theme.accent : config.theme.success,
        description: [
          `**Игрок:** ${memberTag(member.id)}`,
          action === 'start' ? `**Причина:** ${payload.reason}` : null,
          action === 'start' ? `**До какого времени:** ${payload.until}` : null,
          action === 'start'
            ? `**Снятые роли:** ${formatRoleList(member.guild, payload.removedRoleIds)}`
            : `**Возвращенные роли:** ${formatRoleList(member.guild, payload.restoredRoleIds)}`,
          `**Время:** ${formatDate()}`
        ].filter(Boolean).join('\n'),
        timestamp: true
      })
    ]
  });
}

async function sendTicketAcceptLog(client, config, ticket, acceptedById, note, roleId) {
  await sendLog(client, config.logs.ticket, {
    embeds: [
      createEmbed(config, {
        title: `${emojiText(config, 'hwt_check', emojiText(config, 'done', ''))} Заявка принята`,
        color: config.theme.success,
        description: [
          `**Кандидат:** ${memberTag(ticket.userId)}`,
          `**Принял:** ${memberTag(acceptedById)}`,
          roleId ? `**Выдана роль:** ${roleTag(roleId)}` : null,
          note ? `**Комментарий:** ${note}` : null,
          `**Канал:** <#${ticket.channelId}>`,
          `**Время:** ${formatDate()}`
        ].filter(Boolean).join('\n'),
        timestamp: true
      })
    ]
  });
}

async function sendServerLeaveLog(client, config, member) {
  const matchedRoles = [];
  if (config.roles.test && member.roles.cache.has(config.roles.test)) {
    matchedRoles.push(config.roles.test);
  }
  if (config.roles.heavyweight && member.roles.cache.has(config.roles.heavyweight)) {
    matchedRoles.push(config.roles.heavyweight);
  }

  if (!matchedRoles.length) {
    return;
  }

  const payload = {
    embeds: [
      createEmbed(config, {
        title: 'Лог выхода с сервера',
        color: config.theme.danger,
        description: [
          `**Игрок:** ${member.user.tag} (${member.id})`,
          `**Роли на момент выхода:** ${formatRoleList(member.guild, matchedRoles)}`,
          `**Время:** ${formatDate()}`
        ].join('\n'),
        timestamp: true
      })
    ]
  };

  await sendLog(client, config.logs.memberLeave || config.logs.leave || config.logs.bot, payload);
}

async function deployPanels(client, config, store) {
  const afkData = store.load('afk', {});
  const embeds = buildPanelEmbeds(config, afkData);
  const components = panelComponents(config);
  const plusPingOptions = {
    intro: '@everyone',
    allowedMentions: { parse: ['everyone'] }
  };

  await upsertPanelPayload(client, config, store, 'ticket', familyApplyV2Payload(config));
  await upsertPanelPayload(client, config, store, 'links', componentsV2PayloadFromEmbed(config, embeds.links, components.links));
  await upsertPanelPayload(client, config, store, 'interaction', componentsV2PayloadFromEmbed(config, embeds.interaction, components.interaction));
  await upsertPanelPayload(client, config, store, 'afk', componentsV2PayloadFromEmbed(config, embeds.afk, components.afk));
  if (isPanelChannelConfigured(config, 'warn')) {
    await upsertPanelPayload(client, config, store, 'warn', componentsV2PayloadFromEmbed(config, embeds.warn, components.warn), { optional: true });
  }
  await upsertPanelPayload(client, config, store, 'captPlus', componentsV2PayloadFromEmbed(config, embeds.captPlus, components.captPlus, plusPingOptions));
  await upsertPanelPayload(client, config, store, 'mclPlus', componentsV2PayloadFromEmbed(config, embeds.mclPlus, components.mclPlus, plusPingOptions));
  await upsertPanelPayload(client, config, store, 'cheatCheck', buildCheatCheckPanelPayload(config), { optional: true });
}

async function deleteStoredPanelMessage(client, config, settings, key) {
  const messageId = settings.panelMessages?.[key];
  const channelId = resolveChannelId(config, key);
  if (!messageId || !channelId) {
    return false;
  }

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased?.()) {
    return false;
  }

  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (message) {
    await message.delete().catch(() => null);
  }
  delete settings.panelMessages[key];
  return Boolean(message);
}

async function refreshAllPanels(client, config, store, replayModule = null) {
  const settings = store.load('settings', settingsDefaults(config));
  const panelKeys = ['ticket', 'links', 'interaction', 'afk', 'captPlus', 'mclPlus', 'cheatCheck'];
  if (isPanelChannelConfigured(config, 'warn')) {
    panelKeys.splice(4, 0, 'warn');
  }
  let deleted = 0;

  for (const key of panelKeys) {
    if (await deleteStoredPanelMessage(client, config, settings, key)) {
      deleted += 1;
    }
  }

  store.save('settings', settings);
  await deployPanels(client, config, store);
  if (config.replays?.enabled === false) {
    return { deleted, panelCount: panelKeys.length };
  }
  if (replayModule?.recreateMainPanel) {
    await replayModule.recreateMainPanel(client);
  } else if (replayModule?.ensureMainPanel) {
    if (config.replays?.enabled !== false) {
      await replayModule.ensureMainPanel(client);
    }
  }

  return { deleted, panelCount: panelKeys.length + 1 };
}

function formatSetupValue(value, type) {
  if (Array.isArray(value)) {
    if (!value.length) return '`не задано`';
    return value.map((id) => type === 'channel' ? `<#${id}>` : roleTag(id)).join(' ');
  }
  if (!value) return '`не задано`';
  return type === 'channel' ? `<#${value}>` : roleTag(value);
}

function buildSetupSummary(config) {
  const channelLines = Object.entries(SETUP_CHANNEL_TARGETS).map(([key, def]) => {
    const value = getNestedValue(config, def.configPath);
    return `**${key}:** ${formatSetupValue(value, 'channel')}`;
  });
  const roleLines = Object.entries(SETUP_ROLE_TARGETS).map(([key, def]) => {
    const value = getNestedValue(config, def.configPath);
    return `**${key}:** ${formatSetupValue(value, 'role')}`;
  });

  return {
    title: 'Настройки бота',
    fields: [
      { name: `${emojiText(config, 'hwt_link', '')} Каналы`.trim(), value: channelLines.join('\n').slice(0, 1024) || '`пусто`', inline: false },
      { name: `${emojiText(config, 'hwt_staff', '')} Роли`.trim(), value: roleLines.join('\n').slice(0, 1024) || '`пусто`', inline: false }
    ]
  };
}

async function handleSetupCommand(interaction, config) {
  if (!canUseSetupCommand(interaction.member)) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Команда /setup доступна только роли ${roleTag(config.roles?.setupCommand)}.` });
    return;
  }

  const subcommand = interaction.options.getSubcommand();
  if (subcommand === 'show') {
    await interaction.reply(simpleV2Payload(config, {
      ...buildSetupSummary(config),
      ephemeral: true
    }));
    return;
  }

  if (subcommand === 'channel') {
    const key = interaction.options.getString('key', true);
    const channel = interaction.options.getChannel('channel', true);
    const target = SETUP_CHANNEL_TARGETS[key];
    if (!target) {
      await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Неизвестный ключ канала.' });
      return;
    }

    saveConfigMutation(config, (rawConfig) => {
      setNestedValue(rawConfig, target.configPath, channel.id);
    });
    updateRuntimeConfig(config, target.configPath, channel.id);

    await interaction.reply(simpleV2Payload(config, {
      title: `${emojiText(config, 'hwt_success', '')} Канал обновлен`.trim(),
      description: `**${target.label}:** <#${channel.id}>\n\nИзменение записано в \`config.json\`.`,
      ephemeral: true
    }));
    return;
  }

  if (subcommand === 'role') {
    const key = interaction.options.getString('key', true);
    const role = interaction.options.getRole('role', true);
    const action = interaction.options.getString('action') || 'set';
    const target = SETUP_ROLE_TARGETS[key];
    if (!target) {
      await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Неизвестный ключ роли.' });
      return;
    }

    let nextValue;
    saveConfigMutation(config, (rawConfig) => {
      const current = getNestedValue(rawConfig, target.configPath);
      if (target.array) {
        const set = new Set(ensureArray(current));
        if (action === 'remove') {
          set.delete(role.id);
        } else if (action === 'set') {
          set.clear();
          set.add(role.id);
        } else {
          set.add(role.id);
        }
        nextValue = [...set];
      } else {
        nextValue = action === 'remove' ? '' : role.id;
      }
      setNestedValue(rawConfig, target.configPath, nextValue);
    });
    updateRuntimeConfig(config, target.configPath, nextValue);

    await interaction.reply(simpleV2Payload(config, {
      title: `${emojiText(config, 'hwt_success', '')} Роль обновлена`.trim(),
      description: `**${target.label}:** ${formatSetupValue(nextValue, 'role')}\n\nДействие: \`${action}\`. Изменение записано в \`config.json\`.`,
      ephemeral: true
    }));
  }
}

async function refreshAfkPanel(client, config, store) {
  const settings = store.load('settings', settingsDefaults(config));
  const channel = await client.channels.fetch(resolveChannelId(config, 'afk')).catch(() => null);
  const messageId = settings.panelMessages.afk;
  if (!channel || !channel.isTextBased() || !messageId) {
    return;
  }

  const message = await channel.messages.fetch(messageId).catch(() => null);
  if (!message) {
    return;
  }

  const embeds = buildPanelEmbeds(config, store.load('afk', {}));
  await editOrRecreatePanelPayload(client, config, store, 'afk', message, componentsV2PayloadFromEmbed(config, embeds.afk, panelComponents(config).afk));
}

async function remindLongAfkUsers(client, config, store) {
  const afk = store.load('afk', {});
  let changed = false;

  for (const entry of Object.values(afk)) {
    if (!entry?.userId || entry.remindedAfter12h) continue;

    const createdAt = new Date(entry.createdAt).getTime();
    if (!Number.isFinite(createdAt) || Date.now() - createdAt < AFK_REMINDER_AFTER_MS) {
      continue;
    }

    const user = await client.users.fetch(entry.userId).catch(() => null);
    await user?.send?.(simpleV2Payload(config, {
      title: `${emojiText(config, 'hwt_afk', emojiText(config, 'afk', ''))} AFK напоминание`,
      description: 'Ты уже 12 часов в AFK. Если вернулся, нажми кнопку **Вернуться из AFK** на панели.',
      color: config.theme.muted
    })).catch(() => {});
    entry.remindedAfter12h = new Date().toISOString();
    changed = true;
  }

  if (changed) {
    store.save('afk', afk);
  }
}

async function cleanupExpiredAfkUsers(client, config, store) {
  const afk = store.load('afk', {});
  const now = Date.now();
  const expired = [];

  for (const [userId, entry] of Object.entries(afk)) {
    const expiresAt = entry?.expiresAt ? new Date(entry.expiresAt).getTime() : null;
    if (Number.isFinite(expiresAt) && expiresAt <= now) {
      expired.push(userId);
    }
  }

  if (!expired.length) {
    return;
  }

  for (const userId of expired) {
    delete afk[userId];
  }
  store.save('afk', afk);
  await refreshAfkPanel(client, config, store);

  for (const userId of expired) {
    const user = await client.users.fetch(userId).catch(() => null);
    await user?.send?.(simpleV2Payload(config, {
      title: `${emojiText(config, 'hwt_afk', emojiText(config, 'afk', ''))} AFK завершен`.trim(),
      description: 'Твой AFK-статус автоматически снят по истечению указанного времени.',
      color: config.theme.success
    })).catch(() => {});
  }
}

function startAfkMaintenance(client, config, store) {
  const runReminders = () => remindLongAfkUsers(client, config, store).catch((error) => {
    console.error('Failed to remind long AFK users', error);
  });
  const runCleanup = () => cleanupExpiredAfkUsers(client, config, store).catch((error) => {
    console.error('Failed to cleanup expired AFK users', error);
  });

  runReminders();
  runCleanup();
  const reminderTimer = setInterval(runReminders, 10 * 60 * 1000);
  const cleanupTimer = setInterval(runCleanup, AFK_CLEANUP_INTERVAL_MS);
  return { reminderTimer, cleanupTimer };
}

function normalizeDiscordId(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/\d{5,}/);
    return match ? match[0] : null;
  }
  if (typeof value === 'object' && typeof value.id === 'string') {
    return value.id;
  }
  return null;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getProfileCategoryDefs(config) {
  const defs = (config.profileCategory?.roleDefs || DEFAULT_PROFILE_CATEGORY_ROLE_DEFS).map((def) => {
    const configuredRoleId = def.roleConfigKey ? normalizeDiscordId(config.roles?.[def.roleConfigKey]) : null;
    return {
      ...def,
      roleIds: [...new Set([...ensureArray(def.roleIds), configuredRoleId].filter(Boolean))]
    };
  });

  return [...defs, config.profileCategory?.fallbackDef || DEFAULT_PROFILE_CATEGORY_FALLBACK_DEF];
}

function getProfileCategoryDefForMember(member, config) {
  const inactiveRoleId = normalizeDiscordId(config.roles?.inactive);
  if (inactiveRoleId && member?.roles?.cache?.has(inactiveRoleId)) {
    return config.profileCategory?.fallbackDef || DEFAULT_PROFILE_CATEGORY_FALLBACK_DEF;
  }

  const defs = getProfileCategoryDefs(config);
  for (const def of defs) {
    if (!def.roleIds?.length) continue;
    if (def.roleIds.some((roleId) => member?.roles?.cache?.has(roleId))) {
      return def;
    }
  }

  return config.profileCategory?.fallbackDef || DEFAULT_PROFILE_CATEGORY_FALLBACK_DEF;
}

function profileCategoryName(def, index) {
  return `${def.label}${index}`;
}

function profileCategoryIndex(categoryName, def) {
  const match = String(categoryName || '').match(new RegExp(`^${escapeRegExp(def.label)}(\\d+)$`, 'i'));
  return match ? Number(match[1]) : null;
}

function sortCategoriesByProfileIndex(categories, def) {
  return [...categories].sort((a, b) => profileCategoryIndex(a.name, def) - profileCategoryIndex(b.name, def));
}

function findProfileGroupCategories(guild, def) {
  return sortCategoriesByProfileIndex(
    guild.channels.cache
      .filter((channel) => channel.type === ChannelType.GuildCategory && profileCategoryIndex(channel.name, def))
      .values(),
    def
  );
}

function rememberProfileCategory(settings, categoryId) {
  settings.profileCategoryIds = ensureArray(settings.profileCategoryIds);
  if (!settings.profileCategoryIds.includes(categoryId)) {
    settings.profileCategoryIds.push(categoryId);
  }
}

function mergeProfileAccessRoles(settings, config) {
  settings.profileAccessRoles = [...new Set([
    ...ensureArray(settings.profileAccessRoles),
    ...ensureArray(config.roles?.profileAccess),
    ...ensureArray(config.replays?.reviewerRoleIds)
  ])].map(normalizeDiscordId).filter(Boolean);
}

function pruneProfileAccessSettings(guild, settings) {
  const everyoneRoleId = guild.roles.everyone.id;
  settings.profileAccessRoles = ensureArray(settings.profileAccessRoles)
    .map(normalizeDiscordId)
    .filter((roleId, index, roleIds) => roleId && roleId !== everyoneRoleId && roleIds.indexOf(roleId) === index);
}

async function syncProfileCategoryPermissions(category, guild, settings, config) {
  rememberProfileCategory(settings, category.id);
  mergeProfileAccessRoles(settings, config);
  pruneProfileAccessSettings(guild, settings);
  await category.permissionOverwrites
    .set(buildProfileCategoryPermissionOverwrites(guild, settings, config), 'Sync profile category access roles')
    .catch(() => {});
}

function getProfileAccessRoleIds(guild, settings, config = null) {
  const everyoneRoleId = guild.roles.everyone.id;
  const combinedRoleIds = [
    ...ensureArray(settings.profileAccessRoles),
    ...(config ? ensureArray(config.replays?.reviewerRoleIds) : []),
    ...REQUIRED_PROFILE_ACCESS_ROLE_IDS
  ];

  return [...new Set(combinedRoleIds)]
    .map(normalizeDiscordId)
    .filter((roleId) => roleId && roleId !== everyoneRoleId && guild.roles.cache.has(roleId));
}

function buildProfileCategoryPermissionOverwrites(guild, settings, config = null) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    }
  ];

  for (const roleId of getProfileAccessRoleIds(guild, settings, config)) {
    overwrites.push({
      id: roleId,
      allow: PROFILE_CHANNEL_PERMISSIONS
    });
  }

  return overwrites;
}

function buildProfilePermissionOverwrites(guild, settings, userId, config = null) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: userId,
      allow: PROFILE_CHANNEL_PERMISSIONS
    }
  ];

  for (const roleId of getProfileAccessRoleIds(guild, settings, config)) {
    overwrites.push({
      id: roleId,
      allow: PROFILE_CHANNEL_PERMISSIONS
    });
  }

  return overwrites;
}

function buildLockedProfilePermissionOverwrites(guild, settings, config = null) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    }
  ];

  for (const roleId of getProfileAccessRoleIds(guild, settings, config)) {
    overwrites.push({
      id: roleId,
      allow: PROFILE_CHANNEL_PERMISSIONS
    });
  }

  return overwrites;
}

function findAllProfileCategories(guild, settings, config) {
  const categoryIds = new Set([
    config.categories?.profiles,
    ...ensureArray(settings.profileCategoryIds)
  ].filter(Boolean));

  for (const def of getProfileCategoryDefs(config)) {
    for (const category of findProfileGroupCategories(guild, def)) {
      categoryIds.add(category.id);
    }
  }

  return [...categoryIds]
    .map((categoryId) => guild.channels.cache.get(categoryId))
    .filter((channel) => channel?.type === ChannelType.GuildCategory);
}

function pruneTrackedProfileCategories(guild, settings, config) {
  const allowedIds = new Set();
  for (const def of getProfileCategoryDefs(config)) {
    for (const category of findProfileGroupCategories(guild, def)) {
      allowedIds.add(category.id);
    }
  }

  const baseCategory = config.categories?.profiles ? guild.channels.cache.get(config.categories.profiles) : null;
  if (baseCategory?.type === ChannelType.GuildCategory && /^profiles\d*$/i.test(baseCategory.name)) {
    allowedIds.add(baseCategory.id);
  }

  settings.profileCategoryIds = ensureArray(settings.profileCategoryIds).filter((categoryId) => allowedIds.has(categoryId));
}

function findProfileByChannelId(profiles, channelId) {
  return Object.values(profiles).find((profile) => profile?.channelId === channelId) || null;
}

async function inferProfileOwnerIdFromChannel(channel, profiles, settings) {
  const storedProfile = findProfileByChannelId(profiles, channel.id);
  if (storedProfile?.userId) {
    return storedProfile.userId;
  }

  const actionEntries = Object.entries(settings.profileActionMessages || {});
  for (const [userId, messageId] of actionEntries) {
    if (!messageId) continue;
    const message = await channel.messages?.fetch?.(messageId).catch(() => null);
    if (message?.channelId === channel.id) {
      return userId;
    }
  }

  const messages = await channel.messages?.fetch?.({ limit: 20 }).catch(() => null);
  if (!messages) {
    return null;
  }

  for (const message of messages.values()) {
    const mentionedUserId = message.mentions?.users?.first?.()?.id;
    if (mentionedUserId) {
      return mentionedUserId;
    }

    const match = message.content?.match?.(/<@!?(\d{5,})>/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function getCategoryChildCount(guild, categoryId) {
  return guild.channels.cache.filter((channel) => channel.parentId === categoryId).size;
}

async function ensureProfileCategoryByIndex(guild, config, store, settings, def, index) {
  await guild.channels.fetch().catch(() => null);

  const wantedName = profileCategoryName(def, index);
  let category = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildCategory && channel.name.toLowerCase() === wantedName.toLowerCase()
  );

  if (!category) {
    category = await guild.channels.create({
      name: wantedName,
      type: ChannelType.GuildCategory,
      permissionOverwrites: buildProfileCategoryPermissionOverwrites(guild, settings, config)
    });
  }

  await syncProfileCategoryPermissions(category, guild, settings, config);
  store.save('settings', settings);
  return category;
}

async function ensureProfileCategory(guild, config, store, settings, member = null) {
  await guild.channels.fetch().catch(() => null);
  const def = getProfileCategoryDefForMember(member, config);

  const existingCategories = findProfileGroupCategories(guild, def);
  for (const category of existingCategories) {
    await syncProfileCategoryPermissions(category, guild, settings, config);
    if (getCategoryChildCount(guild, category.id) < PROFILE_CATEGORY_CAPACITY) {
      store.save('settings', settings);
      return category.id;
    }
  }

  const maxIndex = existingCategories.reduce((max, category) => Math.max(max, profileCategoryIndex(category.name, def) || 0), 0);
  const category = await ensureProfileCategoryByIndex(guild, config, store, settings, def, maxIndex + 1);
  return category.id;
}

function rememberProfileActionMessage(store, config, userId, messageId) {
  const settings = store.load('settings', settingsDefaults(config));
  settings.profileActionMessages = settings.profileActionMessages || {};
  settings.profileActionMessages[userId] = messageId;
  store.save('settings', settings);
}

async function ensureProfileActionMessage(channel, config, store, profile) {
  const settings = store.load('settings', settingsDefaults(config));
  settings.profileActionMessages = settings.profileActionMessages || {};

  const payload = buildProfileActionPayload(config, profile, profile.userId, { ping: false });

  const storedMessageId = settings.profileActionMessages[profile.userId];
  if (storedMessageId) {
    const existingMessage = await channel.messages.fetch(storedMessageId).catch(() => null);
    if (existingMessage) {
      if (existingMessage.embeds?.length || existingMessage.content) {
        await existingMessage.delete().catch(() => null);
      } else {
        await existingMessage.edit(payloadForPanelEdit(payload, existingMessage));
        return existingMessage;
      }
    }
  }

  const message = await channel.send(payload);
  settings.profileActionMessages[profile.userId] = message.id;
  store.save('settings', settings);
  return message;
}

async function migrateLegacyProfileCategories(guild, config, store, settings, groupedEntries) {
  const desiredNames = [];
  for (const def of getProfileCategoryDefs(config)) {
    const entries = groupedEntries.get(def.key) || [];
    const neededCount = Math.ceil(entries.length / PROFILE_CATEGORY_CAPACITY);
    for (let index = 1; index <= neededCount; index += 1) {
      desiredNames.push(profileCategoryName(def, index));
    }
  }

  const existingNames = new Set(
    guild.channels.cache
      .filter((channel) => channel.type === ChannelType.GuildCategory)
      .map((category) => category.name.toLowerCase())
  );
  const legacyCategories = [...guild.channels.cache
    .filter((channel) => channel.type === ChannelType.GuildCategory && /^profiles\d*$/i.test(channel.name))
    .values()]
    .sort((a, b) => {
      const getIndex = (name) => {
        const match = name.match(/^profiles(\d*)$/i);
        return match && match[1] ? Number(match[1]) : 0;
      };
      return getIndex(a.name) - getIndex(b.name);
    });

  for (const category of legacyCategories) {
    existingNames.delete(category.name.toLowerCase());
    let nextName = desiredNames.find((name) => !existingNames.has(name.toLowerCase()));
    if (!nextName) {
      let fallbackIndex = 1;
      do {
        nextName = profileCategoryName(config.profileCategory?.fallbackDef || DEFAULT_PROFILE_CATEGORY_FALLBACK_DEF, fallbackIndex);
        fallbackIndex += 1;
      } while (existingNames.has(nextName.toLowerCase()));
    }

    const renamed = await category.setName(nextName, 'Rename legacy profile category by role')
      .then(() => true)
      .catch(() => false);
    if (renamed) {
      existingNames.add(nextName.toLowerCase());
    } else {
      existingNames.add(category.name.toLowerCase());
    }
    await syncProfileCategoryPermissions(category, guild, settings, config);
  }

  store.save('settings', settings);
}

async function sortProfileChannelsByRole(guild, config, store, settings, entries) {
  const groupedEntries = new Map();
  for (const def of getProfileCategoryDefs(config)) {
    groupedEntries.set(def.key, []);
  }

  for (const entry of entries) {
    const def = getProfileCategoryDefForMember(entry.member, config);
    groupedEntries.get(def.key).push(entry);
  }

  for (const list of groupedEntries.values()) {
    list.sort((a, b) => {
      const left = (a.profile.nickname || a.channel.name || '').toLowerCase();
      const right = (b.profile.nickname || b.channel.name || '').toLowerCase();
      return left.localeCompare(right);
    });
  }

  await migrateLegacyProfileCategories(guild, config, store, settings, groupedEntries);

  for (const def of getProfileCategoryDefs(config)) {
    const entriesForGroup = groupedEntries.get(def.key) || [];
    if (!entriesForGroup.length) continue;

    const categories = new Map();
    const neededCount = Math.ceil(entriesForGroup.length / PROFILE_CATEGORY_CAPACITY);
    for (let index = 1; index <= neededCount; index += 1) {
      const category = await ensureProfileCategoryByIndex(guild, config, store, settings, def, index);
      categories.set(index, category);
    }

    for (let index = 0; index < entriesForGroup.length; index += 1) {
      const entry = entriesForGroup[index];
      const categoryIndex = Math.floor(index / PROFILE_CATEGORY_CAPACITY) + 1;
      const targetCategory = categories.get(categoryIndex);
      if (!targetCategory || entry.channel.parentId === targetCategory.id) continue;

      await entry.channel.setParent(targetCategory.id, {
        lockPermissions: false,
        reason: 'Sort profile channel by member role'
      }).catch(() => {});
    }
  }

  pruneTrackedProfileCategories(guild, settings, config);
  store.save('settings', settings);
}

async function sortSingleProfileChannelByMember(member, config, store) {
  if (!member?.guild || member.guild.id !== config.guildId) {
    return { ok: false, reason: 'guild-mismatch' };
  }

  const profiles = store.load('profiles', {});
  const profile = profiles[member.id];
  if (!profile?.channelId) {
    return { ok: false, reason: 'profile-missing' };
  }

  const channel = await member.guild.channels.fetch(profile.channelId).catch(() => null);
  if (!channel?.isTextBased?.()) {
    return { ok: false, reason: 'channel-missing' };
  }

  const settings = store.load('settings', settingsDefaults(config));
  pruneProfileAccessSettings(member.guild, settings);
  const targetCategoryId = await ensureProfileCategory(member.guild, config, store, settings, member);
  if (!targetCategoryId) {
    return { ok: false, reason: 'category-missing' };
  }

  if (channel.parentId !== targetCategoryId) {
    await channel.setParent(targetCategoryId, {
      lockPermissions: false,
      reason: 'Move profile channel after member role update'
    });
  }

  await channel.permissionOverwrites
    .set(buildProfilePermissionOverwrites(member.guild, settings, profile.userId, config), 'Sync profile access roles')
    .catch(() => {});
  store.save('settings', settings);

  return { ok: true, channelId: channel.id, categoryId: targetCategoryId };
}

async function syncExistingProfileChannels(client, config, store) {
  const guild = await client.guilds.fetch(config.guildId).catch(() => null);
  if (!guild) {
    return;
  }

  await guild.channels.fetch().catch(() => null);
  await ensureGuildRolesCached(guild);
  const settings = store.load('settings', settingsDefaults(config));
  mergeProfileAccessRoles(settings, config);
  pruneProfileAccessSettings(guild, settings);
  const profiles = store.load('profiles', {});
  const syncedChannelIds = new Set();
  const sortableEntries = [];

  for (const profile of Object.values(profiles)) {
    if (!profile?.channelId) continue;

    const channel = await guild.channels.fetch(profile.channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) continue;
    const member = await guild.members.fetch(profile.userId).catch(() => null);

    await channel.permissionOverwrites
      .set(buildProfilePermissionOverwrites(guild, settings, profile.userId, config), 'Sync profile access roles')
      .catch(() => {});
    await ensureProfileActionMessage(channel, config, store, profile).catch(() => {});
    sortableEntries.push({ profile, channel, member });
    syncedChannelIds.add(channel.id);
  }

  for (const category of findAllProfileCategories(guild, settings, config)) {
    rememberProfileCategory(settings, category.id);
    await syncProfileCategoryPermissions(category, guild, settings, config);

    const profileChannels = guild.channels.cache
      .filter((channel) => channel.parentId === category.id && channel.type === ChannelType.GuildText)
      .values();

    for (const channel of profileChannels) {
      if (syncedChannelIds.has(channel.id)) continue;

      const ownerId = await inferProfileOwnerIdFromChannel(channel, profiles, settings);
      const overwrites = ownerId
        ? buildProfilePermissionOverwrites(guild, settings, ownerId, config)
        : buildLockedProfilePermissionOverwrites(guild, settings, config);

      await channel.permissionOverwrites
        .set(overwrites, ownerId ? 'Sync profile owner and access roles' : 'Lock profile channel without known owner')
        .catch(() => {});

      if (ownerId) {
        const profile = profiles[ownerId] || {
          userId: ownerId,
          nickname: channel.name,
          staticCode: 'не указан',
          channelId: channel.id,
          createdAt: new Date().toISOString()
        };
        profile.channelId = channel.id;
        profiles[ownerId] = profile;
        const member = await guild.members.fetch(ownerId).catch(() => null);
        sortableEntries.push({ profile, channel, member });
      }

      syncedChannelIds.add(channel.id);
    }
  }

  store.save('settings', settings);
  store.save('profiles', profiles);
  await sortProfileChannelsByRole(guild, config, store, settings, sortableEntries);
}

async function createProfileChannel(interaction, config, store, values) {
  const profiles = store.load('profiles', {});
  const existing = profiles[interaction.user.id];
  if (existing?.channelId) {
    return { alreadyExists: true, channelId: existing.channelId };
  }

  const settings = store.load('settings', settingsDefaults(config));
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => interaction.member);
  const profileCategoryId = await ensureProfileCategory(interaction.guild, config, store, settings, member);
  const channel = await interaction.guild.channels.create({
    name: sanitizeName(values.nickname || interaction.user.username),
    type: ChannelType.GuildText,
    parent: profileCategoryId,
    permissionOverwrites: buildProfilePermissionOverwrites(interaction.guild, settings, interaction.user.id, config)
  });

  profiles[interaction.user.id] = {
    userId: interaction.user.id,
    nickname: values.nickname,
    staticCode: values.staticCode,
    channelId: channel.id,
    createdAt: new Date().toISOString()
  };
  store.save('profiles', profiles);

  const welcomeMessage = await channel.send(buildProfileActionPayload(config, profiles[interaction.user.id], interaction.user.id));
  rememberProfileActionMessage(store, config, interaction.user.id, welcomeMessage.id);
  await ensureProfileThreads(interaction.guild, config, store, profiles[interaction.user.id], { createMissing: true });

  return { alreadyExists: false, channelId: channel.id };
}

async function createProfileChannelV2(interaction, config, store, values, client) {
  const profiles = store.load('profiles', {});
  const existingProfile = profiles[interaction.user.id];
  const { channel: existingChannel } = await resolveProfileRecord(interaction.guild, store, interaction.user.id);
  if (existingChannel) {
    return { alreadyExists: true, channelId: existingChannel.id, recreated: false };
  }

  const settings = store.load('settings', settingsDefaults(config));
  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => interaction.member);
  const profileCategoryId = await ensureProfileCategory(interaction.guild, config, store, settings, member);
  const channel = await interaction.guild.channels.create({
    name: sanitizeName(values.nickname || interaction.user.username),
    type: ChannelType.GuildText,
    parent: profileCategoryId,
    permissionOverwrites: buildProfilePermissionOverwrites(interaction.guild, settings, interaction.user.id, config)
  });

  const profile = {
    userId: interaction.user.id,
    nickname: values.nickname,
    staticCode: values.staticCode,
    channelId: channel.id,
    createdAt: existingProfile?.createdAt || new Date().toISOString(),
    profileThreads: existingProfile?.profileThreads || {}
  };
  profiles[interaction.user.id] = profile;
  store.save('profiles', profiles);

  const welcomeMessage = await channel.send(buildProfileActionPayload(config, profile, interaction.user.id));
  rememberProfileActionMessage(store, config, interaction.user.id, welcomeMessage.id);
  await ensureProfileThreads(interaction.guild, config, store, profile, { createMissing: true });

  await sendProfileLog(
    client,
    config,
    `${emojiText(config, 'hwt_profile', emojiText(config, 'profile', ''))} Создан личный профиль`,
    [
      `**Игрок:** ${memberTag(interaction.user.id)}`,
      `**Канал:** <#${channel.id}>`,
      `**Ник:** ${values.nickname}`,
      `**Статик:** ${values.staticCode}`
    ].join('\n'),
    config.theme.success
  );

  return { alreadyExists: false, channelId: channel.id, recreated: Boolean(existingProfile) };
}

async function recreateProfileChannel(interaction, config, store, client) {
  const profiles = store.load('profiles', {});
  const existingProfile = profiles[interaction.user.id];
  if (!existingProfile) {
    return { ok: false, message: 'Сначала создайте профиль.' };
  }

  const oldChannel = existingProfile.channelId
    ? await interaction.guild.channels.fetch(existingProfile.channelId).catch(() => null)
    : null;

  if (oldChannel) {
    const deleted = await oldChannel.delete('Profile recreated by owner').then(() => true).catch(() => false);
    if (!deleted) {
      return { ok: false, message: 'Не удалось удалить старый профиль. Проверьте права бота на удаление канала.' };
    }
  }

  profiles[interaction.user.id] = { ...existingProfile, channelId: null };
  store.save('profiles', profiles);

  const result = await createProfileChannelV2(interaction, config, store, {
    nickname: existingProfile.nickname || interaction.user.username,
    staticCode: existingProfile.staticCode || 'не указан'
  }, client);

  return {
    ok: true,
    channelId: result.channelId,
    message: `Профиль пересоздан: <#${result.channelId}>`
  };
}

async function deleteMemberProfile(member, config, store, client, options = {}) {
  const profiles = store.load('profiles', {});
  const profile = profiles[member.id];
  if (!profile) {
    return;
  }

  if (profile.channelId) {
    const channel = await member.guild.channels.fetch(profile.channelId).catch(() => null);
    if (channel) {
      await channel.delete(options.deleteReason || 'Profile owner lost profile access').catch(() => {});
    }
  }

  delete profiles[member.id];
  store.save('profiles', profiles);

  const settings = store.load('settings', settingsDefaults(config));
  if (settings.profileActionMessages?.[member.id]) {
    delete settings.profileActionMessages[member.id];
    store.save('settings', settings);
  }

  await sendProfileLog(
    client,
    config,
    `${emojiText(config, 'hwt_delete', emojiText(config, 'hwt_profile', emojiText(config, 'profile', '')))} Профиль удален`,
    `Игрок ${memberTag(member.id)} ${options.logReason || 'потерял доступ к личному профилю'}, личный профиль удален.`,
    config.theme.danger
  ).catch(() => {});
}

async function applyLeave(member, config, store, form) {
  const leaves = store.load('leaves', {});
  if (leaves[member.id]) {
    return { ok: false, message: 'У вас уже активен отпуск.' };
  }

  const protectedRoles = new Set([
    member.guild.roles.everyone.id,
    ...ensureArray(config.roles.protectedFromLeaveRemoval)
  ]);

  const removableRoleIds = member.roles.cache
    .filter((role) => !protectedRoles.has(role.id))
    .map((role) => role.id);

  try {
    if (removableRoleIds.length) {
      await member.roles.remove(removableRoleIds, 'Leave started via HEAVYWEIGHT bot');
    }
    if (config.roles.inactive) {
      await member.roles.add(config.roles.inactive, 'Leave started via HEAVYWEIGHT bot');
    }
  } catch (error) {
    if (error?.code === 50013) {
      return {
        ok: false,
        message:
          'Боту не хватает прав для изменения ролей (Missing Permissions). Проверьте, что у роли бота есть **Manage Roles** и она находится **выше** изменяемых ролей в списке ролей сервера.'
      };
    }
    throw error;
  }

  leaves[member.id] = {
    userId: member.id,
    reason: form.reason,
    until: form.until,
    removedRoleIds: removableRoleIds,
    createdAt: new Date().toISOString()
  };
  store.save('leaves', leaves);

  return { ok: true, leave: leaves[member.id] };
}

async function endLeave(member, config, store) {
  const leaves = store.load('leaves', {});
  const leave = leaves[member.id];
  if (!leave) {
    return { ok: false, message: 'У вас нет активного отпуска.' };
  }

  const restoredRoleIds = ensureArray(leave.removedRoleIds).filter((roleId) => member.guild.roles.cache.has(roleId));
  try {
    if (config.roles.inactive && member.roles.cache.has(config.roles.inactive)) {
      await member.roles.remove(config.roles.inactive, 'Leave ended via HEAVYWEIGHT bot');
    }
    if (restoredRoleIds.length) {
      await member.roles.add(restoredRoleIds, 'Leave ended via HEAVYWEIGHT bot');
    }
  } catch (error) {
    if (error?.code === 50013) {
      return {
        ok: false,
        message:
          'Боту не хватает прав для изменения ролей (Missing Permissions). Проверьте, что у роли бота есть **Manage Roles** и она находится **выше** изменяемых ролей в списке ролей сервера.'
      };
    }
    throw error;
  }

  delete leaves[member.id];
  store.save('leaves', leaves);

  return { ok: true, leave, restoredRoleIds };
}

async function submitReport(interaction, config, store, reportType, values) {
  const profiles = store.load('profiles', {});
  const reports = store.load('reports', []);
  const profile = profiles[interaction.user.id];
  if (!profile?.channelId) {
    return { ok: false, message: 'Сначала создайте личный профиль.' };
  }

  const report = {
    id: `${Date.now()}-${interaction.user.id}`,
    userId: interaction.user.id,
    type: reportType,
    eventName: values.eventName,
    link: values.link,
    note: values.note,
    createdAt: new Date().toISOString()
  };

  reports.push(report);
  store.save('reports', reports);

  const { channel: profileChannel, threadId } = await resolveProfileTargetChannel(interaction.guild, config, store, profile, reportType);
  if (profileChannel?.isTextBased()) {
    await profileChannel.send(simpleV2Payload(config, {
      title: `${emojiText(config, 'hwt_check', '')} Скрин ГГ`,
      description: [
        `**Мероприятие:** ${values.eventName}`,
        `**Ссылка:** ${values.link}`,
        values.note ? `**Комментарий:** ${values.note}` : null
      ].filter(Boolean).join('\n'),
      intro: memberTag(interaction.user.id),
      allowedMentions: { users: [interaction.user.id] },
      timestamp: true
    }));
  }

  return { ok: true, channelId: profile.channelId, threadId };
}

function buildDismissRow(config) {
  return [
    new ActionRowBuilder().addComponents(
      maybeSetButtonEmoji(
        new ButtonBuilder()
          .setCustomId('utility:dismiss')
          .setLabel('Убрать сообщение')
          .setStyle(ButtonStyle.Secondary),
        config.emojis.hwt_check || config.emojis.done
      )
    )
  ];
}

async function resolveProfileRecord(guild, store, userId) {
  const profiles = store.load('profiles', {});
  const profile = profiles[userId];
  if (!profile) {
    return { profile: null, channel: null };
  }

  if (!profile.channelId) {
    return { profile, channel: null };
  }

  const channel = await guild.channels.fetch(profile.channelId).catch(() => null);
  if (channel?.isTextBased()) {
    return { profile, channel };
  }

  profiles[userId] = {
    ...profile,
    channelId: null
  };
  store.save('profiles', profiles);
  return { profile: profiles[userId], channel: null };
}

function ticketTrackText(config, track) {
  const meta = TICKET_TRACKS[track] || TICKET_TRACKS.main;
  return withEmojiLabel(meta.label, emojiText(config, meta.emojiKey, ''));
}

function ticketAcceptChoiceText(config, choice) {
  const meta = TICKET_ACCEPT_ROLES[choice] || TICKET_ACCEPT_ROLES.main;
  return withEmojiLabel(meta.label, emojiText(config, meta.emojiKey, ''));
}

function buildTicketStaffComponents(config) {
  return [
    new ActionRowBuilder().addComponents(
      maybeSetButtonEmoji(
        new ButtonBuilder().setCustomId('ticket:accept').setLabel('Принять').setStyle(ButtonStyle.Success),
        config.emojis.hwt_accept || config.emojis.hwt_check || config.emojis.done
      ),
      maybeSetButtonEmoji(
        new ButtonBuilder().setCustomId('ticket:reject').setLabel('Отклонить').setStyle(ButtonStyle.Danger),
        config.emojis.hwt_reject || config.emojis.no
      ),
      maybeSetButtonEmoji(
        new ButtonBuilder().setCustomId('ticket:interview').setLabel('Вызвать на обзвон').setStyle(ButtonStyle.Secondary),
        config.emojis.hwt_interview || config.emojis.hwt_voice || config.emojis.voice
      ),
      maybeSetButtonEmoji(
        new ButtonBuilder().setCustomId('ticket:delete').setLabel('Закрыть тикет').setStyle(ButtonStyle.Danger),
        config.emojis.hwt_delete || config.emojis.no
      )
    )
  ];
}

function buildMclThreadComponents(event, config = {}) {
  return [
    new ActionRowBuilder().addComponents(
      maybeSetButtonEmoji(
        new ButtonBuilder().setCustomId(`event:tagall:${event.id}`).setLabel('Тегнуть всех').setStyle(ButtonStyle.Primary),
        config.emojis?.hwt_tag || config.emojis?.hwt_roster || config.emojis?.list
      ),
      maybeSetButtonEmoji(
        new ButtonBuilder().setCustomId(`event:tagnovoice:${event.id}`).setLabel('Тех кого нет в войсе').setStyle(ButtonStyle.Secondary),
        config.emojis?.hwt_no_voice || config.emojis?.hwt_voice || config.emojis?.voice
      ),
      maybeSetButtonEmoji(
        new ButtonBuilder().setCustomId(`event:request-replays:${event.id}`).setLabel('Запросить откаты').setStyle(ButtonStyle.Secondary),
        config.emojis?.hwt_replay
      ),
      maybeSetButtonEmoji(
        new ButtonBuilder().setCustomId(`event:leave:${event.id}`).setLabel('Выписаться (-)').setStyle(ButtonStyle.Danger),
        config.emojis?.hwt_delete || config.emojis?.hwt_reject || config.emojis?.no
      )
    )
  ];
}

function getEventRosterUserIds(event) {
  return [...new Set([...ensureArray(event.main), ...ensureArray(event.reserve)])];
}

function getUsersNotInRequesterVoice(interaction, userIds) {
  const voiceChannelId = interaction.member?.voice?.channelId;
  if (!voiceChannelId) {
    return {
      ok: false,
      message: 'Чтобы тегнуть тех, кого нет в войсе, сначала зайдите в нужный голосовой канал.'
    };
  }

  return {
    ok: true,
    userIds: userIds.filter((userId) => interaction.guild.voiceStates.cache.get(userId)?.channelId !== voiceChannelId)
  };
}

function buildMentionChunks(config, userIds, prefixText) {
  const mentions = userIds.map((id) => memberTag(id));
  const prefix = `${emojiText(config, 'hwt_tag', emojiText(config, 'hwt_roster', emojiText(config, 'list', '📋')))} ${prefixText}`;
  const chunks = [];
  let current = prefix;

  for (const mention of mentions) {
    const next = `${current} ${mention}`;
    if (next.length > 1900) {
      chunks.push(current);
      current = `${prefix} ${mention}`;
    } else {
      current = next;
    }
  }

  if (current.trim() !== prefix.trim()) {
    chunks.push(current);
  }
  return chunks;
}

async function sendEventMentions(interaction, config, userIds, prefixText, replyText) {
  const targetChannel = interaction.channel;
  if (!targetChannel?.isTextBased()) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Не удалось найти канал для тега списка.' });
    return;
  }

  await interaction.reply({ flags: MessageFlags.Ephemeral, content: replyText });
  for (const content of buildMentionChunks(config, userIds, prefixText)) {
    await targetChannel.send({ content });
  }
}

function buildEventRosterEmbed(config, event) {
  const description = event.type === 'capt' ? buildCaptDescription(config, event) : buildMclDescriptionV2(config, event);
  return createEmbed(config, {
    title: event.type === 'capt'
      ? `${emojiText(config, 'hwt_capt', '')} ${event.mode}`.trim()
      : `${emojiText(config, 'hwt_mcl', '')} ${event.mode}, ${event.timeText || event.whenText || ''}`.trim(),
    description,
    fields: buildEventRosterFields(config, event)
  });
}

function buildEventRosterPayload(config, event) {
  return componentsV2PayloadFromEmbed(config, buildEventRosterEmbed(config, event), buildMclThreadComponents(event, config), {
    includeDefaultImage: false
  });
}

function buildTicketApplicationPayload(config, values, userId, options = {}) {
  const embed = createEmbed(config, {
    title: `${emojiText(config, 'hwt_apply', '✦')} Заявка в семью ${config.ticket.serverName}`,
    description: [
      `**Игрок:** ${memberTag(userId)}`,
      `**Игровой ник:** ${values.nickname}`,
      `**Возраст:** ${values.age}`,
      `**Опыт:** ${values.experience}`,
      values.replays ? `**Откаты CAPT/MCL:** ${values.replays}` : null,
      `**О себе:** ${values.about}`
    ].filter(Boolean).join('\n'),
    image: imageFor(config, 'ticketPanel'),
    timestamp: true
  });

  const intro = options.ping === false
    ? memberTag(userId)
    : [memberTag(userId), mentionRoles(config.roles.recruits)].filter(Boolean).join(' ');

  return componentsV2PayloadFromEmbed(config, embed, buildTicketStaffComponents(config), {
    intro,
    allowedMentions: {
      users: options.ping === false ? [] : [userId],
      roles: options.ping === false ? [] : ensureArray(config.roles.recruits)
    }
  });
}

function simpleV2Payload(config, options = {}) {
  const embed = createEmbed(config, {
    title: options.title,
    description: options.description,
    color: options.color ?? config.theme.accent,
    image: options.image || (options.imageKey ? imageFor(config, options.imageKey) : null),
    thumbnail: options.thumbnail || null,
    fields: options.fields,
    footer: options.footer,
    timestamp: options.timestamp
  });

  return componentsV2PayloadFromEmbed(config, embed, options.components || [], {
    includeDefaultImage: options.includeDefaultImage ?? false,
    intro: options.intro,
    allowedMentions: options.allowedMentions,
    ephemeral: options.ephemeral
  });
}

function removeFromEventRosters(event, userId) {
  event.main = ensureArray(event.main).filter((id) => id !== userId);
  event.reserve = ensureArray(event.reserve).filter((id) => id !== userId);
  if (event.assignments) {
    removeFromAllAssignments(event.assignments, userId);
  }
}

function addEventLeaver(event, userId, action, actorId = null) {
  event.leavers = ensureArray(event.leavers).filter((entry) => entry.userId !== userId);
  event.leavers.push({
    userId,
    action,
    actorId,
    createdAt: new Date().toISOString()
  });
  event.leavers = event.leavers.slice(-25);
}

function removeEventLeaver(event, userId) {
  event.leavers = ensureArray(event.leavers).filter((entry) => entry.userId !== userId);
}

function placeEventMember(event, userId, targetList) {
  removeFromEventRosters(event, userId);
  removeEventLeaver(event, userId);

  if (targetList === 'main' && ensureArray(event.main).length < event.slots) {
    event.main.push(userId);
    return 'main';
  }

  event.reserve = [...new Set([...ensureArray(event.reserve), userId])];
  return 'reserve';
}

function isEventRosterEmoji(reaction, config, event) {
  const isMain = reaction.emoji.name === '✅' || emojiMatches(reaction.emoji, config.emojis.done);
  const reserveEmoji = event.type === 'capt'
    ? (config.capt.reserveEmoji || '🦁')
    : (config.emojis.weekend || config.capt.reserveEmoji || '🦁');
  const isReserve = reaction.emoji.name === '🦁' || emojiMatches(reaction.emoji, reserveEmoji);
  return { isMain, isReserve };
}

function parseManualPlusTargetId(content) {
  const match = String(content || '').trim().match(/^\+\s+<@!?(\d+)>\s*$/);
  return match ? match[1] : null;
}

function findTrackedPlusUserId(event, messageId) {
  return Object.entries(event?.plusMessages || {}).find(([, trackedMessageId]) => trackedMessageId === messageId)?.[0] || null;
}

async function getManualPlusTargetIdFromMessage(message, config) {
  const targetId = parseManualPlusTargetId(message.content);
  if (!targetId) {
    return null;
  }

  const authorMember = message.member || await message.guild?.members.fetch(message.author?.id).catch(() => null);
  return authorMember && hasAnyRole(authorMember, config.roles.highrank) ? targetId : null;
}

async function reactWithDone(message, config) {
  await message.react(config.emojis?.done || '✅').catch(async () => {
    await message.react('✅').catch(() => {});
  });
}

async function resolveEventReactionContext(reaction, user, config, store) {
  if (user.bot) {
    return null;
  }

  if (reaction.partial) {
    await reaction.fetch();
  }
  if (reaction.message.partial) {
    await reaction.message.fetch();
  }

  const events = store.load('events', {});
  const event = Object.values(events).find((entry) => entry.threadId === reaction.message.channelId && (entry.type === 'capt' || entry.type === 'mcl'));
  if (!event) {
    return null;
  }

  const guildMember = await reaction.message.guild.members.fetch(user.id).catch(() => null);
  if (!guildMember || !hasAnyRole(guildMember, config.roles.highrank)) {
    return null;
  }

  const content = reaction.message.content?.trim?.() || '';
  const manualTargetId = await getManualPlusTargetIdFromMessage(reaction.message, config);
  if (content !== '+' && !manualTargetId) {
    return null;
  }

  const { isMain, isReserve } = isEventRosterEmoji(reaction, config, event);
  if (!isMain && !isReserve) {
    return null;
  }

  const applicantId = manualTargetId || reaction.message.author.id;
  event.plusMessages = event.plusMessages || {};
  const trackedMessageId = event.plusMessages[applicantId];
  if (trackedMessageId && trackedMessageId !== reaction.message.id) {
    return null;
  }

  if (!trackedMessageId) {
    event.plusMessages[applicantId] = reaction.message.id;
    events[event.id] = event;
    store.save('events', events);
  }

  return { events, event, applicantId, isMain, isReserve };
}

async function sendBotActivityLog(client, config, title, description, color = config.theme.accent) {
  await sendLog(client, config.logs.bot, {
    embeds: [
      createEmbed(config, {
        title,
        color,
        description,
        timestamp: true
      })
    ]
  });
}

async function sendProfileLog(client, config, title, description, color = config.theme.accent) {
  await sendLog(client, config.logs.profile || config.logs.bot, {
    embeds: [
      createEmbed(config, {
        title,
        color,
        description,
        timestamp: true
      })
    ]
  });
}

async function sendTicketActionLog(client, config, title, ticket, actorId, extraLines = [], color = config.theme.accent) {
  const lines = [
    `**Кандидат:** ${memberTag(ticket.userId)}`,
    `**Сотрудник:** ${memberTag(actorId)}`,
    `**Канал:** <#${ticket.channelId}>`,
    ...extraLines,
    `**Время:** ${formatDate()}`
  ].filter(Boolean);

  const payload = {
    embeds: [
      createEmbed(config, {
        title,
        color,
        description: lines.join('\n'),
        timestamp: true
      })
    ]
  };

  await sendLog(client, config.logs.ticket || config.logs.bot, payload);
}

async function sendEventRosterDm(client, event, userId, action, placedList = null) {
  const user = await client.users.fetch(userId).catch(() => null);
  if (!user) {
    return;
  }

  const eventType = event.type === 'capt' ? 'CAPT' : 'MCL';
  const eventName = [event.mode, event.whenText || [event.dateText, event.timeText].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  const listText = placedList === 'reserve' ? 'резерв' : 'основной состав';
  const message = action === 'join'
    ? `Вы записаны в ${listText} на ${eventType}${eventName ? `: ${eventName}` : ''}.`
    : `Вы выписаны из списка на ${eventType}${eventName ? `: ${eventName}` : ''}.`;

  await user.send(simpleV2Payload(configRef.value || {}, {
    title: action === 'join'
      ? `${emojiText(configRef.value || {}, 'hwt_check', '✅')} Запись на сбор`
      : `${emojiText(configRef.value || {}, 'hwt_delete', emojiText(configRef.value || {}, 'hwt_warn', '↩'))} Выписка со сбора`,
    description: message,
    color: action === 'join' ? (configRef.value?.theme?.success || 0x57f287) : (configRef.value?.theme?.danger || 0xe02b2b)
  })).catch(() => {});
}

function eventTitleForMessage(event) {
  return [
    event.type === 'capt' ? 'CAPT' : 'MCL',
    event.mode,
    event.opponent ? `vs ${event.opponent}` : null,
    event.serverName,
    event.whenText || [event.dateText, event.timeText].filter(Boolean).join(' ')
  ].filter(Boolean).join(', ');
}

function discordMessageUrl(guildId, channelId, messageId) {
  if (!guildId || !channelId || !messageId) {
    return null;
  }

  return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}

function replayLogChannelId(config) {
  return config.replays?.requestChannelId || config.replays?.replayRequestChannelId || config.logs?.replay || "";
}

function replayLogThreadName(event) {
  const type = event.type === 'capt' ? 'CAPT' : 'MCL';
  const timeText = event.whenText || [event.dateText, event.timeText].filter(Boolean).join(' ');
  const mode = event.mode || type;
  const shouldPrefixType = event.type === 'capt' && mode.toLowerCase() !== type.toLowerCase();
  const name = [shouldPrefixType ? type : null, mode, timeText].filter(Boolean).join(', ');
  return name.replace(/\s+/g, ' ').trim().slice(0, 90) || `${type} откаты`;
}

function replayLogRequestMessageContent(event) {
  const title = replayLogThreadName(event);
  return `# ${title}`;
}

async function ensureReplayLogThread(client, config, store, event, options = {}) {
  if (!options.forceNew && event.replayRequestLogThreadId) {
    const storedThread = await client.channels.fetch(event.replayRequestLogThreadId).catch(() => null);
    if (storedThread?.isThread?.() && storedThread.isTextBased?.()) {
      return storedThread;
    }
  }

  const targetChannel = await client.channels.fetch(replayLogChannelId(config)).catch(() => null);
  if (!targetChannel?.isTextBased?.() || !targetChannel.threads?.create) {
    return null;
  }

  const anchorMessage = await targetChannel.send({
    content: replayLogRequestMessageContent(event)
  }).catch(() => null);
  if (!anchorMessage) {
    return null;
  }

  const thread = await anchorMessage.startThread({
    name: replayLogThreadName(event),
    autoArchiveDuration: 1440,
    reason: 'Replay request thread'
  }).catch(() => null);
  if (!thread) {
    return null;
  }

  const events = store.load('events', {});
  const latestEvent = events[event.id] || event;
  latestEvent.replayRequestLogThreadId = thread.id;
  latestEvent.replayRequestLogThreadName = thread.name;
  latestEvent.replayRequestLogMessageId = anchorMessage.id;
  events[event.id] = latestEvent;
  store.save('events', events);
  event.replayRequestLogThreadId = thread.id;
  event.replayRequestLogThreadName = thread.name;
  event.replayRequestLogMessageId = anchorMessage.id;

  return thread;
}

function collectActiveReplayRequests(events, userId) {
  const active = [];
  const now = Date.now();

  for (const event of Object.values(events || {})) {
    const request = event?.replayRequests?.[userId];
    if (!request?.requestedAt) {
      continue;
    }
    if (request.submittedAt || request.consumedAt) {
      continue;
    }

    const requestedAtMs = new Date(request.requestedAt).getTime();
    if (!Number.isFinite(requestedAtMs) || now - requestedAtMs > REPLAY_REQUEST_TTL_MS) {
      continue;
    }

    active.push({ event, request, requestedAtMs });
  }

  return active.sort((a, b) => b.requestedAtMs - a.requestedAtMs);
}

function findActiveReplayRequest(events, userId, message = null) {
  const active = collectActiveReplayRequests(events, userId);
  const replyMessageId = message?.reference?.messageId || message?.reference?.message_id || null;
  if (replyMessageId) {
    const matched = active.find(({ request }) => request.dmMessageId === replyMessageId);
    if (matched) {
      return { event: matched.event, request: matched.request };
    }
  }

  if (active.length === 1 && !active[0].request.dmMessageId) {
    return { event: active[0].event, request: active[0].request };
  }

  return null;
}

function replayRequestPendingUserIds(event) {
  return Object.entries(event?.replayRequests || {})
    .filter(([, request]) => request?.requestedAt && !request.submittedAt && !request.consumedAt)
    .map(([userId]) => userId);
}

function buildReplayRequestStatusEmbed(config, event) {
  const pendingUserIds = replayRequestPendingUserIds(event);
  const completedCount = Object.keys(event?.completedReplayRequests || {}).length;
  const pendingLines = pendingUserIds.length
    ? pendingUserIds.slice(0, 60).map((userId, index) => `${index + 1}. ${memberTag(userId)}`)
    : ['Все отправили откаты.'];

  if (pendingUserIds.length > 60) {
    pendingLines.push(`...и еще ${pendingUserIds.length - 60}`);
  }

  return createEmbed(config, {
    title: 'Статус откатов',
    color: pendingUserIds.length ? config.theme.danger : config.theme.success,
    description: [
      `**Сбор:** ${eventTitleForMessage(event)}`,
      `**Отправили:** ${completedCount}`,
      `**Не отправили:** ${pendingUserIds.length}`,
      '',
      pendingLines.join('\n')
    ].join('\n'),
    timestamp: true
  });
}

function canRequestEventReplays(member, config) {
  return hasAnyRole(member, [
    ...ensureArray(config.roles?.highrank),
    ...ensureArray(config.replays?.reviewerRoleIds),
    config.roles?.main || "" || ""
  ]);
}

async function updateReplayRequestStatusMessage(client, config, store, event) {
  if (!event?.threadId) {
    return;
  }

  const thread = await client.channels.fetch(event.threadId).catch(() => null);
  if (!thread?.isTextBased?.()) {
    return;
  }

  const payload = { embeds: [buildReplayRequestStatusEmbed(config, event)] };
  let statusMessage = event.replayRequestStatusMessageId
    ? await thread.messages.fetch(event.replayRequestStatusMessageId).catch(() => null)
    : null;

  if (statusMessage) {
    await statusMessage.edit(payload).catch(() => {});
    return;
  }

  statusMessage = await thread.send(payload).catch(() => null);
  if (!statusMessage) {
    return;
  }

  const events = store.load('events', {});
  const latestEvent = events[event.id] || event;
  latestEvent.replayRequestStatusMessageId = statusMessage.id;
  events[event.id] = latestEvent;
  store.save('events', events);
  event.replayRequestStatusMessageId = statusMessage.id;
}

async function handleReplayRequestDm(message, config, store, client) {
  if (message.author.bot || message.guildId) {
    return false;
  }

  const events = store.load('events', {});
  const active = findActiveReplayRequest(events, message.author.id, message);
  if (!active) {
    if (collectActiveReplayRequests(events, message.author.id).length > 0) {
      await message.reply(simpleV2Payload(config, {
        title: `${emojiText(config, 'hwt_warn', '⚠️')} Нужен ответ на запрос`,
        description: 'Ответьте именно на сообщение с нужным запросом отката, чтобы я отправил его в правильную ветку.',
        color: config.theme.danger
      })).catch(() => {});
      return true;
    }
    return false;
  }

  const { event, request } = active;
  const targetThread = await ensureReplayLogThread(client, config, store, event);
  if (!targetThread?.isTextBased?.()) {
    await message.reply(simpleV2Payload(config, {
      title: `${emojiText(config, 'hwt_warn', '⚠️')} Не удалось отправить`,
      description: 'Откат получил, но не смог отправить его в ветку проверки. Сообщите администрации.',
      color: config.theme.danger
    })).catch(() => {});
    return true;
  }

  const attachments = [...message.attachments.values()].map((attachment) => attachment.url);
  const text = message.content?.trim();
  const replayLines = [text, ...attachments].filter(Boolean);
  const eventUrl = request.messageUrl || discordMessageUrl(config.guildId, event.channelId, event.messageId || event.id);
  const threadUrl = event.threadId ? discordMessageUrl(config.guildId, event.threadId, event.listMessageId || event.threadId) : null;

  await targetThread.send({
    embeds: [
      createEmbed(config, {
        title: 'Откат по запросу',
        color: config.theme.accent,
        description: [
          `**Игрок:** ${memberTag(message.author.id)} (${message.author.tag})`,
          replayLines.length ? `**Откат:** ${replayLines.join('\n')}` : null,
          eventUrl ? `**Сообщение сбора:** ${eventUrl}` : null,
          threadUrl ? `**Ветка сбора:** <#${event.threadId}>` : null,
          request.requestedById ? `**Кто запросил:** ${memberTag(request.requestedById)}` : null
        ].filter(Boolean).join('\n'),
        timestamp: false
      })
    ]
  });

  delete event.replayRequests[message.author.id];
  event.completedReplayRequests = event.completedReplayRequests || {};
  event.completedReplayRequests[message.author.id] = {
    ...request,
    submittedAt: new Date().toISOString(),
    lastMessageId: message.id
  };
  events[event.id] = event;
  store.save('events', events);
  await updateReplayRequestStatusMessage(client, config, store, event);

  await message.reply(simpleV2Payload(config, {
    title: `${emojiText(config, 'hwt_replay', emojiText(config, 'hwt_check', '✅'))} Откат получен`,
    description: 'Откат получил и отправил в канал проверки.',
    color: config.theme.success
  })).catch(() => {});
  return true;
}

async function requestEventReplays(interaction, config, store, client, eventId) {
  if (!canRequestEventReplays(interaction.member, config)) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Недостаточно прав для запроса откатов.' });
    return;
  }

  const events = store.load('events', {});
  const event = events[eventId];
  if (!event || (event.type !== 'mcl' && event.type !== 'capt')) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Событие не найдено.' });
    return;
  }

  if (interaction.channelId !== event.threadId) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Запросить откаты можно только в ветке: <#${event.threadId}>.` });
    return;
  }

  const users = [...new Set([...ensureArray(event.main), ...ensureArray(event.reserve)])];
  if (!users.length) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Список регистрации пока пуст.' });
    return;
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const targetThread = await ensureReplayLogThread(client, config, store, event, { forceNew: true });
  if (!targetThread) {
    await interaction.editReply({ content: 'Не удалось создать ветку для откатов в канале проверки. Проверьте права бота на создание веток.' });
    return;
  }

  const messageUrl = discordMessageUrl(interaction.guildId, event.channelId, event.messageId || event.id);
  const eventTitle = eventTitleForMessage(event);
  const requestedAt = new Date().toISOString();
  event.replayRequests = {};
  event.completedReplayRequests = {};
  let sent = 0;
  let failed = 0;

  for (const userId of users) {
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) {
      failed += 1;
      continue;
    }

    const dmMessage = await user.send(simpleV2Payload(config, {
      title: `${emojiText(config, 'hwt_replay', '🎥')} Запрос отката`,
      description: [
        `Нужен откат по сбору: **${eventTitle}**.`,
        messageUrl ? `Сообщение сбора: ${messageUrl}` : null,
        event.threadId ? `Ветка сбора: <#${event.threadId}>` : null,
        '',
        `Отправьте ссылку на откат ответом на это сообщение. Я передам ее в ветку проверки: <#${targetThread.id}>.`
      ].filter(Boolean).join('\n'),
      color: config.theme.accent
    })).catch(() => null);

    if (dmMessage) {
      event.replayRequests[userId] = {
        requestedAt,
        requestedById: interaction.user.id,
        messageUrl,
        threadId: event.threadId,
        logThreadId: targetThread.id,
        dmMessageId: dmMessage.id
      };
      sent += 1;
    } else {
      failed += 1;
    }
  }

  event.lastReplayRequestAt = new Date().toISOString();
  event.lastReplayRequestById = interaction.user.id;
  events[event.id] = event;
  store.save('events', events);
  await updateReplayRequestStatusMessage(client, config, store, event);

  await interaction.editReply({
    content: `Запрос откатов отправлен: ${sent}. Не удалось отправить: ${failed}. Ветка проверки: <#${targetThread.id}>.`
  });
}

async function sendLeaveEphemeralV2(interaction, config, store) {
  const leaves = store.load('leaves', {});
  const embed = createEmbed(config, {
    title: `${emojiText(config, 'hwt_afk', emojiText(config, 'weekend', ''))} Подать заявку на отпуск`,
    description: [
      'Если нужен перерыв от игры, оформите отпуск здесь.',
      '',
      'При отправке формы у вас будут сняты активные роли и выдана роль неактива.',
      'Когда будете готовы вернуться, нажмите кнопку возврата.',
      '',
      '**Сейчас в отпуске**',
      buildLeaveList(leaves)
    ].join('\n'),
    image: imageFor(config, 'leaveCard')
  });

  await interaction.reply(componentsV2PayloadFromEmbed(config, embed, [
      new ActionRowBuilder().addComponents(
        maybeSetButtonEmoji(
          new ButtonBuilder().setCustomId('leave:open-modal').setLabel('Взять отпуск').setStyle(ButtonStyle.Secondary),
          config.emojis.hwt_afk || config.emojis.weekend
        ),
        maybeSetButtonEmoji(
          new ButtonBuilder().setCustomId('leave:return').setLabel('Вернуться').setStyle(ButtonStyle.Secondary),
          config.emojis.hwt_refresh || config.emojis.hwt_check || config.emojis.done
        )
      ),
      ...buildDismissRow(config)
    ], { ephemeral: true }));
}

async function sendLeaveEphemeral(interaction, config) {
  const embed = createEmbed(config, {
    title: `${emojiText(config, 'hwt_afk', emojiText(config, 'weekend', ''))} Подать заявку на отпуск`,
    description: [
      'Если нужен перерыв от игры, оформите отпуск здесь.',
      '',
      'При отправке формы у вас будут сняты активные роли и выдана роль неактива.',
      'Когда будете готовы вернуться, нажмите кнопку возврата.'
    ].join('\n'),
    thumbnail: config.images.leaveCard || null
  });

  await interaction.reply(componentsV2PayloadFromEmbed(config, embed, [
      new ActionRowBuilder().addComponents(
        maybeSetButtonEmoji(
          new ButtonBuilder().setCustomId('leave:open-modal').setLabel('Взять отпуск').setStyle(ButtonStyle.Secondary),
          config.emojis.hwt_afk || config.emojis.weekend
        ),
        maybeSetButtonEmoji(
          new ButtonBuilder().setCustomId('leave:return').setLabel('Вернуться').setStyle(ButtonStyle.Secondary),
          config.emojis.hwt_refresh || config.emojis.hwt_check || config.emojis.done
        )
      ),
      ...buildDismissRow(config)
    ], { ephemeral: true }));
}

async function sendProfileEphemeralV2(interaction, config, store) {
  const { profile, channel } = await resolveProfileRecord(interaction.guild, store, interaction.user.id);
  const hasValidChannel = Boolean(channel);
  if (hasValidChannel) {
    await channel.permissionOverwrites
      .set(buildProfilePermissionOverwrites(interaction.guild, store.load('settings', settingsDefaults(config)), interaction.user.id, config), 'Refresh profile access roles')
      .catch(() => {});
    await ensureProfileActionMessage(channel, config, store, profile).catch(() => {});
  }
  const description = hasValidChannel
    ? [
        'Личный профиль уже создан.',
        '',
        `Канал: <#${channel.id}>`
      ].join('\n')
    : profile
      ? [
          'Старый личный канал больше не найден.',
          'Ниже можно создать новый профиль заново.',
        ].join('\n')
      : [
          'Создайте личный приватный канал для отчетов и откатов.',
          'Доступ получат только вы и роли, указанные в настройках бота.'
        ].join('\n');

  const embed = createEmbed(config, {
    title: `${emojiText(config, 'hwt_profile', emojiText(config, 'profile', ''))} Создание профиля`,
    description,
    image: imageFor(config, 'profileCard')
  });

  await interaction.reply(componentsV2PayloadFromEmbed(config, embed, [
      new ActionRowBuilder().addComponents(
        maybeSetButtonEmoji(
          new ButtonBuilder()
            .setCustomId('profile:create')
            .setLabel(hasValidChannel ? 'Открыть профиль' : 'Создать профиль')
            .setStyle(ButtonStyle.Secondary),
          config.emojis.hwt_profile || config.emojis.profile
        ),
        maybeSetButtonEmoji(
          new ButtonBuilder()
            .setCustomId('profile:recreate')
            .setLabel('Пересоздать профиль')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!profile),
          config.emojis.hwt_refresh || config.emojis.no
        )
      ),
      ...buildDismissRow(config)
    ], { ephemeral: true }));
}

async function sendProfileEphemeral(interaction, config, store) {
  const profiles = store.load('profiles', {});
  const profile = profiles[interaction.user.id];
  const description = profile?.channelId
    ? [
        'Личный профиль уже создан.',
        '',
        `Канал: <#${profile.channelId}>`
      ].join('\n')
    : [
        'Создайте личный приватный канал для отчетов и откатов.',
        'Доступ получат только вы и роли, указанные в настройках бота.'
      ].join('\n');

  const embed = createEmbed(config, {
    title: `${emojiText(config, 'hwt_profile', emojiText(config, 'profile', ''))} Создание профиля`,
    description,
    thumbnail: config.images.profileCard || null
  });

  await interaction.reply(componentsV2PayloadFromEmbed(config, embed, [
      new ActionRowBuilder().addComponents(
        maybeSetButtonEmoji(
          new ButtonBuilder()
            .setCustomId('profile:create')
            .setLabel(profile ? 'Открыть профиль' : 'Создать профиль')
            .setStyle(ButtonStyle.Secondary),
          config.emojis.hwt_profile || config.emojis.profile
        )
      ),
      ...buildDismissRow(config)
    ], { ephemeral: true }));
}

async function sendReportEphemeral(interaction, config) {
  const embed = createEmbed(config, {
    title: `${emojiText(config, 'hwt_check', emojiText(config, 'magic1', ''))} Скрины ГГ`,
    description: [
      'После отправки скрин автоматически попадет в вашу профильную ветку.'
    ].join('\n'),
    thumbnail: config.images.reportCard || null
  });

  await interaction.reply(componentsV2PayloadFromEmbed(config, embed, [
      new ActionRowBuilder().addComponents(
        maybeSetButtonEmoji(
          new ButtonBuilder().setCustomId('report:gg').setLabel('Подать Скрин ГГ').setStyle(ButtonStyle.Secondary),
          config.emojis.hwt_check || config.emojis.done
        )
      ),
      ...buildDismissRow(config)
    ], { ephemeral: true }));
}

async function openModal(interaction, options) {
  const modal = new ModalBuilder().setCustomId(options.id).setTitle(options.title);
  for (const input of options.inputs) {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(input.id)
          .setLabel(input.label)
          .setStyle(input.style || TextInputStyle.Short)
          .setRequired(input.required ?? true)
          .setPlaceholder(input.placeholder || '')
          .setValue(input.value || '')
      )
    );
  }
  try {
    await interaction.showModal(modal);
  } catch (error) {
    // Discord interaction tokens expire quickly; also showModal can fail if interaction
    // was already acknowledged elsewhere. In both cases we just ignore the attempt.
    if (error?.code === 10062 || error?.code === 40060 || error?.code === 'InteractionAlreadyAcknowledged') {
      return;
    }
    throw error;
  }
}

async function createTicket(interaction, config, store, values) {
  const tickets = store.load('tickets', ticketsDefaults());
  const { ticket: existingTicket, changed } = await findBlockingTicketForUser(interaction.guild, tickets, interaction.user.id);
  if (changed) {
    store.save('tickets', tickets);
  }
  if (existingTicket) {
    return { alreadyExists: true, channelId: existingTicket.channelId };
  }

  const channel = await interaction.guild.channels.create({
    name: `ticket-${sanitizeName(interaction.user.username)}`,
    type: ChannelType.GuildText,
    parent: config.categories.tickets,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      },
      ...ensureArray(config.roles.ticketAccess).map((roleId) => ({
        id: roleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      }))
    ]
  });

  tickets[channel.id] = {
    channelId: channel.id,
    userId: interaction.user.id,
    nickname: values.nickname,
    age: values.age,
    experience: values.experience,
    about: values.about,
    createdAt: new Date().toISOString(),
    status: 'open'
  };
  store.save('tickets', tickets);

  await channel.send({
    content: `${memberTag(interaction.user.id)} заявка создана.`,
    embeds: [
      createEmbed(config, {
        title: `${emojiText(config, 'hwt_apply', emojiText(config, 'magic1', ''))} Заявка в семью ${config.ticket.serverName}`,
        description: [
          `**Игровой ник:** ${values.nickname}`,
          `**Возраст:** ${values.age}`,
          `**Опыт:** ${values.experience}`,
          `**О себе:** ${values.about}`
        ].join('\n'),
        timestamp: true
      })
    ]
  });

  return { alreadyExists: false, channelId: channel.id };
}

async function acceptTicket(interaction, config, store, client) {
  if (!canManageTickets(interaction.member, config)) {
    return { ok: false, message: 'Недостаточно прав для принятия заявки.' };
  }

  const tickets = store.load('tickets', ticketsDefaults());
  const ticket = tickets[interaction.channelId];
  if (!ticket) {
    return { ok: false, message: 'Эта команда работает только в канале заявки.' };
  }

  if (ticket.status === 'accepted') {
    return { ok: false, message: 'Эта заявка уже принята.' };
  }

  const note = interaction.options.getString('note') || '';
  const selectedRole = interaction.options.getRole('role');
  const roleIdToGive = selectedRole?.id || config.roles.test || null;

  let roleResult = 'Роль не выдавалась.';
  const applicantMember = await interaction.guild.members.fetch(ticket.userId).catch(() => null);
  if (applicantMember && roleIdToGive && interaction.guild.roles.cache.has(roleIdToGive)) {
    if (!applicantMember.roles.cache.has(roleIdToGive)) {
      await applicantMember.roles.add(roleIdToGive, 'Ticket accepted via HEAVYWEIGHT bot');
    }
    roleResult = `Выдана роль ${roleTag(roleIdToGive)}.`;
  } else if (roleIdToGive) {
    roleResult = `Роль ${roleIdToGive} не найдена на сервере.`;
  }

  ticket.status = 'accepted';
  ticket.acceptedById = interaction.user.id;
  ticket.acceptedAt = new Date().toISOString();
  ticket.acceptNote = note;
  ticket.acceptedRoleId = roleIdToGive;
  tickets[interaction.channelId] = ticket;
  store.save('tickets', tickets);

  await interaction.channel.send({
    embeds: [
      createEmbed(config, {
        title: `${emojiText(config, 'hwt_check', emojiText(config, 'done', ''))} Заявка принята`,
        color: config.theme.success,
        description: [
          `**Кандидат:** ${memberTag(ticket.userId)}`,
          `**Принял:** ${memberTag(interaction.user.id)}`,
          roleIdToGive ? `**Роль:** ${roleTag(roleIdToGive)}` : null,
          note ? `**Комментарий:** ${note}` : null,
          `**Время:** ${formatDate()}`
        ].filter(Boolean).join('\n'),
        timestamp: true
      })
    ]
  });

  await sendTicketAcceptLog(client, config, ticket, interaction.user.id, note, roleIdToGive);

  return {
    ok: true,
    message: `${memberTag(ticket.userId)} принят. ${roleResult}`
  };
}

async function createTicketV2(interaction, config, store, values, client) {
  const tickets = store.load('tickets', ticketsDefaults());
  const { ticket: existingTicket, changed } = await findBlockingTicketForUser(interaction.guild, tickets, interaction.user.id);
  if (changed) {
    store.save('tickets', tickets);
  }
  if (existingTicket) {
    return { alreadyExists: true, channelId: existingTicket.channelId };
  }

  const channel = await interaction.guild.channels.create({
    name: `ticket-${sanitizeName(interaction.user.username)}`,
    type: ChannelType.GuildText,
    parent: config.categories.tickets,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      },
      ...ensureArray(config.roles.ticketAccess).map((roleId) => ({
        id: roleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
      }))
    ]
  });

  const ticket = {
    channelId: channel.id,
    userId: interaction.user.id,
    nickname: values.nickname,
    age: values.age,
    experience: values.experience,
    replays: values.replays || '',
    about: values.about,
    createdAt: new Date().toISOString(),
    status: 'open'
  };
  tickets[channel.id] = ticket;
  store.save('tickets', tickets);

  await channel.send(buildTicketApplicationPayload(config, values, interaction.user.id));

  await sendTicketActionLog(
    client,
    config,
    `${emojiText(config, 'hwt_apply', emojiText(config, 'magic1', ''))} Создана заявка`,
    ticket,
    interaction.user.id,
    [
      `**Ник:** ${values.nickname}`,
      `**Возраст:** ${values.age}`,
      values.replays ? `**Откаты:** ${values.replays}` : null
    ],
    config.theme.accent
  );

  return { alreadyExists: false, channelId: channel.id };
}

async function acceptTicketByChoice(interaction, config, store, client, choice) {
  if (!canManageTickets(interaction.member, config)) {
    return { ok: false, message: 'Недостаточно прав для принятия заявки.' };
  }

  const tickets = store.load('tickets', ticketsDefaults());
  const ticket = tickets[interaction.channelId];
  if (!ticket) {
    return { ok: false, message: 'Это действие работает только в канале заявки.' };
  }
  if (ticket.status === 'accepted') {
    return { ok: false, message: 'Эта заявка уже принята.' };
  }
  if (ticket.status === 'rejected') {
    return { ok: false, message: 'Эта заявка уже отклонена.' };
  }

  const roleMeta = TICKET_ACCEPT_ROLES[choice] || TICKET_ACCEPT_ROLES.main;
  const roleIdToGive = config.roles[roleMeta.roleConfigKey] || '';
  let roleResult = 'Роль не выдана.';

  const applicantMember = await interaction.guild.members.fetch(ticket.userId).catch(() => null);
  if (applicantMember && roleIdToGive && interaction.guild.roles.cache.has(roleIdToGive)) {
    if (!applicantMember.roles.cache.has(roleIdToGive)) {
      await applicantMember.roles.add(roleIdToGive, 'Ticket accepted via HEAVYWEIGHT bot');
    }
    roleResult = `Выдана роль ${roleTag(roleIdToGive)}.`;
  }

  ticket.status = 'accepted';
  ticket.acceptedById = interaction.user.id;
  ticket.acceptedAt = new Date().toISOString();
  ticket.acceptedRoleId = roleIdToGive || null;
  ticket.acceptChoice = choice;
  tickets[interaction.channelId] = ticket;
  store.save('tickets', tickets);

  await interaction.channel.send(simpleV2Payload(config, {
    title: `${emojiText(config, 'hwt_check', emojiText(config, 'done', ''))} Заявка принята`,
    color: config.theme.success,
    description: [
      `**Кандидат:** ${memberTag(ticket.userId)}`,
      `**Принял:** ${memberTag(interaction.user.id)}`,
      `**Выдана роль:** ${ticketAcceptChoiceText(config, choice)}`,
      `**Время:** ${formatDate()}`
    ].join('\n'),
    timestamp: true
  }));

  await sendTicketActionLog(
    client,
    config,
    `${emojiText(config, 'hwt_check', emojiText(config, 'done', ''))} Заявка принята`,
    ticket,
    interaction.user.id,
    [
      `**Выдана роль:** ${ticketAcceptChoiceText(config, choice)}`,
      roleIdToGive ? `**ID роли:** ${roleTag(roleIdToGive)}` : null
    ],
    config.theme.success
  );

  if (applicantMember) {
    await applicantMember.send(simpleV2Payload(config, {
    title: `${emojiText(config, 'hwt_accept', emojiText(config, 'hwt_check', '✅'))} Заявка принята`,
      description: [
        `Ваша заявка в **${interaction.guild.name}** принята.`,
        `Выдана роль: ${ticketAcceptChoiceText(config, choice)}`
      ].join('\n'),
      color: config.theme.success
    })).catch(() => {});
  }

  return { ok: true, message: `${memberTag(ticket.userId)} принят. ${roleResult}` };
}

async function rejectTicket(interaction, config, store, client, reason) {
  if (!canManageTickets(interaction.member, config)) {
    return { ok: false, message: 'Недостаточно прав для отклонения заявки.' };
  }

  const tickets = store.load('tickets', ticketsDefaults());
  const ticket = tickets[interaction.channelId];
  if (!ticket) {
    return { ok: false, message: 'Это действие работает только в канале заявки.' };
  }
  if (ticket.status === 'accepted') {
    return { ok: false, message: 'Заявка уже принята.' };
  }
  if (ticket.status === 'rejected') {
    return { ok: false, message: 'Заявка уже отклонена.' };
  }

  ticket.status = 'rejected';
  ticket.rejectedById = interaction.user.id;
  ticket.rejectedAt = new Date().toISOString();
  ticket.rejectReason = reason;
  tickets[interaction.channelId] = ticket;
  store.save('tickets', tickets);

  await interaction.channel.send(simpleV2Payload(config, {
    title: `${emojiText(config, 'hwt_error', emojiText(config, 'hwt_reject', emojiText(config, 'no', '❌')))} Заявка отклонена`,
    color: config.theme.danger,
    description: [
      `**Кандидат:** ${memberTag(ticket.userId)}`,
      `**Отклонил:** ${memberTag(interaction.user.id)}`,
      `**Причина:** ${reason}`,
      `**Время:** ${formatDate()}`
    ].join('\n'),
    timestamp: true
  }));

  await sendTicketActionLog(
    client,
    config,
    `${emojiText(config, 'hwt_error', emojiText(config, 'hwt_reject', emojiText(config, 'no', '❌')))} Заявка отклонена`,
    ticket,
    interaction.user.id,
    [`**Причина:** ${reason}`],
    config.theme.danger
  );

  const applicantMember = await interaction.guild.members.fetch(ticket.userId).catch(() => null);
  if (applicantMember) {
    await applicantMember.send(simpleV2Payload(config, {
      title: `${emojiText(config, 'hwt_error', emojiText(config, 'hwt_reject', '❌'))} Заявка отклонена`,
      description: [
        `Ваша заявка в **${interaction.guild.name}** отклонена.`,
        `Причина: ${reason}`
      ].join('\n'),
      color: config.theme.danger
    })).catch(() => {});
  }

  return { ok: true, message: `${memberTag(ticket.userId)} отклонен.` };
}

async function markTicketInterview(interaction, config, store, client) {
  if (!canManageTickets(interaction.member, config)) {
    return { ok: false, message: 'Недостаточно прав для вызова на обзвон.' };
  }

  const tickets = store.load('tickets', ticketsDefaults());
  const ticket = tickets[interaction.channelId];
  if (!ticket) {
    return { ok: false, message: 'Это действие работает только в канале заявки.' };
  }

  ticket.status = 'interview';
  ticket.interviewById = interaction.user.id;
  ticket.interviewAt = new Date().toISOString();
  tickets[interaction.channelId] = ticket;
  store.save('tickets', tickets);

  const applicantMember = await interaction.guild.members.fetch(ticket.userId).catch(() => null);
  if (applicantMember) {
    await applicantMember.send(simpleV2Payload(config, {
      title: `${emojiText(config, 'hwt_interview', emojiText(config, 'hwt_voice', '🔊'))} Вызов на обзвон`,
      description: `Вас вызывают на обзвон по заявке в **${interaction.guild.name}**. Откройте канал **${interaction.channel?.name || 'заявки'}** на сервере.`,
      color: config.theme.accent
    })).catch(() => {});
  }

  await interaction.channel.send(simpleV2Payload(config, {
    title: `${emojiText(config, 'hwt_interview', emojiText(config, 'hwt_voice', emojiText(config, 'voice', '')))} Вызов на обзвон`,
    color: config.theme.accent,
    description: [
      `**Кандидат:** ${memberTag(ticket.userId)}`,
      `**Вызвал:** ${memberTag(interaction.user.id)}`,
      `**Время:** ${formatDate()}`
    ].join('\n'),
    timestamp: true
  }));

  await sendTicketActionLog(
    client,
    config,
    `${emojiText(config, 'hwt_interview', emojiText(config, 'hwt_voice', emojiText(config, 'voice', '')))} Вызов на обзвон`,
    ticket,
    interaction.user.id,
    [],
    config.theme.accent
  );

  return { ok: true, message: `${memberTag(ticket.userId)} вызван на обзвон.` };
}

async function deleteTicket(interaction, config, store, client) {
  if (!canDeleteTickets(interaction.member, config)) {
    return { ok: false, message: 'Удалять тикеты может только роль рекрутов.' };
  }

  const tickets = store.load('tickets', ticketsDefaults());
  const ticket = tickets[interaction.channelId];
  if (!ticket) {
    return { ok: false, message: 'Это действие работает только в канале заявки.' };
  }

  ticket.status = 'deleted';
  ticket.deletedById = interaction.user.id;
  ticket.deletedAt = new Date().toISOString();
  tickets[interaction.channelId] = ticket;
  store.save('tickets', tickets);

  const lines = [
    `**Кандидат:** ${memberTag(ticket.userId)}`,
    `**Сотрудник:** ${memberTag(interaction.user.id)}`,
    `**Канал:** <#${ticket.channelId}>`,
    `**Время:** ${formatDate()}`
  ];

  await sendLog(client, config.logs.ticketDelete || config.logs.ticket || config.logs.bot, {
    embeds: [
      createEmbed(config, {
        title: `${emojiText(config, 'hwt_delete', emojiText(config, 'no', ''))} Тикет удален`,
        color: config.theme.danger,
        description: lines.join('\n'),
        timestamp: true
      })
    ]
  });

  return { ok: true, message: 'Тикет будет удален.' };
}

async function syncExistingTicketControls(client, config, store) {
  const tickets = store.load('tickets', ticketsDefaults());
  for (const ticket of Object.values(tickets)) {
    if (!ticket?.channelId || !['open', 'interview'].includes(ticket.status)) continue;

    const channel = await client.channels.fetch(ticket.channelId).catch(() => null);
    if (!channel?.isTextBased()) continue;

    const messages = await channel.messages.fetch({ limit: 50 }).catch(() => null);
    if (!messages) continue;

    for (const message of messages.values()) {
      if (message.author?.id !== client.user.id) continue;

      const hasTicketButtons = message.components?.some((row) =>
        row.components?.some((component) => {
          const customId = component.customId || component.data?.custom_id;
          return ['ticket:accept', 'ticket:reject', 'ticket:interview'].includes(customId);
        })
      );

      if (hasTicketButtons) {
        if (message.embeds?.length || message.content) {
          await message.delete().catch(() => null);
          await channel.send(buildTicketApplicationPayload(config, ticket, ticket.userId, { ping: false })).catch(() => {});
        } else {
          await message.edit(payloadForPanelEdit(buildTicketApplicationPayload(config, ticket, ticket.userId, { ping: false }), message)).catch(() => {});
        }
        break;
      }
    }
  }
}

async function createCaptEvent(interaction, config, store) {
  const type = interaction.options.getString('type', true);
  const opponent = interaction.options.getString('opponent', true);
  const whenText = interaction.options.getString('time', true);
  const mentionRole = interaction.options.getRole('mention_role');
  const slots = interaction.options.getInteger('slots') || config.capt.defaultSlots;
  const events = store.load('events', {});

  const initialEvent = {
    type: 'capt',
    mode: type,
    opponent,
    whenText,
    slots,
    registrationOpen: true,
    main: [],
    reserve: [],
    leavers: [],
    assignments: {},
    mentionText: mentionRole ? roleTag(mentionRole.id) : '@everyone'
  };

  const message = await interaction.channel.send(componentsV2PayloadFromEmbed(config, createEmbed(config, {
    title: `${emojiText(config, 'hwt_capt', '')} ${type}`.trim(),
    description: buildCaptDescription(config, initialEvent)
  }), [], {
    includeDefaultImage: false,
    intro: '@everyone',
    allowedMentions: { parse: ['everyone'] }
  }));

  const thread = await message.startThread({
    name: `${type}, ${whenText}`,
    autoArchiveDuration: 1440,
    reason: 'Capt registration thread'
  });

  events[message.id] = {
    id: message.id,
    type: 'capt',
    channelId: interaction.channelId,
    messageId: message.id,
    threadId: thread.id,
    opponent,
    whenText,
    mode: type,
    slots,
    registrationOpen: true,
    main: [],
    reserve: [],
    leavers: [],
    assignments: {},
    plusMessages: {},
    mentionRoleId: mentionRole?.id || null
  };
  store.save('events', events);

  await thread.send({
    content: 'Регистрация открыта. Отправьте строго `+` отдельным сообщением, без лишних слов, букв или символов. Для выхода нажмите кнопку ниже или отправьте `-`.',
    components: buildMclThreadComponents({ id: message.id }, config)
  });
  return `Capt-сбор создан: ${message.url}`;
}

async function createMclEvent(client, interaction, config, store) {
  const mode = interaction.options.getString('mode', true);
  const dateText = interaction.options.getString('date', true);
  const timeText = interaction.options.getString('time', true);
  const serverName = interaction.options.getString('server', true);
  const whenText = `${dateText} ${timeText}`;
  const slots = interaction.options.getInteger('slots') || config.mcl.defaultSlots;
  const events = store.load('events', {});

  const eventState = {
    id: '',
    type: 'mcl',
    mode,
    dateText,
    timeText,
    whenText,
    serverName,
    slots,
    registrationOpen: true,
    main: [],
    reserve: [],
    leavers: [],
    assignments: {},
    plusMessages: {}
  };

  const message = await interaction.channel.send(componentsV2PayloadFromEmbed(config, createEmbed(config, {
    title: `${emojiText(config, 'hwt_mcl', '')} ${mode}, ${timeText}`.trim(),
    description: buildMclAnnouncementDescription(config, eventState)
  }), [], {
    includeDefaultImage: false,
    intro: '@everyone',
    allowedMentions: { parse: ['everyone'] }
  }));

  const thread = await message.startThread({
    name: `${mode}, ${dateText}, ${timeText}`,
    autoArchiveDuration: 1440,
    reason: 'MCL registration thread'
  });

  eventState.id = message.id;
  eventState.channelId = interaction.channelId;
  eventState.messageId = message.id;
  eventState.threadId = thread.id;
  await thread.send({
    content: 'Регистрация открыта. Отправьте строго `+` отдельным сообщением, без лишних слов, букв или символов.'
  });
  const listMessage = await thread.send(buildEventRosterPayload(config, eventState));
  eventState.listMessageId = listMessage.id;
  events[message.id] = eventState;
  store.save('events', events);
  return `${mode}-сбор создан: ${message.url}`;
}

async function updateEventMessage(client, config, store, event) {
  if (event.type === 'mcl') {
    const events = store.load('events', {});
    const parentChannel = event.channelId ? await client.channels.fetch(event.channelId).catch(() => null) : null;
    const parentMessage = parentChannel?.isTextBased?.()
      ? await parentChannel.messages.fetch(event.messageId || event.id).catch(() => null)
      : null;
    if (parentMessage) {
      const parentEmbed = createEmbed(config, {
        title: `${emojiText(config, 'hwt_mcl', '')} ${event.mode}, ${event.timeText || event.whenText || ''}`.trim(),
        description: buildMclAnnouncementDescription(config, event)
      });
      const parentPayload = componentsV2PayloadFromEmbed(config, parentEmbed, [], { includeDefaultImage: false });
      await parentMessage.edit(
        parentMessage.embeds?.length || parentMessage.content
          ? { embeds: [parentEmbed] }
          : payloadForPanelEdit(parentPayload, parentMessage)
      ).catch(() => {});
    }

    const thread = await client.channels.fetch(event.threadId).catch(() => null);
    if (!thread?.isTextBased()) {
      return;
    }

    const payload = buildEventRosterPayload(config, event);

    let message = event.listMessageId
      ? await thread.messages.fetch(event.listMessageId).catch(() => null)
      : null;

    if (message) {
      try {
        if (message.embeds?.length || message.content) {
          await message.delete().catch(() => null);
        } else {
          await message.edit(payloadForPanelEdit(payload, message));
          return;
        }
      } catch (error) {
        const shouldRecreate =
          error?.code === 10008 ||
          String(error?.message || '').includes('MESSAGE_CANNOT_USE_LEGACY_FIELDS_WITH_COMPONENTS_V2') ||
          String(error?.rawError?.message || '').includes('MESSAGE_CANNOT_USE_LEGACY_FIELDS_WITH_COMPONENTS_V2');
        if (!shouldRecreate) {
          throw error;
        }
      }
    }

    message = await thread.send(payload).catch(() => null);
    if (message) {
      event.listMessageId = message.id;
      events[event.id] = event;
      store.save('events', events);
    }
    return;
  }

  const channel = await client.channels.fetch(event.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    return;
  }

  const message = await channel.messages.fetch(event.messageId).catch(() => null);
  if (!message) {
    return;
  }

  const embed = buildEventRosterEmbed(config, event);
  const payload = componentsV2PayloadFromEmbed(config, embed, [], { includeDefaultImage: false });

  try {
    await message.edit(
      message.embeds?.length || message.content
        ? { embeds: [embed] }
        : payloadForPanelEdit(payload, message)
    );
  } catch (error) {
    if (error?.code === 10008) {
      return;
    }
    throw error;
  }
}

async function syncExistingMclThreadControls(client, config, store) {
  const events = store.load('events', {});
  for (const event of Object.values(events)) {
    if (!event?.threadId || (event.type !== 'mcl' && event.type !== 'capt')) continue;

    await updateEventMessage(client, config, store, event).catch(() => {});

    const thread = await client.channels.fetch(event.threadId).catch(() => null);
    if (!thread?.isTextBased()) continue;

    const messages = await thread.messages.fetch({ limit: 50 }).catch(() => null);
    if (!messages) continue;

    for (const message of messages.values()) {
      if (message.author?.id !== client.user.id) continue;

      const hasEventButton = message.components?.some((row) =>
        row.components?.some((component) => {
          const customId = component.customId || component.data?.custom_id;
          return customId === `event:join:${event.id}` || customId === `event:leave:${event.id}`;
        })
      );

      if (hasEventButton) {
        await message.edit(buildEventRosterPayload(config, event)).catch(() => {});
        break;
      }
    }
  }
}

function removeFromAllAssignments(assignments, userId) {
  for (const key of Object.keys(assignments)) {
    assignments[key] = ensureArray(assignments[key]).filter((id) => id !== userId);
  }
}

async function handleMclRosterAction(interaction, config, store, eventId, targetList) {
  if (!hasAnyRole(interaction.member, config.roles.highrank)) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Недостаточно прав для распределения состава.' });
    return;
  }

  const events = store.load('events', {});
  const event = events[eventId];
  if (!event) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Событие не найдено.' });
    return;
  }

  const registered = [...new Set([...ensureArray(event.main), ...ensureArray(event.reserve)])];
  const options = registered.slice(0, 25).map((userId) => ({
    label: interaction.guild.members.cache.get(userId)?.displayName || userId,
    value: userId
  }));

  if (!options.length) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Список регистрации пока пуст.' });
    return;
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: `Выберите игрока, которого нужно перенести в ${targetList === 'main' ? 'основной состав' : 'резерв'}.`,
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`mcl-roster-select:${eventId}:${targetList}`)
          .setPlaceholder('Выберите игрока')
          .addOptions(options)
      )
    ]
  });
}

function tempVoiceDefaults() {
  return {
    categoryId: '',
    controlChannelId: '',
    createChannelId: '',
    panelMessageId: '',
    rooms: {}
  };
}

function getTempVoiceState(store) {
  const state = store.load('tempVoices', tempVoiceDefaults());
  state.rooms = state.rooms || {};
  return state;
}

function getTempVoiceAllowedRoleIds(config) {
  return [...new Set([
    ...ensureArray(config.tempVoice?.allowedRoleIds),
    config.roles?.test || "",
    config.roles?.heavyweight || "",
    ...getProfileStaffAccessRoleIds(config),
    config.roles?.test || "",
    config.roles?.heavyweight || ""
  ].filter(Boolean))];
}

function canUseTempVoiceFeature(member, config) {
  return hasAnyRole(member, getTempVoiceAllowedRoleIds(config));
}

function tempVoiceTextOverwrites(guild, config) {
  const overwrites = [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }];
  for (const roleId of getTempVoiceAllowedRoleIds(config)) {
    if (!guild.roles.cache.has(roleId)) continue;
    overwrites.push({
      id: roleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
    });
  }
  return overwrites;
}

function tempVoiceChannelOverwrites(guild, config, ownerId = null) {
  const overwrites = [{ id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }];
  for (const roleId of getTempVoiceAllowedRoleIds(config)) {
    if (!guild.roles.cache.has(roleId)) continue;
    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream,
        PermissionFlagsBits.UseVAD
      ]
    });
  }
  if (ownerId) {
    overwrites.push({
      id: ownerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak,
        PermissionFlagsBits.Stream,
        PermissionFlagsBits.UseVAD
      ]
    });
  }
  return overwrites;
}

function tempVoiceButton(config, customId, emojiKey, fallbackEmoji) {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setEmoji(buttonEmoji(config, emojiKey, fallbackEmoji))
    .setStyle(ButtonStyle.Secondary);
}

function buildTempVoicePanelComponents(config) {
  return [
    new ActionRowBuilder().addComponents(
      tempVoiceButton(config, 'tempvoice:add-slot', 'temp_voice_add_slot', '👥'),
      tempVoiceButton(config, 'tempvoice:remove-slot', 'temp_voice_remove_slot', '👤'),
      tempVoiceButton(config, 'tempvoice:lock', 'temp_voice_lock', '🔒'),
      tempVoiceButton(config, 'tempvoice:rename', 'temp_voice_rename', '✏️'),
      tempVoiceButton(config, 'tempvoice:set-limit', 'temp_voice_set_slots', '👥')
    ),
    new ActionRowBuilder().addComponents(
      tempVoiceButton(config, 'tempvoice:bitrate', 'temp_voice_bitrate', '🎧'),
      tempVoiceButton(config, 'tempvoice:kick', 'temp_voice_kick', '✖️'),
      tempVoiceButton(config, 'tempvoice:speak', 'temp_voice_speak', '🔊'),
      tempVoiceButton(config, 'tempvoice:access', 'temp_voice_access', '🔓'),
      tempVoiceButton(config, 'tempvoice:transfer', 'temp_voice_transfer', '👑')
    )
  ];
}

function buildTempVoicePanelPayload(config) {
  const e = (key, fallback) => emojiText(config, key, fallback);
  return simpleV2Payload(config, {
    title: 'Управление временной голосовой комнатой',
    description: [
      '**Возможные манипуляции в вашей комнате:**',
      '',
      `${e('temp_voice_add_slot', '👥')} = Добавить 1 слот в вашу комнату`,
      `${e('temp_voice_remove_slot', '👤')} = Убрать 1 слот из вашей комнаты`,
      `${e('temp_voice_lock', '🔒')} = Разрешить/запретить вход пользователям в вашу комнату`,
      `${e('temp_voice_speak', '🔊')} = Запретить/выдать пользователю возможность говорить в вашей комнате`,
      `${e('temp_voice_kick', '✖️')} = Исключить пользователя из вашей комнаты`,
      `${e('temp_voice_bitrate', '🎧')} = Изменить битрейт вашей комнаты`,
      `${e('temp_voice_set_slots', '👥')} = Установить количество слотов в комнате`,
      `${e('temp_voice_transfer', '👑')} = Передать права владения комнатой`,
      `${e('temp_voice_rename', '✏️')} = Сменить название вашей комнаты`,
      `${e('temp_voice_access', '🔓')} = Выдать/забрать доступ пользователю в вашу комнату`,
      '',
      '**Создание временных комнат - только для участников семьи!**'
    ].join('\n'),
    components: buildTempVoicePanelComponents(config),
    includeDefaultImage: false
  });
}

async function findOrCreateTempVoiceChannel(guild, state, key, options) {
  const { legacyNames, ...createOptions } = options;
  let channel = state[key] ? await guild.channels.fetch(state[key]).catch(() => null) : null;
  if (channel) {
    if (channel.name !== options.name) {
      await channel.setName(options.name, 'Sync temporary voice channel name').catch(() => {});
    }
    return channel;
  }

  const names = [options.name, ...ensureArray(legacyNames)].map((name) => name.toLowerCase());
  channel = guild.channels.cache.find((entry) =>
    entry.type === options.type &&
    entry.parentId === options.parent &&
    names.includes(entry.name.toLowerCase())
  );
  if (!channel) {
    channel = await guild.channels.create(createOptions);
  } else if (channel.name !== options.name) {
    await channel.setName(options.name, 'Sync temporary voice channel name').catch(() => {});
  }
  state[key] = channel.id;
  return channel;
}

async function ensureTempVoiceHub(client, config, store) {
  if (config.tempVoice?.enabled === false) return;

  const guild = await client.guilds.fetch(config.guildId).catch(() => null);
  if (!guild) return;

  await ensureGuildRolesCached(guild);
  const state = getTempVoiceState(store);
  const categoryName = config.tempVoice?.categoryName || DEFAULT_TEMP_VOICE_CATEGORY_NAME;
  let category = state.categoryId ? await guild.channels.fetch(state.categoryId).catch(() => null) : null;
  if (!category || category.type !== ChannelType.GuildCategory) {
    category = guild.channels.cache.find((channel) =>
      channel.type === ChannelType.GuildCategory &&
      channel.name.toLowerCase() === categoryName.toLowerCase()
    );
  }
  if (!category) {
    category = await guild.channels.create({
      name: categoryName,
      type: ChannelType.GuildCategory,
      permissionOverwrites: tempVoiceChannelOverwrites(guild, config)
    });
  } else {
    await category.permissionOverwrites.set(tempVoiceChannelOverwrites(guild, config), 'Sync temporary voice category access').catch(() => {});
  }
  state.categoryId = category.id;

  const controlChannel = await findOrCreateTempVoiceChannel(guild, state, 'controlChannelId', {
    name: config.tempVoice?.controlChannelName || DEFAULT_TEMP_VOICE_CONTROL_NAME,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: tempVoiceTextOverwrites(guild, config),
    reason: 'Temporary voice control panel',
    legacyNames: ['📝・manage-voice']
  });
  await controlChannel.permissionOverwrites.set(tempVoiceTextOverwrites(guild, config), 'Sync temporary voice control access').catch(() => {});

  const createChannel = await findOrCreateTempVoiceChannel(guild, state, 'createChannelId', {
    name: config.tempVoice?.createChannelName || DEFAULT_TEMP_VOICE_CREATE_NAME,
    type: ChannelType.GuildVoice,
    parent: category.id,
    userLimit: 1,
    permissionOverwrites: tempVoiceChannelOverwrites(guild, config),
    reason: 'Temporary voice create channel',
    legacyNames: ['✚・create-voice']
  });
  await createChannel.permissionOverwrites.set(tempVoiceChannelOverwrites(guild, config), 'Sync temporary voice create access').catch(() => {});
  await createChannel.setUserLimit(1, 'Temporary voice create channel limit').catch(() => {});

  let panelMessage = state.panelMessageId ? await controlChannel.messages.fetch(state.panelMessageId).catch(() => null) : null;
  const panelPayload = buildTempVoicePanelPayload(config);
  if (panelMessage) {
    await panelMessage.edit(payloadForPanelEdit(panelPayload, panelMessage)).catch(() => {
      panelMessage = null;
    });
  }
  if (!panelMessage) {
    panelMessage = await controlChannel.send(panelPayload);
    state.panelMessageId = panelMessage.id;
  }

  store.save('tempVoices', state);
}

function getTempVoiceRoomForMember(member, store) {
  const state = getTempVoiceState(store);
  const channelId = member?.voice?.channelId;
  if (!channelId || !state.rooms[channelId]) return null;
  return { state, channelId, room: state.rooms[channelId] };
}

function canManageTempVoiceRoom(member, config, room) {
  return Boolean(member && room && (room.ownerId === member.id || hasAnyRole(member, config.roles.highrank)));
}

function parseUserId(value) {
  const match = String(value || '').match(/\d{15,25}/);
  return match ? match[0] : null;
}

async function resolveModalMember(guild, value) {
  const userId = parseUserId(value);
  return userId ? guild.members.fetch(userId).catch(() => null) : null;
}

async function requireTempVoiceRoom(interaction, config, store) {
  const context = getTempVoiceRoomForMember(interaction.member, store);
  if (!context) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Сначала зайдите в свою временную голосовую комнату.' });
    return null;
  }
  if (!canManageTempVoiceRoom(interaction.member, config, context.room)) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Управлять этой комнатой может только владелец.' });
    return null;
  }
  const channel = await interaction.guild.channels.fetch(context.channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildVoice) {
    delete context.state.rooms[context.channelId];
    store.save('tempVoices', context.state);
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Временная комната не найдена.' });
    return null;
  }
  return { ...context, channel };
}

async function openTempVoiceTargetModal(interaction, action, title, label, placeholder) {
  await openModal(interaction, {
    id: `tempvoice:${action}-modal`,
    title,
    inputs: [{ id: 'target', label, placeholder }]
  });
}

async function handleTempVoiceButton(interaction, config, store) {
  const action = interaction.customId.replace('tempvoice:', '');
  if (!canUseTempVoiceFeature(interaction.member, config)) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Временные комнаты доступны только ролям TEST и HEAVYWEIGHT.' });
    return true;
  }

  if (action === 'rename') {
    await openModal(interaction, {
      id: 'tempvoice:rename-modal',
      title: 'Название комнаты',
      inputs: [{ id: 'name', label: 'Новое название', placeholder: 'Например: duo / состав / тренировка' }]
    });
    return true;
  }
  if (action === 'set-limit') {
    await openModal(interaction, {
      id: 'tempvoice:set-limit-modal',
      title: 'Количество слотов',
      inputs: [{ id: 'limit', label: 'Слоты', placeholder: '0-99, где 0 = без лимита' }]
    });
    return true;
  }
  if (action === 'bitrate') {
    await openModal(interaction, {
      id: 'tempvoice:bitrate-modal',
      title: 'Битрейт комнаты',
      inputs: [{ id: 'bitrate', label: 'Кбит/с', placeholder: 'Например: 64, 96, 128' }]
    });
    return true;
  }
  if (action === 'kick') {
    await openTempVoiceTargetModal(interaction, 'kick', 'Исключить пользователя', 'Пользователь', '@user или ID');
    return true;
  }
  if (action === 'speak') {
    await openTempVoiceTargetModal(interaction, 'speak', 'Запретить/выдать говорить', 'Пользователь', '@user или ID');
    return true;
  }
  if (action === 'access') {
    await openTempVoiceTargetModal(interaction, 'access', 'Выдать/забрать доступ', 'Пользователь', '@user или ID');
    return true;
  }
  if (action === 'transfer') {
    await openTempVoiceTargetModal(interaction, 'transfer', 'Передать владельца', 'Новый владелец', '@user или ID');
    return true;
  }

  const context = await requireTempVoiceRoom(interaction, config, store);
  if (!context) return true;

  if (action === 'add-slot' || action === 'remove-slot') {
    const currentLimit = Number(context.channel.userLimit) || 0;
    const nextLimit = action === 'add-slot' ? Math.min(99, currentLimit + 1) : Math.max(0, currentLimit - 1);
    await context.channel.setUserLimit(nextLimit, `Temporary voice slots changed by ${interaction.user.tag}`);
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Количество слотов: ${nextLimit || 'без лимита'}.` });
    return true;
  }

  if (action === 'lock') {
    const nextLocked = !context.room.locked;
    for (const roleId of getTempVoiceAllowedRoleIds(config)) {
      if (!interaction.guild.roles.cache.has(roleId)) continue;
      await context.channel.permissionOverwrites.edit(roleId, { Connect: nextLocked ? false : true }).catch(() => {});
    }
    await context.channel.permissionOverwrites.edit(context.room.ownerId, {
      ViewChannel: true,
      Connect: true,
      Speak: true
    }).catch(() => {});
    context.room.locked = nextLocked;
    context.state.rooms[context.channelId] = context.room;
    store.save('tempVoices', context.state);
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: nextLocked ? 'Комната закрыта для входа.' : 'Комната открыта для входа.' });
    return true;
  }

  return false;
}

async function handleTempVoiceModal(interaction, config, store) {
  if (!interaction.customId.startsWith('tempvoice:')) return false;

  const context = await requireTempVoiceRoom(interaction, config, store);
  if (!context) return true;

  const action = interaction.customId.replace('tempvoice:', '').replace('-modal', '');
  if (action === 'rename') {
    const rawName = interaction.fields.getTextInputValue('name')?.trim();
    const name = rawName?.replace(/@everyone|@here/gi, '').slice(0, 90);
    if (!name) {
      await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Укажите название комнаты.' });
      return true;
    }
    await context.channel.setName(name, `Temporary voice renamed by ${interaction.user.tag}`);
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Комната переименована в **${name}**.` });
    return true;
  }

  if (action === 'set-limit') {
    const limit = Number(interaction.fields.getTextInputValue('limit'));
    if (!Number.isInteger(limit) || limit < 0 || limit > 99) {
      await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Укажите число слотов от 0 до 99.' });
      return true;
    }
    await context.channel.setUserLimit(limit, `Temporary voice limit changed by ${interaction.user.tag}`);
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Количество слотов: ${limit || 'без лимита'}.` });
    return true;
  }

  if (action === 'bitrate') {
    const kbps = Number(interaction.fields.getTextInputValue('bitrate'));
    if (!Number.isFinite(kbps) || kbps <= 0) {
      await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Укажите битрейт числом, например `64`.' });
      return true;
    }
    const maxBitrate = interaction.guild.maximumBitrate || 96000;
    const bitrate = Math.max(8000, Math.min(maxBitrate, Math.floor(kbps * 1000)));
    await context.channel.setBitrate(bitrate, `Temporary voice bitrate changed by ${interaction.user.tag}`);
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Битрейт установлен: ${Math.floor(bitrate / 1000)} кбит/с.` });
    return true;
  }

  const targetMember = await resolveModalMember(interaction.guild, interaction.fields.getTextInputValue('target'));
  if (!targetMember) {
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Пользователь не найден. Укажите @user или ID.' });
    return true;
  }

  if (action === 'kick') {
    if (targetMember.voice?.channelId !== context.channelId) {
      await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Этот пользователь не находится в вашей комнате.' });
      return true;
    }
    await targetMember.voice.setChannel(null, `Kicked from temporary voice by ${interaction.user.tag}`);
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: `${targetMember} исключен из комнаты.` });
    return true;
  }

  if (action === 'speak') {
    const overwrite = context.channel.permissionOverwrites.cache.get(targetMember.id);
    const denied = overwrite?.deny?.has?.(PermissionFlagsBits.Speak);
    await context.channel.permissionOverwrites.edit(targetMember.id, {
      ViewChannel: true,
      Connect: true,
      Speak: denied ? null : false
    });
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: denied ? `${targetMember} снова может говорить.` : `${targetMember} больше не может говорить.` });
    return true;
  }

  if (action === 'access') {
    const overwrite = context.channel.permissionOverwrites.cache.get(targetMember.id);
    const allowed = overwrite?.allow?.has?.(PermissionFlagsBits.Connect);
    if (allowed) {
      await context.channel.permissionOverwrites.delete(targetMember.id, `Temporary voice access removed by ${interaction.user.tag}`).catch(() => {});
      await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Доступ для ${targetMember} снят.` });
    } else {
      await context.channel.permissionOverwrites.edit(targetMember.id, {
        ViewChannel: true,
        Connect: true,
        Speak: true
      });
      await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Доступ для ${targetMember} выдан.` });
    }
    return true;
  }

  if (action === 'transfer') {
    if (targetMember.voice?.channelId !== context.channelId) {
      await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Новый владелец должен находиться в вашей комнате.' });
      return true;
    }
    context.room.ownerId = targetMember.id;
    context.state.rooms[context.channelId] = context.room;
    store.save('tempVoices', context.state);
    await context.channel.permissionOverwrites.edit(targetMember.id, {
      ViewChannel: true,
      Connect: true,
      Speak: true
    }).catch(() => {});
    await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Права владельца переданы ${targetMember}.` });
    return true;
  }

  return false;
}

async function createTemporaryVoiceRoom(newState, config, store) {
  const member = newState.member;
  if (!member || !canUseTempVoiceFeature(member, config)) {
    await member?.voice?.setChannel(null, 'Temporary voice access denied').catch(() => {});
    return;
  }

  const state = getTempVoiceState(store);
  const defaultLimit = Number(config.tempVoice?.defaultUserLimit) || DEFAULT_TEMP_VOICE_USER_LIMIT;
  const channel = await newState.guild.channels.create({
    name: `${member.displayName || member.user.username}`,
    type: ChannelType.GuildVoice,
    parent: state.categoryId || newState.channel?.parentId || undefined,
    userLimit: Math.max(0, Math.min(99, defaultLimit)),
    permissionOverwrites: tempVoiceChannelOverwrites(newState.guild, config, member.id),
    reason: `Temporary voice room for ${member.user.tag}`
  });

  state.rooms[channel.id] = {
    channelId: channel.id,
    ownerId: member.id,
    createdAt: new Date().toISOString(),
    locked: false
  };
  store.save('tempVoices', state);

  await member.voice.setChannel(channel, 'Temporary voice room created').catch(async () => {
    delete state.rooms[channel.id];
    store.save('tempVoices', state);
    await channel.delete('Temporary voice room move failed').catch(() => {});
  });
}

async function deleteTempVoiceRoomIfEmpty(guild, store, channelId) {
  const state = getTempVoiceState(store);
  if (!state.rooms[channelId]) return;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildVoice) {
    delete state.rooms[channelId];
    store.save('tempVoices', state);
    return;
  }
  if (channel.members.size > 0) return;

  delete state.rooms[channelId];
  store.save('tempVoices', state);
  await channel.delete('Temporary voice room empty').catch(() => {});
}

async function handleTempVoiceStateUpdate(oldState, newState, config, store) {
  if (config.tempVoice?.enabled === false) return;

  const state = getTempVoiceState(store);
  if (oldState.channelId && oldState.channelId !== newState.channelId) {
    await deleteTempVoiceRoomIfEmpty(oldState.guild, store, oldState.channelId);
  }
  if (newState.channelId && newState.channelId === state.createChannelId) {
    await createTemporaryVoiceRoom(newState, config, store);
  }
}

const configRef = { value: null };

async function bootstrap() {
  loadDotEnv();
  const config = resolveConfig();
  configRef.value = config;
  const store = new JsonStore(path.join(process.cwd(), 'data'));

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction]
  });
  const replayModule = createReplayModule(config, store);

  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);
    await registerCommands(config);
    await ensureProtectedMemberOnStartup(client, config).catch((error) => {
      console.error(`Failed to ensure protected member on startup`, error);
    });
    await syncAuraVoiceSessionsOnStartup(client, config, store).catch((error) => {
      console.error('Failed to sync AURA voice sessions on startup', error);
    });
    await syncExistingProfileChannels(client, config, store);
    await syncExistingTicketControls(client, config, store);
    await syncExistingMclThreadControls(client, config, store);
    await ensureTempVoiceHub(client, config, store).catch((error) => {
      console.error('Failed to ensure temporary voice hub', error);
    });
    if (config.replays?.enabled !== false) {
      await replayModule.ensureMainPanel(client);
    }
    startAfkMaintenance(client, config, store);
    startAutoBackups(config);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (
        interaction.isChatInputCommand() &&
        !['aura', 'aura-rank', 'recruiter-stats', 'top', 'weekly', 'family-stats', 'inactive-list', 'vefigch', 'setup'].includes(interaction.commandName) &&
        !canUseSlashCommands(interaction.member, config)
      ) {
        await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Эти slash-команды доступны только роли high.' });
        return;
      }

      if (await replayModule.handleInteraction(interaction, client)) {
        return;
      }

      if (interaction.isChatInputCommand()) {
        const settings = store.load('settings', settingsDefaults(config));

        if (interaction.commandName === 'aura') {
          if (!canUseAuraCommand(interaction.member)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Команда /aura доступна только роли HEAVYWEIGHT.' });
            return;
          }

          const targetUser = interaction.options.getUser('user') || interaction.user;
          const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => (
            targetUser.id === interaction.user.id ? interaction.member : null
          ));
          await interaction.reply({
            flags: MessageFlags.Ephemeral,
            embeds: [buildAuraProfile(interaction, config, store, targetUser, targetMember)]
          });
          return;
        }

        if (interaction.commandName === 'aura-rank') {
          if (!config.ownerId || interaction.user.id !== config.ownerId) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Эту команду может использовать только владелец.' });
            return;
          }

          const targetUser = interaction.options.getUser('user') || interaction.user;
          const rankValue = interaction.options.getString('rank', true);
          const rank = setManualAuraRank(store, targetUser.id, rankValue, interaction.user.id, config.auraRanks);
          await interaction.reply({
            flags: MessageFlags.Ephemeral,
            content: rank
              ? `Ранг ${rank.emoji} **${rank.name}** выдан пользователю ${memberTag(targetUser.id)}.`
              : `Ручной ранг для ${memberTag(targetUser.id)} сброшен. Теперь ранг снова считается по AURA.`
          });
          return;
        }

        if (interaction.commandName === 'recruiter-stats') {
          const targetUser = interaction.options.getUser('user') || interaction.user;
          const isOwner = config.ownerId && interaction.user.id === config.ownerId;
          const requesterIsRecruiter = interaction.member?.roles?.cache?.has?.(config.roles?.ticketAccess?.[0]);

          if (!isOwner && (!requesterIsRecruiter || targetUser.id !== interaction.user.id)) {
            await interaction.reply({
              flags: MessageFlags.Ephemeral,
              content: 'Статистику рекрута можно смотреть только по себе. Полный просмотр доступен владельцу.'
            });
            return;
          }

          const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => (
            targetUser.id === interaction.user.id ? interaction.member : null
          ));
          await interaction.reply(componentsV2PayloadFromEmbed(
            config,
            buildRecruiterStatsProfile(interaction, config, store, targetUser, targetMember),
            [],
            { includeDefaultImage: false, ephemeral: true }
          ));
          return;
        }

        if (['top', 'weekly', 'family-stats', 'inactive-list'].includes(interaction.commandName)) {
          if (!canUseStatsCommand(interaction.member)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Эта статистика доступна только high, кураторам реплеев и рекрутам.' });
            return;
          }

          if (interaction.commandName === 'top') {
            const category = interaction.options.getString('category') || 'aura';
            await interaction.reply(componentsV2PayloadFromEmbed(
              config,
              buildTopEmbed(config, store, category),
              [],
              { includeDefaultImage: false, ephemeral: true }
            ));
            return;
          }

          if (interaction.commandName === 'weekly') {
            await interaction.reply(componentsV2PayloadFromEmbed(
              config,
              buildWeeklyEmbed(config, store),
              [],
              { includeDefaultImage: false, ephemeral: true }
            ));
            return;
          }

          if (interaction.commandName === 'family-stats') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            await interaction.editReply(componentsV2PayloadFromEmbed(
              config,
              await buildFamilyStatsEmbed(interaction.guild, config, store),
              [],
              { includeDefaultImage: false }
            ));
            return;
          }

          if (interaction.commandName === 'inactive-list') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            await interaction.editReply(componentsV2PayloadFromEmbed(
              config,
              await buildInactiveListEmbed(interaction.guild, config, store),
              [],
              { includeDefaultImage: false }
            ));
            return;
          }
        }

        if (interaction.commandName === 'deploy-panels') {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          await deployPanels(client, config, store);
          await ensureTempVoiceHub(client, config, store);
          if (config.replays?.enabled !== false) {
            await replayModule.ensureMainPanel(client);
          }
          await interaction.editReply({ content: 'Панели обновлены.' });
          return;
        }

        if (interaction.commandName === 'refresh-panels') {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const result = await refreshAllPanels(client, config, store, replayModule);
          await interaction.editReply({
            content: `Панели пересозданы. Удалено старых сообщений: ${result.deleted}. Обновлено панелей: ${result.panelCount}.`
          });
          return;
        }

        if (interaction.commandName === 'setup') {
          await handleSetupCommand(interaction, config);
          return;
        }

        if (interaction.commandName === 'vefigch') {
          if (!canManageCheatChecks(interaction.member, config)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Команда /vefigch доступна только high и Cheat Hunter.' });
            return;
          }

          const target = interaction.options.getUser('user', true);
          const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);
          const verifiedRoleId = getCheatVerifiedRoleId(config);
          if (!targetMember) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Не удалось найти этого пользователя на сервере.' });
            return;
          }
          if (!interaction.guild.roles.cache.has(verifiedRoleId)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Роль проверки ${roleTag(verifiedRoleId)} не найдена на сервере.` });
            return;
          }

          if (!targetMember.roles.cache.has(verifiedRoleId)) {
            await targetMember.roles.add(verifiedRoleId, `Cheat check verified by ${interaction.user.tag}`);
          }
          await sendCheatCheckDm(client, config, target.id, {
            title: `${emojiText(config, 'hwt_success', '')} Проверка пройдена`.trim(),
            description: `Вам выдана роль ${roleTag(verifiedRoleId)} через команду /vefigch.`,
            color: config.theme.success
          });

          await interaction.reply(simpleV2Payload(config, {
            title: `${emojiText(config, 'hwt_clean', emojiText(config, 'done', ''))} Проверка пройдена`,
            color: config.theme.success,
            description: [
              `**Игрок:** ${memberTag(target.id)}`,
              `**Выдал:** ${memberTag(interaction.user.id)}`,
              `**Роль:** ${roleTag(verifiedRoleId)}`
            ].join('\n'),
            timestamp: true,
            ephemeral: true
          }));
          return;
        }

        if (interaction.commandName === 'warn-add') {
          const afk = store.load('afk', {});
          const warns = store.load('warns', {});
          const target = interaction.options.getUser('user', true);
          const reason = interaction.options.getString('reason', true);

          if (afk[target.id]) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Нельзя выдать варн пользователю, который находится в AFK.' });
            return;
          }

          const current = warns[target.id] || { userId: target.id, count: 0, history: [] };
          current.count += 1;
          current.history.push({
            reason,
            moderatorId: interaction.user.id,
            createdAt: new Date().toISOString()
          });
          warns[target.id] = current;
          store.save('warns', warns);
          const targetMember = await interaction.guild.members.fetch(target.id).catch(() => null);
          let penaltyApplied = false;
          if (
            current.count >= 3 &&
            config.roles.penalty &&
            targetMember &&
            interaction.guild.roles.cache.has(config.roles.penalty) &&
            !targetMember.roles.cache.has(config.roles.penalty)
          ) {
            await targetMember.roles.add(config.roles.penalty, 'Reached 3 warns');
            penaltyApplied = true;
          }

          await interaction.reply(simpleV2Payload(config, {
            title: `${emojiText(config, 'hwt_warn', '⚠️')} Вам выдан выговор`,
            color: config.theme.danger,
            description: [
              `**Пользователь:** ${memberTag(target.id)}`,
              `**Модератор:** ${memberTag(interaction.user.id)}`,
              `**Причина:** ${reason}`,
              `**Текущее количество выговоров:** ${current.count}`,
              penaltyApplied ? `**Штрафная роль выдана:** ${roleTag(config.roles.penalty)}` : null
            ].filter(Boolean).join('\n'),
            timestamp: true
          }));
          return;
        }

        if (interaction.commandName === 'warn-remove') {
          const warns = store.load('warns', {});
          const target = interaction.options.getUser('user', true);
          const count = interaction.options.getInteger('count', true);
          const current = warns[target.id];

          if (!current) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'У пользователя нет варнов.' });
            return;
          }

          current.count = Math.max(0, current.count - count);
          current.history = current.history.slice(0, current.count);
          if (current.count === 0) {
            delete warns[target.id];
          } else {
            warns[target.id] = current;
          }
          store.save('warns', warns);

          await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Варны обновлены. Теперь у ${target.tag} ${current.count || 0}.` });
          return;
        }

        if (interaction.commandName === 'capt-create') {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const message = await createCaptEvent(interaction, config, store);
          await interaction.editReply({ content: message });
          return;
        }

        if (interaction.commandName === 'capt-toggle') {
          const events = store.load('events', {});
          const messageId = interaction.options.getString('message_id', true);
          const open = interaction.options.getBoolean('open', true);
          const event = events[messageId];
          if (!event || event.type !== 'capt') {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Capt-событие не найдено.' });
            return;
          }

          event.registrationOpen = open;
          events[messageId] = event;
          store.save('events', events);
          await updateEventMessage(client, config, store, event);
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Регистрация ${open ? 'открыта' : 'закрыта'}.` });
          return;
        }

        if (interaction.commandName === 'mcl-create') {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const message = await createMclEvent(client, interaction, config, store);
          await interaction.editReply({ content: message });
          return;
        }

        if (interaction.commandName === 'afk-refresh') {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          store.save('afk', {});
          await refreshAfkPanel(client, config, store);
          await interaction.editReply({ content: 'AFK-список очищен, панель обновлена.' });
          return;
        }

        if (interaction.commandName === 'settings-profile-role') {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const action = interaction.options.getString('action', true);
          const role = interaction.options.getRole('role', true);
          const everyoneRoleId = interaction.guild.roles.everyone.id;
          if (action === 'add' && role.id === everyoneRoleId) {
            await interaction.editReply({ content: '@everyone cannot be added to profile access.' });
            return;
          }

          const roles = new Set(settings.profileAccessRoles);

          if (action === 'add') {
            roles.add(role.id);
          } else {
            roles.delete(role.id);
          }

          roles.delete(everyoneRoleId);
          settings.profileAccessRoles = [...roles];
          store.save('settings', settings);
          await syncExistingProfileChannels(client, config, store);
          await interaction.editReply({ content: `Роль ${role.name} ${action === 'add' ? 'добавлена' : 'удалена'} из доступа к профилям. Права профильных каналов пересинхронизированы.` });
          return;
        }

        if (interaction.commandName === 'profiles-sort') {
          if (!hasAnyRole(interaction.member, config.roles.highrank) && !hasAnyRole(interaction.member, config.roles.profileAccess)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Недостаточно прав для сортировки профилей.' });
            return;
          }

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          await syncExistingProfileChannels(client, config, store);
          await interaction.editReply({ content: 'Профили пересортированы по ролям.' });
          return;
        }

        if (interaction.commandName === 'ticket-accept') {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const result = await acceptTicketByChoice(interaction, config, store, client, 'main');
          await interaction.editReply({ content: result.message });
          return;
        }

      }

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'ticket:accept-role') {
          const [choice] = interaction.values;
          const result = await acceptTicketByChoice(interaction, config, store, client, choice);
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: result.message });
          return;
        }

        if (interaction.customId.startsWith('mcl-roster-select:')) {
          const [, eventId, targetList] = interaction.customId.split(':');
          const events = store.load('events', {});
          const event = events[eventId];
          if (!event) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Событие не найдено.' });
            return;
          }

          const [selectedUserId] = interaction.values;
          const placedList = placeEventMember(event, selectedUserId, targetList);

          events[eventId] = event;
          store.save('events', events);
          await updateEventMessage(client, config, store, event);
          await interaction.reply({
            flags: MessageFlags.Ephemeral,
            content: `${memberTag(selectedUserId)} перенесен в ${placedList === 'main' ? 'основной состав' : 'резерв'}${targetList === 'main' && placedList === 'reserve' ? ', потому что основной состав заполнен' : ''}.`
          });
          await sendEventRosterDm(client, event, selectedUserId, 'join', placedList);
          return;
        }
      }

      if (interaction.isButton()) {
        if (interaction.customId.startsWith('tempvoice:')) {
          if (await handleTempVoiceButton(interaction, config, store)) {
            return;
          }
        }

        if (interaction.customId === 'apply_family' || interaction.customId === 'ticket:open') {
          await openModal(interaction, {
            id: 'ticket:create',
            title: 'Заявка в семью',
            inputs: [
              { id: 'nickname', label: 'Игровой ник', placeholder: 'Например: Toxis Heavyweight' },
              { id: 'age', label: 'Возраст', placeholder: 'Например: 19' },
              { id: 'experience', label: 'Опыт в семье / каптах', placeholder: 'Кратко опишите опыт', style: TextInputStyle.Paragraph },
              {
                id: 'replays',
                label: 'Откаты CAPT/MCL',
                placeholder: 'Ссылки на откаты; для TEST можно оставить пустым',
                style: TextInputStyle.Paragraph,
                required: false
              },
              { id: 'about', label: 'Почему хотите к нам', placeholder: 'Пара слов о себе', style: TextInputStyle.Paragraph }
            ]
          });
          return;
        }

        if (interaction.customId.startsWith('event:leave:')) {
          const [, , eventId] = interaction.customId.split(':');
          const events = store.load('events', {});
          const event = events[eventId];
          if (!event || (event.type !== 'mcl' && event.type !== 'capt')) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Событие не найдено.' });
            return;
          }

          const userId = interaction.user.id;
          removeFromEventRosters(event, userId);
          addEventLeaver(event, userId, 'кнопка');
          if (event.plusMessages) {
            delete event.plusMessages[userId];
          }

          events[eventId] = event;
          store.save('events', events);
          await updateEventMessage(client, config, store, event);
          await sendEventRosterDm(client, event, userId, 'leave');
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Вы выписаны.' });
          return;
        }

        if (interaction.customId === 'interaction:leave') {
          await sendLeaveEphemeralV2(interaction, config, store);
          return;
        }

        if (interaction.customId === 'interaction:profile') {
          if (!canUseProfileFeature(interaction.member, config)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Создавать личный профиль могут только участники с ролью MAIN, TEST или HEAVYWEIGHT.' });
            return;
          }
          await sendProfileEphemeralV2(interaction, config, store);
          return;
        }

        if (interaction.customId === 'utility:dismiss') {
          await interaction.update(simpleV2Payload(config, {
            title: `${emojiText(config, 'hwt_success', '')} Сообщение скрыто`.trim(),
            description: 'Это сообщение больше не требует действий.',
            color: config.theme.muted,
            includeDefaultImage: false
          }));
          return;
        }

        if (interaction.customId === 'leave:open-modal') {
          await openModal(interaction, {
            id: 'leave:submit',
            title: 'Оформление отпуска',
            inputs: [
              { id: 'reason', label: 'Причина отпуска', placeholder: 'Например: отдых / дела / учеба', style: TextInputStyle.Paragraph },
              { id: 'until', label: 'До какого времени', placeholder: 'Например: 30.04 22:00' }
            ]
          });
          return;
        }

        if (interaction.customId === 'leave:return') {
          const result = await endLeave(interaction.member, config, store);
          if (result.ok) {
            await sendLeaveLog(client, config, interaction.member, 'end', result);
          }
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: result.ok ? 'Отпуск завершен, роли восстановлены.' : result.message });
          return;
        }

        if (interaction.customId === 'profile:create') {
          if (!canUseProfileFeature(interaction.member, config)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Создать профиль могут только роли HEAVYWEIGHT и TEST.' });
            return;
          }

          const { channel } = await resolveProfileRecord(interaction.guild, store, interaction.user.id);
          if (channel) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Ваш профиль: <#${channel.id}>` });
            return;
          }

          await openModal(interaction, {
            id: 'profile:create-modal',
            title: 'Создание профиля',
            inputs: [
              { id: 'nickname', label: 'Ник', placeholder: 'Игровой ник' },
              { id: 'staticCode', label: 'Статик', placeholder: 'Например: 5312' }
            ]
          });
          return;
        }

        if (interaction.customId === 'profile:create-threads') {
          if (!canUseProfileFeature(interaction.member, config)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Управлять ветками профиля могут только роли HEAVYWEIGHT и TEST.' });
            return;
          }

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const { profile, channel } = await resolveProfileRecord(interaction.guild, store, interaction.user.id);
          if (!profile || !channel) {
            await interaction.editReply({ content: 'Сначала создайте личный профиль.' });
            return;
          }

          const result = await ensureProfileThreads(interaction.guild, config, store, profile, { createMissing: true });
          const createdText = result.created.length
            ? `Созданы ветки: ${result.created.map((def) => def.name).join(', ')}.`
            : 'Все профильные ветки уже созданы.';
          const missingText = result.missing.length
            ? ` Не удалось создать: ${result.missing.map((def) => def.name).join(', ')}. Проверьте права бота на создание веток.`
            : '';
          await interaction.editReply({ content: `${createdText}${missingText}` });
          return;
        }

        if (interaction.customId === 'profile:recreate-threads') {
          if (!canUseProfileFeature(interaction.member, config)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Управлять ветками профиля могут только роли HEAVYWEIGHT и TEST.' });
            return;
          }

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const { profile, channel } = await resolveProfileRecord(interaction.guild, store, interaction.user.id);
          if (!profile || !channel) {
            await interaction.editReply({ content: 'Сначала создайте личный профиль.' });
            return;
          }

          const result = await recreateProfileThreads(interaction.guild, config, store, profile);
          const createdText = result.created?.length
            ? `Ветки пересозданы: ${result.created.map((def) => def.name).join(', ')}.`
            : 'Не удалось пересоздать ветки.';
          const missingText = result.missing?.length
            ? ` Не удалось создать: ${result.missing.map((def) => def.name).join(', ')}. Проверьте права бота.`
            : '';
          await interaction.editReply({ content: `${createdText}${missingText}` });
          return;
        }

        if (interaction.customId === 'profile:recreate') {
          if (!canUseProfileFeature(interaction.member, config)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Пересоздать профиль могут только роли HEAVYWEIGHT и TEST.' });
            return;
          }

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          const result = await recreateProfileChannel(interaction, config, store, client);
          await interaction.editReply({ content: result.message });
          return;
        }

        if (interaction.customId === 'ticket:accept') {
          if (!canManageTickets(interaction.member, config)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Недостаточно прав для управления заявкой.' });
            return;
          }

          const result = await acceptTicketByChoice(interaction, config, store, client, 'main');
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: result.message });
          return;
        }

        if (interaction.customId === 'ticket:reject') {
          await openModal(interaction, {
            id: 'ticket:reject-modal',
            title: 'Отклонение заявки',
            inputs: [
              {
                id: 'reason',
                label: 'Причина отклонения',
                placeholder: 'Укажите кратко и по делу',
                style: TextInputStyle.Paragraph
              }
            ]
          });
          return;
        }

        if (interaction.customId === 'ticket:interview') {
          const result = await markTicketInterview(interaction, config, store, client);
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: result.message });
          return;
        }

        if (interaction.customId === 'ticket:delete') {
          const result = await deleteTicket(interaction, config, store, client);
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: result.message });
          if (result.ok) {
            setTimeout(() => {
              interaction.channel?.delete?.('Ticket deleted by recruiter button').catch(() => {});
            }, 1500);
          }
          return;
        }

        if (interaction.customId === 'report:rp') {
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'РП отчеты отключены.' });
          return;
        }

        if (interaction.customId === 'report:gg') {
          const reportType = 'gg';
          await openModal(interaction, {
            id: `report:submit:${reportType}`,
            title: 'Новый скрин ГГ',
            inputs: [
              { id: 'eventName', label: 'Название мероприятия', placeholder: 'Например: Family War' },
              { id: 'link', label: 'Ссылка на фотохостинг', placeholder: 'https://...' },
              { id: 'note', label: 'Комментарий', placeholder: 'Необязательно', required: false, style: TextInputStyle.Paragraph }
            ]
          });
          return;
        }

        if (interaction.customId === 'afk:start') {
          await openModal(interaction, {
            id: 'afk:start-modal',
            title: 'Уйти в AFK',
            inputs: [
              { id: 'reason', label: 'Причина', placeholder: 'Учеба / работа / отдых', style: TextInputStyle.Paragraph },
              { id: 'until', label: 'На сколько / до какого времени', placeholder: 'Например: 2ч, 30м, 21:30, 29.07 23:00' }
            ]
          });
          return;
        }

        if (interaction.customId === 'afk:end') {
          const afk = store.load('afk', {});
          if (!afk[interaction.user.id]) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Вы не находитесь в AFK.' });
            return;
          }

          delete afk[interaction.user.id];
          store.save('afk', afk);
          await refreshAfkPanel(client, config, store);
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Вы вернулись из AFK.' });
          return;
        }

        if (interaction.customId === 'cheatcheck:request') {
          await openModal(interaction, {
            id: 'cheatcheck:request-modal',
            title: 'Запрос на проверку',
            inputs: [
              {
                id: 'nickname',
                label: 'Ник / статик',
                placeholder: 'Например: Nick_Name 12345',
                required: false
              },
              {
                id: 'reason',
                label: 'Комментарий',
                placeholder: 'Коротко: когда удобно пройти проверку / что важно знать',
                required: false,
                style: TextInputStyle.Paragraph
              }
            ]
          });
          return;
        }

        if (interaction.customId.startsWith('cheatcheck:claim:')) {
          if (!canManageCheatChecks(interaction.member, config)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Кнопка доступна только high и Cheat Hunter.' });
            return;
          }

          const targetId = interaction.customId.split(':')[2];
          const requests = store.load('cheatChecks', {});
          const request = requests[interaction.message.id] || {
            requesterId: targetId,
            channelId: interaction.channelId,
            messageId: interaction.message.id,
            values: {},
            history: []
          };
          if (request.status && request.status !== 'pending') {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Этот запрос уже взят или завершен.' });
            return;
          }

          request.status = 'claimed';
          request.claimedById = interaction.user.id;
          request.claimedAt = new Date().toISOString();
          request.history = [...ensureArray(request.history), cheatCheckHistoryEntry('claimed', interaction.user.id)];
          requests[interaction.message.id] = request;
          store.save('cheatChecks', requests);

          await interaction.update(payloadForPanelEdit(
            buildCheatCheckNotificationPayload(config, request.values || {}, targetId, request),
            interaction.message
          ));
          await sendCheatCheckDm(client, config, targetId, {
            title: `${emojiText(config, 'hwt_staff', '')} Проверку взяли в работу`.trim(),
            description: `Вашу проверку взял ${memberTag(interaction.user.id)}. Ожидайте дальнейших действий.`,
            color: config.theme.accent
          });
          await sendCheatCheckLifecycleLog(client, config, request, 'Взял проверку', interaction.user.id);
          return;
        }

        if (interaction.customId.startsWith('cheatcheck:clean:')) {
          if (!canManageCheatChecks(interaction.member, config)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Кнопка доступна только high и Cheat Hunter.' });
            return;
          }

          const targetId = interaction.customId.split(':')[2];
          const verifiedRoleId = getCheatVerifiedRoleId(config);
          const targetMember = targetId ? await interaction.guild.members.fetch(targetId).catch(() => null) : null;
          if (!targetMember) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Не удалось найти пользователя для выдачи роли.' });
            return;
          }
          if (!interaction.guild.roles.cache.has(verifiedRoleId)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Роль проверки ${roleTag(verifiedRoleId)} не найдена на сервере.` });
            return;
          }

          await interaction.deferUpdate();
          const requests = store.load('cheatChecks', {});
          const request = requests[interaction.message.id] || {};
          if (['clean', 'rejected'].includes(request.status)) {
            await interaction.followUp({ flags: MessageFlags.Ephemeral, content: 'Этот запрос уже завершен.' });
            return;
          }
          if (request.claimedById && String(request.claimedById) !== String(interaction.user.id) && !hasAnyRole(interaction.member, config.roles.highrank)) {
            await interaction.followUp({ flags: MessageFlags.Ephemeral, content: `Эту проверку уже взял ${memberTag(request.claimedById)}.` });
            return;
          }
          if (!targetMember.roles.cache.has(verifiedRoleId)) {
            await targetMember.roles.add(verifiedRoleId, `Cheat check marked clean by ${interaction.user.tag}`);
          }
          requests[interaction.message.id] = {
            ...request,
            requesterId: targetId,
            channelId: interaction.channelId,
            messageId: interaction.message.id,
            status: 'clean',
            approvedById: interaction.user.id,
            approvedAt: new Date().toISOString(),
            history: [...ensureArray(request.history), cheatCheckHistoryEntry('clean', interaction.user.id)]
          };
          store.save('cheatChecks', requests);

          await interaction.message.edit(payloadForPanelEdit(
            buildCheatCheckNotificationPayload(config, request.values || {}, targetId, requests[interaction.message.id]),
            interaction.message
          )).catch(() => {});
          await sendCheatCheckDm(client, config, targetId, {
            title: `${emojiText(config, 'hwt_success', '')} Проверка пройдена`.trim(),
            description: `Проверка завершена как **чистая**. Вам выдана роль ${roleTag(verifiedRoleId)}.`,
            color: config.theme.success
          });
          await sendCheatCheckLifecycleLog(client, config, requests[interaction.message.id], 'Чистый', interaction.user.id, [
            `**Выдана роль:** ${roleTag(verifiedRoleId)}`
          ]);
          await interaction.followUp({
            flags: MessageFlags.Ephemeral,
            content: `Роль ${roleTag(verifiedRoleId)} выдана ${memberTag(targetId)}.`
          });
          return;
        }

        if (interaction.customId.startsWith('cheatcheck:reject:')) {
          if (!canManageCheatChecks(interaction.member, config)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Кнопка доступна только high и Cheat Hunter.' });
            return;
          }

          const targetId = interaction.customId.split(':')[2];
          await interaction.deferUpdate();

          const requests = store.load('cheatChecks', {});
          const request = requests[interaction.message.id] || {};
          if (['clean', 'rejected'].includes(request.status)) {
            await interaction.followUp({ flags: MessageFlags.Ephemeral, content: 'Этот запрос уже завершен.' });
            return;
          }
          if (request.claimedById && String(request.claimedById) !== String(interaction.user.id) && !hasAnyRole(interaction.member, config.roles.highrank)) {
            await interaction.followUp({ flags: MessageFlags.Ephemeral, content: `Эту проверку уже взял ${memberTag(request.claimedById)}.` });
            return;
          }
          requests[interaction.message.id] = {
            ...request,
            requesterId: targetId,
            channelId: interaction.channelId,
            messageId: interaction.message.id,
            status: 'rejected',
            rejectedById: interaction.user.id,
            rejectedAt: new Date().toISOString(),
            history: [...ensureArray(request.history), cheatCheckHistoryEntry('rejected', interaction.user.id)]
          };
          store.save('cheatChecks', requests);

          await interaction.message.edit(payloadForPanelEdit(
            buildCheatCheckNotificationPayload(config, request.values || {}, targetId, requests[interaction.message.id]),
            interaction.message
          )).catch(() => {});
          await sendCheatCheckDm(client, config, targetId, {
            title: `${emojiText(config, 'hwt_error', '')} Проверка отклонена`.trim(),
            description: `Запрос на проверку был отклонен сотрудником ${memberTag(interaction.user.id)}.`,
            color: config.theme.danger
          });
          await sendCheatCheckLifecycleLog(client, config, requests[interaction.message.id], 'Отклонено', interaction.user.id);
          await interaction.followUp({
            flags: MessageFlags.Ephemeral,
            content: `Запрос на проверку ${memberTag(targetId)} отклонен.`
          });
          return;
        }

        if (interaction.customId.startsWith('mcl-roster:')) {
          const [, eventId, targetList] = interaction.customId.split(':');
          await handleMclRosterAction(interaction, config, store, eventId, targetList);
          return;
        }

        if (interaction.customId.startsWith('event:tagall:')) {
          const [, , eventId] = interaction.customId.split(':');
          const events = store.load('events', {});
          const event = events[eventId];
          if (!event) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Событие не найдено.' });
            return;
          }
          if (!hasAnyRole(interaction.member, config.roles.highrank)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Недостаточно прав для тега списка.' });
            return;
          }

          const users = getEventRosterUserIds(event);
          if (!users.length) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Список регистрации пока пуст.' });
            return;
          }

          if ((event.type === 'mcl' || event.type === 'capt') && interaction.channelId !== event.threadId) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Тегнуть список можно только в ветке: <#${event.threadId}>.` });
            return;
          }

          await sendEventMentions(interaction, config, users, '**Весь список:**', 'Тег списка отправлен в ветку.');
          return;
        }

        if (interaction.customId.startsWith('event:tagnovoice:')) {
          const [, , eventId] = interaction.customId.split(':');
          const events = store.load('events', {});
          const event = events[eventId];
          if (!event) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Событие не найдено.' });
            return;
          }
          if (!hasAnyRole(interaction.member, config.roles.highrank)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Недостаточно прав для тега списка.' });
            return;
          }

          const users = getEventRosterUserIds(event);
          if (!users.length) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Список регистрации пока пуст.' });
            return;
          }

          if ((event.type === 'mcl' || event.type === 'capt') && interaction.channelId !== event.threadId) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Тегнуть список можно только в ветке: <#${event.threadId}>.` });
            return;
          }

          const missingVoice = getUsersNotInRequesterVoice(interaction, users);
          if (!missingVoice.ok) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: missingVoice.message });
            return;
          }
          if (!missingVoice.userIds.length) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Все из списка уже находятся в вашем голосовом канале.' });
            return;
          }

          await sendEventMentions(
            interaction,
            config,
            missingVoice.userIds,
            `**Нет в войсе ${interaction.member.voice.channel}:**`,
            'Тег тех, кого нет в вашем войсе, отправлен в ветку.'
          );
          return;
        }

        if (interaction.customId.startsWith('event:request-replays:')) {
          const [, , eventId] = interaction.customId.split(':');
          await requestEventReplays(interaction, config, store, client, eventId);
          return;
        }
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('tempvoice:')) {
          if (await handleTempVoiceModal(interaction, config, store)) {
            return;
          }
        }

        if (interaction.customId === 'ticket:create' || interaction.customId.startsWith('ticket:create:')) {
          const replays = (interaction.fields.fields.get('replays')?.value || '').trim();
          const result = await createTicketV2(interaction, config, store, {
            nickname: interaction.fields.getTextInputValue('nickname'),
            age: interaction.fields.getTextInputValue('age'),
            experience: interaction.fields.getTextInputValue('experience'),
            replays,
            about: interaction.fields.getTextInputValue('about')
          }, client);

          await interaction.reply({
            flags: MessageFlags.Ephemeral,
            content: result.alreadyExists ? `У вас уже есть открытая заявка: <#${result.channelId}>` : `Заявка создана: <#${result.channelId}>`
          });
          return;
        }

        if (interaction.customId === 'leave:submit') {
          const result = await applyLeave(interaction.member, config, store, {
            reason: interaction.fields.getTextInputValue('reason'),
            until: interaction.fields.getTextInputValue('until')
          });

          if (result.ok) {
            await sendLeaveLog(client, config, interaction.member, 'start', {
              reason: result.leave.reason,
              until: result.leave.until,
              removedRoleIds: result.leave.removedRoleIds
            });
          }

          await interaction.reply({ flags: MessageFlags.Ephemeral, content: result.ok ? 'Отпуск оформлен.' : result.message });
          return;
        }

        if (interaction.customId === 'profile:create-modal') {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          if (!canUseProfileFeature(interaction.member, config)) {
            await interaction.editReply({ content: 'Создать профиль могут только роли HEAVYWEIGHT и TEST.' });
            return;
          }

          const result = await createProfileChannelV2(interaction, config, store, {
            nickname: interaction.fields.getTextInputValue('nickname'),
            staticCode: interaction.fields.getTextInputValue('staticCode')
          }, client);

          await interaction.editReply({
            content: result.alreadyExists
              ? `Профиль уже существует: <#${result.channelId}>`
              : result.recreated
                ? `Профиль создан заново: <#${result.channelId}>`
                : `Профиль создан: <#${result.channelId}>`
          });
          return;
        }

        if (interaction.customId.startsWith('report:submit:')) {
          if (!canUseProfileFeature(interaction.member, config)) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Отчеты через профиль доступны только ролям HEAVYWEIGHT и TEST.' });
            return;
          }

          const reportType = interaction.customId.split(':')[2];
          if (reportType !== 'gg') {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'РП отчеты отключены.' });
            return;
          }
          const result = await submitReport(interaction, config, store, reportType, {
            eventName: interaction.fields.getTextInputValue('eventName'),
            link: interaction.fields.getTextInputValue('link'),
            note: interaction.fields.getTextInputValue('note')
          });

          await interaction.reply({
            flags: MessageFlags.Ephemeral,
            content: result.ok
              ? `Отчет сохранен. ${result.threadId ? `Ветка: <#${result.threadId}>` : `Профиль: <#${result.channelId}>`}`
              : result.message
          });
          return;
        }

        if (interaction.customId === 'afk:start-modal') {
          const reason = interaction.fields.getTextInputValue('reason')?.trim();
          const until = interaction.fields.getTextInputValue('until')?.trim();
          const expiresAt = parseAfkUntil(until);
          if (!reason || !expiresAt) {
            await interaction.reply({
              flags: MessageFlags.Ephemeral,
              content: 'Укажите причину и понятное время AFK. Примеры: `30м`, `2ч`, `1д`, `21:30`, `29.07 23:00`.'
            });
            return;
          }

          const afk = store.load('afk', {});
          afk[interaction.user.id] = {
            userId: interaction.user.id,
            reason,
            until,
            expiresAt: expiresAt.toISOString(),
            createdAt: new Date().toISOString()
          };
          store.save('afk', afk);
          await refreshAfkPanel(client, config, store);
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: `AFK-статус добавлен до ${formatDate(expiresAt)}.` });
          return;
        }

        if (interaction.customId === 'cheatcheck:request-modal') {
          const result = await sendCheatCheckRequest(interaction, config, client, {
            nickname: interaction.fields.getTextInputValue('nickname')?.trim(),
            reason: interaction.fields.getTextInputValue('reason')?.trim()
          }, store);
          await interaction.reply({
            flags: MessageFlags.Ephemeral,
            content: result.ok
              ? `Запрос на проверку отправлен: <#${result.channelId}>.`
              : result.message
          });
          return;
        }

        if (interaction.customId === 'ticket:reject-modal') {
          const reason = interaction.fields.getTextInputValue('reason')?.trim();
          if (!reason) {
            await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Укажите причину отклонения.' });
            return;
          }
          const result = await rejectTicket(interaction, config, store, client, reason);
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: result.message });
          if (result.ok) {
            await interaction.channel.delete('Ticket resolved: rejected').catch(() => {});
          }
          return;
        }
      }
    } catch (error) {
      console.error(error);
      const isProfileInteraction =
        interaction.customId?.startsWith?.('profile:') ||
        interaction.customId === 'interaction:profile';
      const message = isProfileInteraction ? profileErrorMessage(error) : 'Произошла ошибка при обработке действия.';
      if (interaction.isRepliable()) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ flags: MessageFlags.Ephemeral, content: message }).catch(() => {});
        } else {
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: message }).catch(() => {});
        }
      }
    }
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) {
      return;
    }

    if (!message.guildId) {
      await handleReplayRequestDm(message, config, store, client).catch((error) => {
        console.error('Failed to handle replay request DM', error);
      });
      return;
    }

    const trimmed = message.content.trim();
    const manualPlusTargetId = parseManualPlusTargetId(trimmed);
    if (trimmed !== '+' && trimmed !== '-' && !manualPlusTargetId) {
      return;
    }

    const events = store.load('events', {});
    const event = Object.values(events).find((entry) => entry.threadId === message.channelId);
    if (!event || !event.registrationOpen) {
      return;
    }

    if (manualPlusTargetId) {
      const authorMember = message.member || await message.guild.members.fetch(message.author.id).catch(() => null);
      if (!authorMember || !hasAnyRole(authorMember, config.roles.highrank)) {
        return;
      }

      event.plusMessages = event.plusMessages || {};
      event.plusMessages[manualPlusTargetId] = message.id;
      const placedList = placeEventMember(event, manualPlusTargetId, 'main');
      addEventLeaver(event, manualPlusTargetId, 'manual-add', message.author.id);

      events[event.id] = event;
      store.save('events', events);
      await reactWithDone(message, config);
      await updateEventMessage(client, config, store, event);
      await sendEventRosterDm(client, event, manualPlusTargetId, 'join', placedList);
      return;
    }

    const userId = message.author.id;
    if (trimmed === '-') {
      removeFromEventRosters(event, userId);
      addEventLeaver(event, userId, '-');
      if (event.plusMessages) {
        delete event.plusMessages[userId];
      }

      events[event.id] = event;
      store.save('events', events);
      await updateEventMessage(client, config, store, event);
      await sendEventRosterDm(client, event, userId, 'leave');
      return;
    }

    event.plusMessages = event.plusMessages || {};
    event.plusMessages[userId] = message.id;
    removeEventLeaver(event, userId);
    events[event.id] = event;
    store.save('events', events);
  });

  client.on(Events.MessageDelete, async (message) => {
    try {
      if (!message) return;
      if (message.partial) {
        await message.fetch().catch(() => {});
      }
      if (message.author?.bot) return;

      const events = store.load('events', {});
      const event = Object.values(events).find((entry) => entry.threadId === message.channelId);
      if (!event || !event.registrationOpen) {
        return;
      }

      const trackedUserId = findTrackedPlusUserId(event, message.id) || message.author?.id;
      if (!trackedUserId || !event.plusMessages || event.plusMessages[trackedUserId] !== message.id) {
        return;
      }

      const actorId = message.author?.id && message.author.id !== trackedUserId ? message.author.id : null;
      removeFromEventRosters(event, trackedUserId);
      addEventLeaver(event, trackedUserId, actorId ? 'manual-remove' : 'удалил +', actorId);
      delete event.plusMessages[trackedUserId];

      events[event.id] = event;
      store.save('events', events);
      await updateEventMessage(client, config, store, event);
      await sendEventRosterDm(client, event, trackedUserId, 'leave');
    } catch (error) {
      console.error(error);
    }
  });

  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    const context = await resolveEventReactionContext(reaction, user, config, store);
    if (!context) return;
    const { events, event, applicantId, isMain } = context;

    const placedList = placeEventMember(event, applicantId, isMain ? 'main' : 'reserve');

    events[event.id] = event;
    store.save('events', events);
    await updateEventMessage(client, config, store, event);
    await sendEventRosterDm(client, event, applicantId, 'join', placedList);
  });

  client.on(Events.MessageReactionRemove, async (reaction, user) => {
    const context = await resolveEventReactionContext(reaction, user, config, store);
    if (!context) return;
    const { events, event, applicantId } = context;

    removeFromEventRosters(event, applicantId);
    addEventLeaver(event, applicantId, 'reaction-remove', user.id);
    events[event.id] = event;
    store.save('events', events);
    await updateEventMessage(client, config, store, event);
    await sendEventRosterDm(client, event, applicantId, 'leave');
  });

  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (newMember.guild.id !== config.guildId) {
      return;
    }

    await ensureProtectedMember(newMember, 'member update').catch((error) => {
      console.error(`Failed to ensure protected member ${newMember.id} after member update`, error);
    });

    const oldRoles = [...oldMember.roles.cache.keys()].sort().join(',');
    const newRoles = [...newMember.roles.cache.keys()].sort().join(',');
    if (oldRoles === newRoles) {
      return;
    }

    if (!canUseProfileFeature(newMember, config)) {
      const profiles = store.load('profiles', {});
      if (profiles[newMember.id]) {
        await deleteMemberProfile(newMember, config, store, client, {
          deleteReason: 'Profile owner roles removed',
          logReason: 'потерял роли доступа к профилю'
        }).catch((error) => {
          console.error(`Failed to delete profile for ${newMember.id} after role removal`, error);
        });
        return;
      }
    }

    await sortSingleProfileChannelByMember(newMember, config, store).catch((error) => {
      console.error(`Failed to sort profile for ${newMember.id} after role update`, error);
    });
  });

  client.on(Events.GuildMemberAdd, async (member) => {
    if (member.guild.id !== config.guildId) {
      return;
    }

    await ensureProtectedMember(member, 'member add').catch((error) => {
      console.error(`Failed to ensure protected member ${member.id} after member add`, error);
    });
  });

  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (newState.guild.id !== config.guildId) {
      return;
    }

    const member = newState.member || oldState.member;
    if (member?.user?.bot) {
      return;
    }

    const wasInVoice = Boolean(oldState.channelId);
    const isInVoice = Boolean(newState.channelId);
    if (!wasInVoice && isInVoice) {
      startAuraVoiceSession(store, newState.id);
    } else if (wasInVoice && !isInVoice) {
      endAuraVoiceSession(store, oldState.id);
    }

    await handleTempVoiceStateUpdate(oldState, newState, config, store).catch((error) => {
      console.error('Failed to handle temporary voice state update', error);
    });
  });

  client.on(Events.GuildMemberRemove, async (member) => {
    if (member.guild.id !== config.guildId) {
      return;
    }

    await sendServerLeaveLog(client, config, member);
    await deleteMemberProfile(member, config, store, client, {
      deleteReason: 'Profile owner left the guild',
      logReason: 'вышел с сервера'
    });
  });

  await client.login(process.env.BOT_TOKEN);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
