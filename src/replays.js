const path = require('node:path');
const fs = require('node:fs');
let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch {
  // Fallback for Node versions without built-in `node:sqlite`
  DatabaseSync = require('better-sqlite3');
}
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  EmbedBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  ModalBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  TextInputBuilder,
  TextInputStyle,
  UserSelectMenuBuilder
} = require('discord.js');

const MODE_DISPLAY = {
  MCL: { emoji: '⚔️', emojiKey: 'hwt_mcl', label: 'MCL/VZZ' },
  VZZ: { emoji: '⚔️', emojiKey: 'hwt_mcl', label: 'MCL/VZZ' },
  KAPT: { emoji: '🛡️', emojiKey: 'hwt_capt', label: 'CAPT' },
  GG: { emoji: '🎯', emojiKey: 'hwt_gg', label: 'GG' },
  QUAL: { emoji: '🏆', emojiKey: 'hwt_rank', label: 'Квалы' },
  OTHER: { emoji: '🎥', emojiKey: 'hwt_media', label: 'Прочее' }
};

const REPLAY_PANEL_KEY = 'replay_panel_message_id';
const REPLAY_PANEL_CHANNEL_KEY = 'replay_panel_channel_id';
const DEFAULT_REPLAY_PANEL_CHANNEL_ID = '';
const PROFILE_REPLAY_THREADS = {
  MCL: { key: 'mcl', name: 'MCL', title: 'MCL', legacyNames: ['# MCL'] },
  VZZ: { key: 'mcl', name: 'MCL', title: 'MCL', legacyNames: ['# MCL'] },
  KAPT: { key: 'capt', name: 'CAPT', title: 'CAPT', legacyNames: ['# CAPT'] },
  GG: { key: 'gg', name: 'GG', title: 'GG', legacyNames: ['#GG', '# GG'] },
  OTHER: { key: 'replays', name: 'Replays', title: 'Replays', legacyNames: ['# Replays'] },
  QUAL: { key: 'replays', name: 'Replays', title: 'Replays', legacyNames: ['# Replays'] }
};
const DEFAULT_PROFILE_ROLE_DEFS = [
  { label: 'MAIN', roleIds: [], roleConfigKey: 'main' },
  { label: 'TEST MAIN', roleIds: [], roleConfigKey: 'testMain' },
  { label: 'HEAVYWEIGHT', roleIds: [], roleConfigKey: 'heavyweight' },
  { label: 'TEST', roleIds: [], roleConfigKey: 'test' }
];
const PANEL_STRIPE_COLOR = 0xffffff;
const PANEL_LOGO_FILE_NAME = 'heavyweight-logo.png';
const PANEL_LOGO_PATH = path.join(process.cwd(), 'assets', PANEL_LOGO_FILE_NAME);
const PANEL_LOGO_ATTACHMENT_URL = `attachment://${PANEL_LOGO_FILE_NAME}`;

function formatMode(mode, config = null) {
  const data = MODE_DISPLAY[mode] || MODE_DISPLAY.OTHER;
  const emoji = config?.emojis?.[data.emojiKey] || data.emoji;
  return `${emoji} ${data.label}`;
}

function normalizeReplayMode(rawValue) {
  const raw = String(rawValue || '').trim().toLowerCase();
  if (['mcl', 'мcl', 'мкл'].includes(raw)) {
    return 'MCL';
  }
  if (['vzz', 'взз'].includes(raw)) {
    return 'MCL';
  }
  if (['капт', 'kapt', 'capt', 'cap'].includes(raw)) {
    return 'KAPT';
  }
  if (['gg', 'gungame', 'gun game', 'гг', 'гангейм'].includes(raw)) {
    return 'GG';
  }
  if (['квалы', 'квала', 'qual', 'quals', 'квл'].includes(raw)) {
    return 'QUAL';
  }
  return 'OTHER';
}

function getPrimaryProfileRole(member, config) {
  const defs = config.replays?.profileRoleDefs || DEFAULT_PROFILE_ROLE_DEFS;
  for (const def of defs) {
    const configuredRoleId = def.roleConfigKey ? config.roles?.[def.roleConfigKey] : null;
    const roleIds = [...new Set([...def.roleIds, configuredRoleId].filter(Boolean))];
    const matchedRoleId = roleIds.find((roleId) => member?.roles?.cache?.has?.(roleId));
    if (matchedRoleId) {
      return { label: def.label, mention: `<@&${matchedRoleId}>` };
    }
  }

  return { label: 'Нет', mention: '`Нет`' };
}

function safeCustomEmoji(value) {
  const match = typeof value === 'string' ? value.match(/^<a?:([^:]+):(\d+)>$/) : null;
  if (match) {
    return { name: match[1], id: match[2] };
  }
  return value || undefined;
}

function isReviewer(member, config) {
  if (!member) {
    return false;
  }
  const reviewerRoles = Array.isArray(config.replays?.reviewerRoleIds) ? config.replays.reviewerRoleIds : [];
  if (!reviewerRoles.length) {
    return false;
  }
  return reviewerRoles.some((roleId) => member.roles?.cache?.has?.(roleId));
}

function primaryReviewerMention(config) {
  const reviewerRoles = Array.isArray(config.replays?.reviewerRoleIds) ? config.replays.reviewerRoleIds : [];
  return reviewerRoles.length ? `<@&${reviewerRoles[0]}>` : null;
}

function panelBannerUrl(config) {
  return config.images?.replayPanel || config.replays?.bannerUrl || config.images?.globalPanel || null;
}

function panelThumbnailUrl(config) {
  return config.images?.replayThumbnail || config.images?.panelThumbnail || (fs.existsSync(PANEL_LOGO_PATH) ? PANEL_LOGO_ATTACHMENT_URL : null);
}

function textDisplay(content) {
  const value = String(content || '-');
  return new TextDisplayBuilder().setContent(value.length > 4000 ? `${value.slice(0, 3997)}...` : value);
}

function replayPanelPayload(config, embed, components = [], options = {}) {
  const data = embed?.data || {};
  const container = new ContainerBuilder()
    .setAccentColor(data.color ?? PANEL_STRIPE_COLOR);

  const imageUrl = data.image?.url || (options.includeDefaultBanner === false ? null : panelBannerUrl(config));
  if (imageUrl) {
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder().setURL(imageUrl).setDescription('Replay banner')
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
  const thumbnailUrl = data.thumbnail?.url || panelThumbnailUrl(config);
  if (thumbnailUrl) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(textDisplay(header || ' '))
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(thumbnailUrl).setDescription('HEAVYWEIGHT logo'))
    );
  } else if (header) {
    container.addTextDisplayComponents(textDisplay(header));
  }

  for (const field of data.fields || []) {
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

  for (const row of components) {
    container.addActionRowComponents(row);
  }

  const payload = {
    components: [container],
    flags: MessageFlags.IsComponentsV2 | (options.ephemeral ? MessageFlags.Ephemeral : 0)
  };
  if (options.allowedMentions) {
    payload.allowedMentions = options.allowedMentions;
  }
  if (JSON.stringify(container.toJSON()).includes(PANEL_LOGO_ATTACHMENT_URL) && fs.existsSync(PANEL_LOGO_PATH)) {
    payload.files = [{ attachment: PANEL_LOGO_PATH, name: PANEL_LOGO_FILE_NAME }];
  }
  return payload;
}

function loadProfiles(store = null) {
  if (store?.load) {
    return store.load('profiles', {});
  }

  const profilesPath = path.join(process.cwd(), 'data', 'profiles.json');
  try {
    return JSON.parse(fs.readFileSync(profilesPath, 'utf8'));
  } catch {
    return {};
  }
}

function saveProfiles(store, profiles) {
  if (store?.save) {
    store.save('profiles', profiles);
  }
}

async function resolveReplayProfileThread(client, store, profile, mode = 'OTHER') {
  const channel = await client.channels.fetch(profile.channelId).catch(() => null);
  if (!channel?.isTextBased?.() || !channel.threads) {
    return { ok: false, reason: 'channel-missing' };
  }

  const threadDef = PROFILE_REPLAY_THREADS[mode] || PROFILE_REPLAY_THREADS.OTHER;
  profile.profileThreads = profile.profileThreads || {};
  const storedId = profile.profileThreads[threadDef.key];
  if (storedId) {
    const storedThread = await client.channels.fetch(storedId).catch(() => null);
    if (storedThread?.isThread?.() && storedThread.parentId === channel.id && storedThread.isTextBased?.()) {
      if (storedThread.members?.add && profile.userId) {
        await storedThread.members.add(profile.userId).catch(() => {});
      }
      return { ok: true, channel: storedThread, threadId: storedThread.id };
    }
  }

  const threadNames = [threadDef.name, ...(Array.isArray(threadDef.legacyNames) ? threadDef.legacyNames : [])];
  let thread = channel.threads.cache.find((item) => threadNames.includes(item.name)) || null;
  if (!thread) {
    const starterMessage = await channel.send({ content: `**${threadDef.title || threadDef.name}**` }).catch(() => null);
    thread = starterMessage
      ? await starterMessage.startThread({
        name: threadDef.name,
        autoArchiveDuration: 1440,
        reason: 'Profile replay thread setup'
      }).catch(() => null)
      : await channel.threads.create({
        name: threadDef.name,
        autoArchiveDuration: 1440,
        reason: 'Profile replay thread setup'
      }).catch(() => null);
  }

  if (!thread?.isTextBased?.()) {
    return { ok: false, reason: 'thread-missing', channelId: channel.id };
  }
  if (thread.members?.add && profile.userId) {
    await thread.members.add(profile.userId).catch(() => {});
  }

  const profiles = loadProfiles(store);
  const latestProfile = profiles[profile.userId] || profile;
  latestProfile.profileThreads = latestProfile.profileThreads || {};
  latestProfile.profileThreads[threadDef.key] = thread.id;
  profiles[latestProfile.userId] = latestProfile;
  saveProfiles(store, profiles);

  return { ok: true, channel: thread, threadId: thread.id };
}

function buildReplayPanelEmbed(config) {
  const embed = new EmbedBuilder()
    .setColor(PANEL_STRIPE_COLOR)
    .setTitle(`${config.emojis?.hwt_replay || '🎥'} REPLAYS CHECK`)
    .setDescription([
      'Панель загрузки и проверки откатов.',
      '',
      'Загрузите YouTube / RuTube ссылку, выберите тип отката и дождитесь разбора от куратора.'
    ].join('\n'))
    .addFields(
      {
        name: `${config.emojis?.hwt_replay || '🎬'} КАК ЭТО РАБОТАЕТ`,
        value: [
          '• Нажмите `Загрузить реплей`.',
          '• Выберите тип: `MCL/VZZ`, `CAPT` или `Прочее`.',
          '• Оставьте ссылку и комментарий, если он нужен.'
        ].join('\n'),
        inline: false
      },
      {
        name: `${config.emojis?.hwt_apply || '📌'} ДЛЯ ИГРОКОВ`,
        value: [
          '• Удобная отправка MCL/VZZ, CAPT и других откатов.',
          '• Разборы сохраняются в базе.',
          '• Прогресс можно посмотреть прямо из панели.'
        ].join('\n'),
        inline: true
      },
      {
        name: `${config.emojis?.hwt_check || '🧾'} ДЛЯ КУРАТОРОВ`,
        value: [
          '• Очередь новых откатов.',
          '• Быстрое взятие на разбор.',
          '• Комментарии игроку после проверки.'
        ].join('\n'),
        inline: true
      }
    )
    .setFooter({ text: 'Replay Review' });

  const bannerUrl = panelBannerUrl(config);
  if (bannerUrl) {
    embed.setImage(bannerUrl);
  }
  const thumbnailUrl = panelThumbnailUrl(config);
  if (thumbnailUrl) {
    embed.setThumbnail(thumbnailUrl);
  }

  return embed;
}

function buildReplayPanelComponents(config) {
  const emojis = config.emojis || {};
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('replay:submit')
        .setLabel('Загрузить реплей')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(safeCustomEmoji(emojis.hwt_upload) || safeCustomEmoji(emojis.hwt_replay) || safeCustomEmoji(emojis.done) || '✅'),
      new ButtonBuilder()
        .setCustomId('replay:queue')
        .setLabel('Очередь')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(safeCustomEmoji(emojis.hwt_pending) || safeCustomEmoji(emojis.hwt_replay) || '⏳'),
      new ButtonBuilder()
        .setCustomId('replay:progress')
        .setLabel('Мой прогресс')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(safeCustomEmoji(emojis.hwt_progress) || safeCustomEmoji(emojis.hwt_media) || '📊'),
      new ButtonBuilder()
        .setCustomId('replay:leaderboard')
        .setLabel('Рейтинг')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(safeCustomEmoji(emojis.hwt_rank) || safeCustomEmoji(emojis.hwt_check) || '🏆'),
      new ButtonBuilder()
        .setCustomId('replay:playerpick')
        .setLabel('Игрок')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(safeCustomEmoji(emojis.hwt_profile) || safeCustomEmoji(emojis.profile) || '👤')
    )
  ];
}

function modeSelectEmoji(config, mode) {
  const data = MODE_DISPLAY[mode] || MODE_DISPLAY.OTHER;
  return safeCustomEmoji(config?.emojis?.[data.emojiKey]) || data.emoji;
}

function buildReplaySubmitModeComponents(config) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('replay:submit-mode')
        .setPlaceholder('Выберите тип реплея')
        .addOptions(
          { label: 'MCL/VZZ', value: 'MCL', emoji: modeSelectEmoji(config, 'MCL') },
          { label: 'CAPT', value: 'KAPT', emoji: modeSelectEmoji(config, 'KAPT') },
          { label: 'GG', value: 'GG', emoji: modeSelectEmoji(config, 'GG') },
          { label: 'Прочее', value: 'OTHER', emoji: modeSelectEmoji(config, 'OTHER') }
        )
    )
  ];
}

function messageHasLegacyPanelFields(message) {
  return Boolean(message?.embeds?.length || message?.content);
}

function replayPanelEditPayload(payload, message) {
  const hasLogoAttachment = [...(message.attachments?.values?.() || [])].some((attachment) => attachment.name === PANEL_LOGO_FILE_NAME);
  const usesLogoFile = payload?.files?.some?.((file) => file.name === PANEL_LOGO_FILE_NAME);
  if (!hasLogoAttachment || !usesLogoFile) {
    return payload;
  }

  const nextPayload = { ...payload };
  delete nextPayload.files;
  return nextPayload;
}

function buildReplaySubmitModal(mode) {
  const modeName = (MODE_DISPLAY[mode] || MODE_DISPLAY.OTHER).label;
  const modal = new ModalBuilder().setCustomId(`replay:submit-modal:${mode}`).setTitle(`Отправка видео: ${modeName}`);
  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('url')
        .setLabel('Ссылка на YouTube/RuTube')
        .setPlaceholder('https://www.youtube.com/...')
        .setRequired(true)
        .setStyle(TextInputStyle.Short)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('userComment')
        .setLabel('Комментарий (необязательно)')
        .setPlaceholder('Кратко опишите, что хотите разобрать')
        .setRequired(false)
        .setStyle(TextInputStyle.Paragraph)
    )
  );
  return modal;
}

function getReplaySubmitMode(interaction) {
  const rawMode = interaction.customId.split(':')[2];
  if (rawMode) {
    return normalizeReplayMode(rawMode);
  }

  try {
    return normalizeReplayMode(interaction.fields.getTextInputValue('mode'));
  } catch {
    return 'OTHER';
  }
}

function replayLogActionRow(config, videoId, disabledClaim = false, disabledReview = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`replay:claim:${videoId}`)
        .setLabel('Взять разбор')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(safeCustomEmoji(config.emojis?.hwt_accept) || safeCustomEmoji(config.emojis?.hwt_check) || '📌')
        .setDisabled(disabledClaim),
      new ButtonBuilder()
        .setCustomId(`replay:review:${videoId}`)
        .setLabel('Оставить разбор')
        .setStyle(ButtonStyle.Primary)
        .setEmoji(safeCustomEmoji(config.emojis?.hwt_ticket) || safeCustomEmoji(config.emojis?.hwt_apply) || '📝')
        .setDisabled(disabledReview)
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`replay:template:${videoId}`)
        .setPlaceholder('Шаблон комментария')
        .setDisabled(disabledReview)
        .addOptions(
          { label: 'Позиционка', value: 'position', emoji: safeCustomEmoji(config.emojis?.hwt_info) || '📌', description: 'Ошибки по позиции и таймингам' },
          { label: 'Стрельба', value: 'aim', emoji: safeCustomEmoji(config.emojis?.hwt_gg) || '🎯', description: 'Ошибки по дуэлям и стрельбе' },
          { label: 'Коммуникация', value: 'comms', emoji: safeCustomEmoji(config.emojis?.hwt_voice) || '🔊', description: 'Ошибки по инфе и тимплею' },
          { label: 'Чистый разбор', value: 'clean', emoji: safeCustomEmoji(config.emojis?.hwt_success) || '✅', description: 'Короткий позитивный разбор' }
        )
    )
  ];
}

const REPLAY_REVIEW_TEMPLATES = {
  position: 'Позиционка: \nТайминги: \nЧто исправить: ',
  aim: 'Стрельба: \nДуэли: \nЧто исправить: ',
  comms: 'Коммуникация: \nИнформация: \nЧто исправить: ',
  clean: 'Разбор принят. Критичных ошибок не найдено. Продолжай в том же темпе.'
};

function buildReplayReviewModal(videoId, sourceMessageId, defaultComment = '') {
  const modal = new ModalBuilder().setCustomId(`replay:review-modal:${videoId}:${sourceMessageId}`).setTitle('Комментарий администратора');
  const input = new TextInputBuilder()
    .setCustomId('comment')
    .setLabel('Комментарий куратора')
    .setPlaceholder('Опишите ключевые ошибки игрока и рекомендации по улучшению.')
    .setRequired(true)
    .setMaxLength(1500)
    .setStyle(TextInputStyle.Paragraph);

  if (defaultComment) {
    input.setValue(String(defaultComment).slice(0, 1500));
  }

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return modal;
}

function parseReplayListCustomId(customId) {
  const [, , status, mode, page, userId] = customId.split(':');
  const parsedPage = Number.parseInt(page || '0', 10);
  return {
    status,
    mode,
    page: Number.isFinite(parsedPage) ? parsedPage : 0,
    userId: userId && userId !== '0' ? userId : null
  };
}

function extractVideoIdFromMessage(message) {
  const title = message?.embeds?.[0]?.title || '';
  const match = title.match(/#(\d+)/);
  return match ? Number(match[1]) : null;
}

function buildReplayLogEmbed(config, video, videoId, primaryRoleMention = null, claimedBy = null) {
  const embed = new EmbedBuilder()
    .setColor(config.theme.muted)
    .setTitle(`${config.emojis?.hwt_replay || '🎥'} Новый реплей #${videoId}`)
    .setDescription([
      `[Открыть видео](${video.url})`,
      '',
      `**Тип:** ${formatMode(video.mode, config)}`,
      `**Дата:** <t:${Math.floor(Date.now() / 1000)}:f>`,
      '**Статус:** `Новое`',
      'Сначала нажмите **«Взять разбор»**, затем **«Оставить разбор»**.'
    ].join('\n'))
    .addFields({
      name: 'Основная роль',
      value: primaryRoleMention || '`Не определена`',
      inline: false
    })
    .addFields({
      name: 'Игрок',
      value: `${video.username} (\`${video.user_id}\`)`,
      inline: false
    });

  if (video.user_comment) {
    embed.addFields({
      name: 'Комментарий игрока',
      value: video.user_comment,
      inline: false
    });
  }

  const claimedByText = claimedBy || (video.claimed_by ? `<@${video.claimed_by}>` : null);
  if (claimedByText) {
    embed.addFields({
      name: 'Разбор взял',
      value: claimedByText,
      inline: false
    });
  }

  return embed;
}

function simpleReplayPayload(config, options = {}) {
  const embed = new EmbedBuilder()
    .setColor(options.color ?? config.theme.accent);

  if (options.title) {
    embed.setTitle(options.title);
  }
  if (options.description) {
    embed.setDescription(options.description);
  }
  if (options.fields?.length) {
    embed.addFields(options.fields);
  }
  if (options.footer) {
    embed.setFooter({ text: options.footer });
  }

  return replayPanelPayload(config, embed, options.components || [], {
    includeDefaultBanner: false,
    intro: options.intro,
    allowedMentions: options.allowedMentions,
    ephemeral: options.ephemeral
  });
}

function buildReplayListComponents(config, { status, mode, page, userId }) {
  const safePage = Number.isFinite(page) ? Math.max(0, page) : 0;
  const userSegment = userId || '0';
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`replay:list:new:${mode}:${0}:${userSegment}`)
        .setLabel('Новые')
        .setStyle(status === 'new' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setEmoji(safeCustomEmoji(config.emojis?.hwt_replay) || '🎥'),
      new ButtonBuilder()
        .setCustomId(`replay:list:reviewed:${mode}:${0}:${userSegment}`)
        .setLabel('Проверенные')
        .setStyle(status === 'reviewed' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setEmoji(safeCustomEmoji(config.emojis?.hwt_success) || safeCustomEmoji(config.emojis?.hwt_clean) || safeCustomEmoji(config.emojis?.hwt_check) || '✅'),
      new ButtonBuilder()
        .setCustomId(`replay:list:all:${mode}:${0}:${userSegment}`)
        .setLabel('Все')
        .setStyle(status === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setEmoji(safeCustomEmoji(config.emojis?.hwt_media) || '📂')
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`replay:mode:${status}:${safePage}:${userSegment}`)
        .setPlaceholder('Фильтр по типу реплея')
        .addOptions(
          { label: 'Все типы', value: 'ALL', emoji: '📂', default: mode === 'ALL' },
          { label: 'MCL/VZZ', value: 'MCL', emoji: modeSelectEmoji(config, 'MCL'), default: mode === 'MCL' || mode === 'VZZ' },
          { label: 'CAPT', value: 'KAPT', emoji: modeSelectEmoji(config, 'KAPT'), default: mode === 'KAPT' },
          { label: 'GG', value: 'GG', emoji: modeSelectEmoji(config, 'GG'), default: mode === 'GG' },
          { label: 'Прочее', value: 'OTHER', emoji: modeSelectEmoji(config, 'OTHER'), default: mode === 'OTHER' }
        )
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`replay:list:${status}:${mode}:${Math.max(safePage - 1, 0)}:${userSegment}:prev`)
        .setLabel('⬅')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(safePage <= 0),
      new ButtonBuilder()
        .setCustomId(`replay:refresh:${status}:${mode}:${safePage}:${userSegment}`)
        .setLabel('Обновить')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(safeCustomEmoji(config.emojis?.hwt_refresh) || '🔄'),
      new ButtonBuilder()
        .setCustomId(`replay:list:${status}:${mode}:${safePage + 1}:${userSegment}:next`)
        .setLabel('➡')
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

class ReplayDB {
  constructor(dbPath) {
    this.dbPath = path.resolve(dbPath);
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    this.db = new DatabaseSync(this.dbPath);
    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        username TEXT NOT NULL,
        url TEXT NOT NULL,
        user_comment TEXT,
        mode TEXT NOT NULL DEFAULT 'OTHER',
        status TEXT NOT NULL DEFAULT 'new',
        claimed_by TEXT,
        claimed_by_name TEXT,
        claimed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER NOT NULL,
        admin_id INTEGER NOT NULL,
        admin_name TEXT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (video_id) REFERENCES videos (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    try {
      this.db.exec(`ALTER TABLE videos ADD COLUMN status TEXT NOT NULL DEFAULT 'new'`);
    } catch {}

    try {
      this.db.exec(`ALTER TABLE videos ADD COLUMN mode TEXT NOT NULL DEFAULT 'OTHER'`);
    } catch {}

    try {
      this.db.exec(`ALTER TABLE videos ADD COLUMN claimed_by TEXT`);
    } catch {}

    try {
      this.db.exec(`ALTER TABLE videos ADD COLUMN claimed_by_name TEXT`);
    } catch {}

    try {
      this.db.exec(`ALTER TABLE videos ADD COLUMN claimed_at TIMESTAMP`);
    } catch {}
  }

  getSetting(key) {
    const stmt = this.db.prepare(`SELECT value FROM settings WHERE key = ?`);
    const row = stmt.get(key);
    return row ? String(row.value) : null;
  }

  setSetting(key, value) {
    const stmt = this.db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);
    stmt.run(key, value);
  }

  addVideo(userId, username, url, userComment, mode) {
    const stmt = this.db.prepare(`
      INSERT INTO videos (user_id, username, url, user_comment, mode)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(String(userId), username, url, userComment || null, mode);
    return Number(result.lastInsertRowid);
  }

  getVideo(videoId) {
    return this.db.prepare(`
      SELECT
        id,
        CAST(user_id AS TEXT) AS user_id,
        username,
        url,
        user_comment,
        mode,
        status,
        CAST(claimed_by AS TEXT) AS claimed_by,
        claimed_by_name,
        claimed_at,
        created_at
      FROM videos
      WHERE id = ?
    `).get(videoId) || null;
  }

  addComment(videoId, adminId, adminName, comment) {
    this.db.prepare(`
      INSERT INTO comments (video_id, admin_id, admin_name, comment)
      VALUES (?, ?, ?, ?)
    `).run(videoId, String(adminId), adminName, comment);

    this.db.prepare(`UPDATE videos SET status = 'reviewed' WHERE id = ?`).run(videoId);
  }

  claimVideo(videoId, adminId, adminName) {
    const video = this.getVideo(videoId);
    if (!video) {
      return { ok: false, reason: 'missing' };
    }
    if (video.status === 'reviewed') {
      return { ok: false, reason: 'reviewed', video };
    }
    if (video.claimed_by && String(video.claimed_by) !== String(adminId)) {
      return { ok: false, reason: 'claimed', video };
    }

    this.db.prepare(`
      UPDATE videos
      SET claimed_by = ?, claimed_by_name = ?, claimed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(String(adminId), adminName, videoId);

    return { ok: true, video: this.getVideo(videoId) };
  }

  hasComments(videoId) {
    return !!this.db.prepare(`SELECT 1 FROM comments WHERE video_id = ? LIMIT 1`).get(videoId);
  }

  getCommentsForVideo(videoId) {
    return this.db.prepare(`
      SELECT
        id,
        video_id,
        CAST(admin_id AS TEXT) AS admin_id,
        admin_name,
        comment,
        created_at
      FROM comments
      WHERE video_id = ?
      ORDER BY created_at ASC
    `).all(videoId);
  }

  listVideos(status, limit, offset, userId = null, mode = null) {
    const where = [];
    const params = [];

    if (status && status !== 'all') {
      where.push(`status = ?`);
      params.push(status);
    }
    if (userId) {
      where.push(`user_id = ?`);
      params.push(String(userId));
    }
    if (mode && mode !== 'ALL') {
      if (mode === 'MCL') {
        where.push(`mode IN (?, ?)`);
        params.push('MCL', 'VZZ');
      } else {
        where.push(`mode = ?`);
        params.push(mode);
      }
    }

    const sql = `
      SELECT
        id,
        CAST(user_id AS TEXT) AS user_id,
        username,
        url,
        user_comment,
        mode,
        status,
        CAST(claimed_by AS TEXT) AS claimed_by,
        claimed_by_name,
        claimed_at,
        created_at
      FROM videos
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    return this.db.prepare(sql).all(...params);
  }

  countVideos(status, userId = null, mode = null) {
    const where = [];
    const params = [];

    if (status && status !== 'all') {
      where.push(`status = ?`);
      params.push(status);
    }
    if (userId) {
      where.push(`user_id = ?`);
      params.push(String(userId));
    }
    if (mode && mode !== 'ALL') {
      if (mode === 'MCL') {
        where.push(`mode IN (?, ?)`);
        params.push('MCL', 'VZZ');
      } else {
        where.push(`mode = ?`);
        params.push(mode);
      }
    }

    const sql = `
      SELECT COUNT(*) AS c FROM videos
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    `;
    const row = this.db.prepare(sql).get(...params);
    return Number(row?.c || 0);
  }

  getPlayerStats(userId) {
    const rows = this.db.prepare(`
      SELECT mode,
             COUNT(*) AS total,
             SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) AS reviewed
      FROM videos
      WHERE user_id = ?
      GROUP BY mode
    `).all(String(userId));

    const stats = {};
    for (const row of rows) {
      const mode = row.mode === 'VZZ' ? 'MCL' : row.mode;
      const total = Number(row.total || 0);
      const reviewed = Number(row.reviewed || 0);
      const current = stats[mode] || { total: 0, reviewed: 0, pending: 0 };
      current.total += total;
      current.reviewed += reviewed;
      current.pending = Math.max(current.total - current.reviewed, 0);
      stats[mode] = current;
    }
    return stats;
  }

  getRecentReviewsForPlayer(userId, limit = 5) {
    return this.db.prepare(`
      SELECT v.id AS video_id,
             v.url,
             v.mode,
             c.comment,
             c.admin_name,
             c.created_at
      FROM videos v
      JOIN comments c ON c.video_id = v.id
      WHERE v.user_id = ?
      ORDER BY c.created_at DESC
      LIMIT ?
    `).all(String(userId), limit);
  }

  getTopUploaders(limit = 10) {
    return this.db.prepare(`
      SELECT CAST(user_id AS TEXT) AS user_id, username, COUNT(*) AS total
      FROM videos
      GROUP BY user_id, username
      ORDER BY total DESC
      LIMIT ?
    `).all(limit);
  }

  getTopReviewers(limit = 10) {
    return this.db.prepare(`
      SELECT CAST(admin_id AS TEXT) AS admin_id, admin_name, COUNT(*) AS total
      FROM comments
      GROUP BY admin_id, admin_name
      ORDER BY total DESC
      LIMIT ?
    `).all(limit);
  }
}

function getReplayCommands(config = null) {
  if (config?.replays?.enabled === false) {
    return [];
  }

  return [
    new SlashCommandBuilder()
      .setName('videos_panel')
      .setDescription('Панель для работы с реплеями')
  ];
}

function replayReviewLogChannelId(config) {
  return config.replays?.reviewLogChannelId || config.replays?.logChannelId || config.logs?.replay;
}

function createReplayModule(config, store = null) {
  const dbPath = config.replays?.dbPath || path.join(process.cwd(), 'video.db');
  const db = new ReplayDB(dbPath);

  async function sendReplayLog(client, interaction, videoId) {
    const logChannelId = replayReviewLogChannelId(config);
    if (!logChannelId) {
      return;
    }

    const channel = await client.channels.fetch(logChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return;
    }

    const video = db.getVideo(videoId);
    if (!video) {
      return;
    }

    const member = interaction.member || await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);
    const primaryRole = getPrimaryProfileRole(member, config);
    const embed = buildReplayLogEmbed(config, video, videoId, primaryRole.mention);
    const reviewerMention = primaryReviewerMention(config);
    await channel.send(replayPanelPayload(config, embed, replayLogActionRow(config, videoId), {
      includeDefaultBanner: false,
      intro: `${reviewerMention ? `${reviewerMention} ` : ''}— новый реплей #${videoId} от ${interaction.user}`,
      allowedMentions: {
        roles: Array.isArray(config.replays?.reviewerRoleIds) ? config.replays.reviewerRoleIds : [],
        users: [interaction.user.id]
      }
    }));
  }

  async function sendReplayToProfile(client, interaction, videoId) {
    const profiles = loadProfiles(store);
    const profile = profiles[interaction.user.id];
    if (!profile?.channelId) {
      return { ok: false, reason: 'profile-missing' };
    }

    const video = db.getVideo(videoId);
    if (!video) {
      return { ok: false, reason: 'video-missing' };
    }

    const target = await resolveReplayProfileThread(client, store, profile, video.mode);
    if (!target.ok) {
      return target;
    }

    const embed = new EmbedBuilder()
      .setColor(config.theme.accent)
      .setTitle(`Библиотека откатов #${videoId}`)
      .setDescription([
        `[Открыть откат](${video.url})`,
        '',
        `**Тип:** ${formatMode(video.mode, config)}`,
        `**Статус:** \`${video.status === 'reviewed' ? 'Разобран' : 'Новое'}\``,
        video.user_comment ? `**Комментарий:** ${video.user_comment}` : null
      ].filter(Boolean).join('\n'))
      .setTimestamp(new Date());

    const sent = await target.channel.send(replayPanelPayload(config, embed, [], {
      includeDefaultBanner: false,
      intro: interaction.user.toString(),
      allowedMentions: { users: [interaction.user.id] }
    })).then(() => true).catch((error) => {
      console.error(`Failed to send replay #${videoId} to profile ${profile.channelId}`, error);
      return false;
    });

    return sent
      ? { ok: true, channelId: profile.channelId, threadId: target.threadId }
      : { ok: false, reason: 'send-failed', channelId: profile.channelId, threadId: target.threadId };
  }

  function buildReplayProgressEmbed(user) {
    const stats = db.getPlayerStats(user.id);
    const reviews = db.getRecentReviewsForPlayer(user.id, 5);
    if (!Object.keys(stats).length && !reviews.length) {
      return null;
    }

    const embed = new EmbedBuilder()
      .setColor(config.theme.accent)
      .setTitle(`${config.emojis?.hwt_progress || ''} Ваш прогресс по реплеям`.trim())
      .setDescription('Здесь собрана краткая статистика по вашим реплеям и последним разборам.');

    let totalAll = 0;
    let reviewedAll = 0;
    for (const [mode, values] of Object.entries(stats)) {
      totalAll += values.total;
      reviewedAll += values.reviewed;
      embed.addFields({
        name: formatMode(mode, config),
        value: [
          `Всего: **${values.total}**`,
          `Разобрано: **${values.reviewed}**`,
          `Ожидают разбора: **${values.pending}**`
        ].join('\n'),
        inline: true
      });
    }

    if (totalAll) {
      embed.addFields({
        name: 'Итого по всем типам',
        value: [
          `Реплеев отправлено: **${totalAll}**`,
          `Получено разборов: **${reviewedAll}**`
        ].join('\n'),
        inline: false
      });
    }

    if (reviews.length) {
      embed.addFields({
        name: 'Последние разборы',
        value: reviews
          .map((row) => `${formatMode(row.mode, config)} • реплей #${row.video_id} — куратор **${row.admin_name}**`)
          .join('\n'),
        inline: false
      });
    }

    return embed;
  }

  function buildLeaderboardEmbed() {
    const topUploaders = db.getTopUploaders(10);
    const topReviewers = db.getTopReviewers(10);

    const embed = new EmbedBuilder()
      .setColor(config.theme.accent)
      .setTitle(`${config.emojis?.hwt_rank || ''} Рейтинг по реплеям`.trim())
      .setDescription('Кто больше всего отправлял реплеи и кто чаще всего делал разборы.');

    if (topUploaders.length) {
      embed.addFields({
        name: 'Игроки по количеству реплеев',
        value: topUploaders
          .map((row, index) => `**${index + 1}.** ${row.username} (\`${row.user_id}\`) — **${row.total}** реплеев`)
          .join('\n'),
        inline: false
      });
    }

    if (topReviewers.length) {
      embed.addFields({
        name: 'Кураторы по количеству разборов',
        value: topReviewers
          .map((row, index) => `**${index + 1}.** ${row.admin_name} (\`${row.admin_id}\`) — **${row.total}** разборов`)
          .join('\n'),
        inline: false
      });
    }

    if (!topUploaders.length && !topReviewers.length) {
      embed.setDescription('Пока нет данных для рейтинга.');
    }

    return embed;
  }

  function buildVideoListEmbed({ status, page, perPage = 5, userId = null, mode = 'ALL', guild = null }) {
    const total = db.countVideos(status, userId, mode);
    const maxPage = Math.max(Math.ceil(total / perPage) - 1, 0);
    const safePage = Math.min(Math.max(page, 0), maxPage);
    const offset = safePage * perPage;
    const videos = db.listVideos(status, perPage, offset, userId, mode);

    const statusDisplay = {
      new: 'Новые',
      reviewed: 'Проверенные',
      all: 'Все'
    }[status] || 'Все';

    const modeDisplay = {
      MCL: 'MCL/VZZ',
      VZZ: 'MCL/VZZ',
      KAPT: 'CAPT',
      GG: 'GG',
      QUAL: 'Квалы',
      OTHER: 'Прочее',
      ALL: 'Все типы'
    }[mode] || 'Все типы';

    let title = `Реплеи — ${statusDisplay} • ${modeDisplay}`;
    if (userId) {
      const member = guild?.members?.cache?.get?.(userId) || null;
      title += member ? ` игрока ${member.user.tag}` : ` игрока ID ${userId}`;
    }

    const embed = new EmbedBuilder()
      .setColor(status === 'new' ? config.theme.muted : config.theme.accent)
      .setTitle(title);

    if (!videos.length) {
      embed.setDescription('Ничего не найдено по заданному фильтру.');
    } else {
      for (const video of videos) {
        const comments = db.getCommentsForVideo(video.id);
        const statusText = video.status === 'new' ? 'Новое' : 'Проверено';
        let value = [
          `[Ссылка](${video.url})`,
          `Игрок: **${video.username}** (\`${video.user_id}\`)`,
          `Тип: ${formatMode(video.mode, config)} • Комментариев: **${comments.length}**`,
          video.claimed_by ? `Разбор взял: <@${video.claimed_by}>` : null
        ].filter(Boolean).join('\n');

        if (video.user_comment) {
          value += `\nКомментарий игрока: ${String(video.user_comment).slice(0, 180)}`;
        }

        embed.addFields({
          name: `#${video.id} — ${statusText}`,
          value,
          inline: false
        });
      }
    }

    embed.setFooter({ text: `Страница ${safePage + 1}/${maxPage + 1} • Всего реплеев: ${total}` });
    return { embed, safePage, maxPage };
  }

  async function ensureMainPanel(client) {
    if (config.replays?.enabled === false) {
      return;
    }

    const panelChannelId = config.replays?.panelChannelId || config.channels?.replays || DEFAULT_REPLAY_PANEL_CHANNEL_ID;
    if (!panelChannelId) {
      return;
    }

    const channel = await client.channels.fetch(panelChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      return;
    }

    const storedChannel = db.getSetting(REPLAY_PANEL_CHANNEL_KEY);
    const storedMessage = db.getSetting(REPLAY_PANEL_KEY);
    let message = null;

    if (storedChannel && storedMessage && String(storedChannel) === String(channel.id)) {
      message = await channel.messages.fetch(storedMessage).catch(() => null);
    }

    const embed = buildReplayPanelEmbed(config);
    const components = buildReplayPanelComponents(config);
    const payload = replayPanelPayload(config, embed, components);

    if (message) {
      if (messageHasLegacyPanelFields(message)) {
        await message.delete().catch(() => null);
      } else {
        try {
          await message.edit(replayPanelEditPayload(payload, message));
          return;
        } catch (error) {
          const shouldRecreate =
            error?.code === 10008 ||
            error?.message === 'Unknown Message' ||
            String(error?.message || '').includes('MESSAGE_CANNOT_USE_LEGACY_FIELDS_WITH_COMPONENTS_V2') ||
            String(error?.rawError?.message || '').includes('MESSAGE_CANNOT_USE_LEGACY_FIELDS_WITH_COMPONENTS_V2');
          if (!shouldRecreate) {
            throw error;
          }
        }
      }
    }

    const sent = await channel.send(payload);
    db.setSetting(REPLAY_PANEL_CHANNEL_KEY, String(channel.id));
    db.setSetting(REPLAY_PANEL_KEY, String(sent.id));
  }

  async function recreateMainPanel(client) {
    if (config.replays?.enabled === false) {
      return;
    }

    const storedChannel = db.getSetting(REPLAY_PANEL_CHANNEL_KEY);
    const storedMessage = db.getSetting(REPLAY_PANEL_KEY);
    if (storedChannel && storedMessage) {
      const channel = await client.channels.fetch(storedChannel).catch(() => null);
      const message = channel?.isTextBased?.()
        ? await channel.messages.fetch(storedMessage).catch(() => null)
        : null;
      if (message) {
        await message.delete().catch(() => null);
      }
    }
    db.setSetting(REPLAY_PANEL_CHANNEL_KEY, '');
    db.setSetting(REPLAY_PANEL_KEY, '');
    await ensureMainPanel(client);
  }

  async function postPanelToCurrentChannel(interaction) {
    if (config.replays?.enabled === false) {
      await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Панель replays-check временно отключена.' });
      return;
    }

    const embed = buildReplayPanelEmbed(config);
    const components = buildReplayPanelComponents(config);
    await interaction.reply(replayPanelPayload(config, embed, components));
  }

  async function handleInteraction(interaction, client) {
    if (config.replays?.enabled === false) {
      return false;
    }

    if (interaction.isChatInputCommand() && interaction.commandName === 'videos_panel') {
      await postPanelToCurrentChannel(interaction);
      return true;
    }

    if (interaction.isButton()) {
      if (interaction.customId === 'replay:submit') {
        await interaction.reply({
          flags: MessageFlags.Ephemeral,
          content: 'Выберите тип реплея перед загрузкой.',
          components: buildReplaySubmitModeComponents(config)
        });
        return true;
      }

      if (interaction.customId.startsWith('replay:list:') || interaction.customId.startsWith('replay:refresh:')) {
        if (!isReviewer(interaction.member, config)) {
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Только кураторы / администрация могут открывать список реплеев.' });
          return true;
        }

        if (interaction.message?.flags?.has?.(MessageFlags.Ephemeral)) {
          await interaction.deferUpdate();
        } else {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        }

        const sourceId = interaction.customId.startsWith('replay:refresh:')
          ? interaction.customId.replace('replay:refresh:', 'replay:list:')
          : interaction.customId;

        const state = parseReplayListCustomId(sourceId);
        const { embed, safePage, maxPage } = buildVideoListEmbed({
          status: state.status,
          page: state.page,
          userId: state.userId,
          mode: state.mode,
          guild: interaction.guild
        });

        const components = buildReplayListComponents(config, {
          status: state.status,
          mode: state.mode,
          page: safePage,
          userId: state.userId
        });
        components[2].components[2].setDisabled(safePage >= maxPage);

        await interaction.editReply(replayPanelPayload(config, embed, components, { includeDefaultBanner: false }));
        return true;
      }

      if (interaction.customId === 'replay:queue') {
        if (!isReviewer(interaction.member, config)) {
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Очередь доступна только кураторам / администрации.' });
          return true;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const { embed, safePage, maxPage } = buildVideoListEmbed({
          status: 'new',
          page: 0,
          mode: 'ALL',
          guild: interaction.guild
        });
        const components = buildReplayListComponents(config, {
          status: 'new',
          mode: 'ALL',
          page: safePage,
          userId: null
        });
        components[2].components[2].setDisabled(safePage >= maxPage);
        await interaction.editReply(replayPanelPayload(config, embed, components, { includeDefaultBanner: false }));
        return true;
      }

      if (interaction.customId === 'replay:playerpick') {
        if (!isReviewer(interaction.member, config)) {
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Только кураторы / администрация могут открывать список реплеев игрока.' });
          return true;
        }

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await interaction.editReply(simpleReplayPayload(config, {
          title: `${config.emojis?.hwt_replay || ''} Реплеи игрока`.trim(),
          description: 'Выберите игрока для просмотра его реплеев.',
          components: [
            new ActionRowBuilder().addComponents(
              new UserSelectMenuBuilder()
                .setCustomId('replay:player-select')
                .setPlaceholder('Выберите игрока')
                .setMinValues(1)
                .setMaxValues(1)
            )
          ]
        }));
        return true;
      }

      if (interaction.customId === 'replay:progress') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const embed = buildReplayProgressEmbed(interaction.user);
        if (!embed) {
          await interaction.editReply(simpleReplayPayload(config, {
            title: `${config.emojis?.hwt_progress || ''} Ваш прогресс по реплеям`.trim(),
            description: 'У вас пока нет отправленных реплеев. Нажмите «Загрузить реплей», чтобы отправить первый откат.'
          }));
        } else {
          await interaction.editReply(replayPanelPayload(config, embed, [], { includeDefaultBanner: false }));
        }
        return true;
      }

      if (interaction.customId === 'replay:leaderboard') {
        if (!isReviewer(interaction.member, config)) {
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Рейтинг доступен только кураторам / администрации.' });
          return true;
        }
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        await interaction.editReply(replayPanelPayload(config, buildLeaderboardEmbed(), [], { includeDefaultBanner: false }));
        return true;
      }

      if (interaction.customId.startsWith('replay:claim:') || interaction.customId === 'replay_claim') {
        if (!isReviewer(interaction.member, config)) {
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Только кураторы / администрация могут брать разборы.' });
          return true;
        }

        await interaction.deferUpdate();

        const videoId = interaction.customId === 'replay_claim'
          ? extractVideoIdFromMessage(interaction.message)
          : Number(interaction.customId.split(':')[2]);
        const claimResult = db.claimVideo(videoId, interaction.user.id, interaction.user.tag);
        if (!claimResult.ok && claimResult.reason === 'missing') {
          await interaction.followUp({ flags: MessageFlags.Ephemeral, content: 'Не удалось найти этот реплей в базе.' });
          return true;
        }
        if (!claimResult.ok && claimResult.reason === 'reviewed') {
          await interaction.followUp({ flags: MessageFlags.Ephemeral, content: 'Этот реплей уже разобран.' });
          return true;
        }
        if (!claimResult.ok && claimResult.reason === 'claimed') {
          await interaction.followUp({ flags: MessageFlags.Ephemeral, content: `Этот реплей уже взял <@${claimResult.video.claimed_by}>.` });
          return true;
        }

        const video = claimResult.video;

        try {
          const player = await client.users.fetch(video.user_id).catch(() => null);
          if (player) {
            await player.send(simpleReplayPayload(config, {
              title: `${config.emojis?.hwt_pending || config.emojis?.hwt_accept || config.emojis?.hwt_replay || '🎥'} Реплей взят на разбор`,
              description: `Ваш реплей #${videoId} взял на разбор куратор **${interaction.user.tag}**.`,
              color: config.theme.accent
            })).catch(() => {});
          }
        } catch {}

        const embed = buildReplayLogEmbed(config, video, videoId, null, interaction.user.tag);
        const components = replayLogActionRow(config, videoId, true, false);
        await interaction.editReply(
          interaction.message.embeds?.length || interaction.message.content
            ? { embeds: [embed], components }
            : replayPanelPayload(config, embed, components, { includeDefaultBanner: false })
        );
        await interaction.followUp({ flags: MessageFlags.Ephemeral, content: 'Вы взяли этот реплей на разбор.' });
        return true;
      }

      if (interaction.customId.startsWith('replay:review:') || interaction.customId === 'replay_review') {
        if (!isReviewer(interaction.member, config)) {
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Только кураторы / администрация могут использовать эту кнопку.' });
          return true;
        }

        const videoId = interaction.customId === 'replay_review'
          ? extractVideoIdFromMessage(interaction.message)
          : Number(interaction.customId.split(':')[2]);
        if (db.hasComments(videoId)) {
          const video = db.getVideo(videoId);
          if (video) {
            const embed = buildReplayLogEmbed(config, video, videoId);
            const components = replayLogActionRow(config, videoId, true, true);
            await interaction.update(
              interaction.message.embeds?.length || interaction.message.content
                ? { embeds: [embed], components }
                : replayPanelPayload(config, embed, components, { includeDefaultBanner: false })
            );
          } else {
            await interaction.update({ components: replayLogActionRow(config, videoId, true, true) });
          }
          await interaction.followUp({ flags: MessageFlags.Ephemeral, content: 'У этого реплея уже есть разбор. Повторный разбор недоступен.' });
          return true;
        }

        const video = db.getVideo(videoId);
        if (video?.claimed_by && String(video.claimed_by) !== String(interaction.user.id)) {
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Этот реплей уже взял <@${video.claimed_by}>. Разбор может оставить только он.` });
          return true;
        }

        await interaction.showModal(buildReplayReviewModal(videoId, interaction.message.id));
        return true;
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('replay:template:')) {
      if (!isReviewer(interaction.member, config)) {
        await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Только кураторы / администрация могут использовать шаблоны разбора.' });
        return true;
      }

      const videoId = Number(interaction.customId.split(':')[2]);
      const video = db.getVideo(videoId);
      if (!video) {
        await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Не удалось найти этот реплей в базе.' });
        return true;
      }
      if (video.claimed_by && String(video.claimed_by) !== String(interaction.user.id)) {
        await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Этот реплей уже взял <@${video.claimed_by}>.` });
        return true;
      }

      const template = REPLAY_REVIEW_TEMPLATES[interaction.values[0]] || '';
      await interaction.showModal(buildReplayReviewModal(videoId, interaction.message.id, template));
      return true;
    }

    if (interaction.isUserSelectMenu() && interaction.customId === 'replay:player-select') {
      if (!isReviewer(interaction.member, config)) {
        await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Только кураторы / администрация могут просматривать список реплеев игрока.' });
        return true;
      }

      await interaction.deferUpdate();

      const [userId] = interaction.values;
      const { embed, safePage, maxPage } = buildVideoListEmbed({
        status: 'all',
        page: 0,
        userId,
        mode: 'ALL',
        guild: interaction.guild
      });
      const components = buildReplayListComponents(config, {
        status: 'all',
        mode: 'ALL',
        page: safePage,
        userId
      });
      components[2].components[2].setDisabled(safePage >= maxPage);
      await interaction.editReply(replayPanelPayload(config, embed, components, { includeDefaultBanner: false }));
      return true;
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('replay:mode:')) {
      if (!isReviewer(interaction.member, config)) {
        await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'Только кураторы / администрация могут просматривать список реплеев.' });
        return true;
      }

      await interaction.deferUpdate();

      const [, , status, page, userId] = interaction.customId.split(':');
      const parsedPage = Number.parseInt(page || '0', 10);
      const mode = interaction.values[0];
      const { embed, safePage, maxPage } = buildVideoListEmbed({
        status,
        page: Number.isFinite(parsedPage) ? parsedPage : 0,
        userId: userId !== '0' ? userId : null,
        mode,
        guild: interaction.guild
      });
      const components = buildReplayListComponents(config, {
        status,
        mode,
        page: safePage,
        userId: userId !== '0' ? userId : null
      });
      components[2].components[2].setDisabled(safePage >= maxPage);
      await interaction.editReply(replayPanelPayload(config, embed, components, { includeDefaultBanner: false }));
      return true;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'replay:submit-mode') {
      const mode = normalizeReplayMode(interaction.values[0]);
      try {
        await interaction.showModal(buildReplaySubmitModal(mode));
      } catch (error) {
        if (error?.code === 10062) {
          return true;
        }
        throw error;
      }
      return true;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'replay:submit-modal' || interaction.customId.startsWith('replay:submit-modal:')) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const mode = getReplaySubmitMode(interaction);
        const videoId = db.addVideo(
          interaction.user.id,
          interaction.user.tag,
          interaction.fields.getTextInputValue('url'),
          interaction.fields.getTextInputValue('userComment') || null,
          mode
        );
        await sendReplayLog(client, interaction, videoId);
        const profileResult = await sendReplayToProfile(client, interaction, videoId);
        const profileMessage = profileResult.ok
          ? `Откат добавлен в профильную ветку: <#${profileResult.threadId || profileResult.channelId}>.`
          : {
              'profile-missing': 'Откат сохранен, но личный профиль не найден. Создайте профиль, чтобы откаты дублировались в библиотеку.',
              'channel-missing': 'Откат сохранен, но канал личного профиля не найден. Пересоздайте профиль.',
              'thread-missing': 'Откат сохранен, но не удалось создать ветку # Replays в личном профиле.',
              'video-missing': 'Откат сохранен, но не удалось найти запись видео для отправки в профиль.',
              'send-failed': 'Откат сохранен, но Discord не дал отправить сообщение в канал профиля.'
            }[profileResult.reason] || 'Откат сохранен, но не удалось добавить его в личный профиль.';

        await interaction.editReply({
          content: `Видео сохранено с ID **${videoId}**. ${profileMessage}`
        });
        return true;
      }

      if (interaction.customId.startsWith('replay:review-modal:')) {
        if (!isReviewer(interaction.member, config)) {
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'У вас нет прав, чтобы оставлять комментарии.' });
          return true;
        }

        const [, , videoIdRaw, sourceMessageId] = interaction.customId.split(':');
        const videoId = Number(videoIdRaw);
        if (db.hasComments(videoId)) {
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: 'У этого реплея уже есть разбор.' });
          return true;
        }

        const currentVideo = db.getVideo(videoId);
        if (currentVideo?.claimed_by && String(currentVideo.claimed_by) !== String(interaction.user.id)) {
          await interaction.reply({ flags: MessageFlags.Ephemeral, content: `Этот реплей уже взял <@${currentVideo.claimed_by}>. Разбор может оставить только он.` });
          return true;
        }

        const comment = interaction.fields.getTextInputValue('comment');
        db.addComment(videoId, interaction.user.id, interaction.user.tag, comment);
        const video = db.getVideo(videoId);
        const adminEmbed = new EmbedBuilder()
          .setColor(config.theme.success)
          .setTitle(`${config.emojis?.hwt_success || config.emojis?.hwt_clean || config.emojis?.hwt_check || '✅'} Разбор по реплею #${videoId}`)
          .setDescription(video ? `[Открыть видео](${video.url})` : null)
          .addFields(
            video
              ? { name: 'Игрок', value: `${video.username} (\`${video.user_id}\`)`, inline: true }
              : { name: 'Игрок', value: 'не найден', inline: true },
            video
              ? { name: 'Тип', value: formatMode(video.mode, config), inline: true }
              : { name: 'Тип', value: formatMode('OTHER', config), inline: true },
            { name: 'Комментарий куратора', value: comment, inline: false }
          )
          .setFooter({ text: `Куратор: ${interaction.user.tag}` });

        try {
          if (video) {
            const player = await client.users.fetch(video.user_id).catch(() => null);
            if (player) {
              const playerEmbed = new EmbedBuilder()
                .setColor(config.theme.accent)
                .setTitle(`${config.emojis?.hwt_success || config.emojis?.hwt_clean || config.emojis?.hwt_check || ''} Разбор твоего реплея #${videoId}`.trim())
                .setDescription('Ниже — индивидуальный разбор от куратора. Учти комментарии в следующих играх.')
                .addFields(
                  { name: 'Реплей', value: `[Открыть видео](${video.url})`, inline: false },
                  { name: 'Тип', value: formatMode(video.mode, config), inline: true },
                  { name: 'Комментарий куратора', value: comment, inline: false }
                )
                .setFooter({ text: `Куратор: ${interaction.user.tag}` });
              await player.send(replayPanelPayload(config, playerEmbed, [], { includeDefaultBanner: false })).catch(() => {});
            }
          }
        } catch {}

        if (replayReviewLogChannelId(config)) {
          const logChannelId = replayReviewLogChannelId(config);
          const channel = await client.channels.fetch(logChannelId).catch(() => null);
          if (channel && channel.isTextBased() && video) {
            await channel.send(replayPanelPayload(config, adminEmbed, [], {
              includeDefaultBanner: false,
              intro: `<@${video.user_id}> — новый разбор по реплею #${videoId} от ${interaction.user}`,
              allowedMentions: { users: [String(video.user_id), interaction.user.id] }
            })).catch(() => {});
          }
        }

        const logChannelId = replayReviewLogChannelId(config);
        if (logChannelId && sourceMessageId) {
          const channel = await client.channels.fetch(logChannelId).catch(() => null);
          if (channel && channel.isTextBased()) {
            const sourceMessage = await channel.messages.fetch(sourceMessageId).catch(() => null);
            if (sourceMessage && video) {
              const embed = buildReplayLogEmbed(config, video, videoId, null, interaction.user.tag);
              const components = replayLogActionRow(config, videoId, true, true);
              const payload = sourceMessage.embeds?.length || sourceMessage.content
                ? { embeds: [embed], components }
                : replayPanelEditPayload(
                  replayPanelPayload(config, embed, components, { includeDefaultBanner: false }),
                  sourceMessage
                );
              await sourceMessage.edit(payload).catch(() => {});
            }
          }
        }

        await interaction.reply(replayPanelPayload(config, adminEmbed, [], {
          includeDefaultBanner: false,
          intro: 'Разбор сохранен.',
          ephemeral: true
        }));
        return true;
      }
    }

    return false;
  }

  return {
    commands: getReplayCommands(config),
    handleInteraction,
    ensureMainPanel,
    recreateMainPanel
  };
}

module.exports = {
  createReplayModule,
  getReplayCommands
};
