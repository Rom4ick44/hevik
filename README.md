# YDARNIK Family Bot

Discord bot for the `YDARNIK` family server flow on Majestic RP:

- ticket applications
- social links panel
- interaction panel: leave, profile, reports
- AFK tracking
- warns with AFK protection
- capt registrations
- MCL / VZZ registrations with team assignments
- leave logs
- bot activity logs
- member-leave logs for `test` and `ydarnik`
- ticket acceptance logs
- replay review system migrated from the old Python bot

## Setup

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `config.example.json` to `config.json`.
4. Fill in channel, log, category, role, and guild IDs.
   Each block below should be its own Discord text channel:
   `ticket`, `links`, `interaction`, `afk`, `warn`, `capt-pluse`, `mcl-pluse`.
   Optional separate check-request channel: `cheatCheck`.
   Log channels:
   `logs.bot`, `logs.leave`, `logs.memberLeave`, `logs.ticket`, `logs.replay`.
5. Create `.env` from `.env.example` and put the bot token there:

```env
BOT_TOKEN=your_token
```

Optional:

```powershell
$env:CONFIG_PATH="C:\YDARNIK BOT\config.json"
```

6. Start the bot:

```powershell
npm start
```

## Commands

- `/deploy-panels` - posts all main panels
- `/aura [user]` - shows a private AURA profile with voice, ticket, CAPT, and MCL stats
- `/aura-rank [user]` - manually sets an AURA rank; only `duxagg` can use it
- `/recruiter-stats [user]` - shows private recruiter invite stats
- `/top` - shows AURA, voice, CAPT, MCL, and recruiter leaderboards
- `/weekly` - shows a weekly activity report
- `/family-stats` - shows family server stats
- `/inactive-list` - shows users with low activity
- `/vefigch @user` - gives the verified cheat-check role; available to `highrank` and `cheathunter`
- `/warn-add` - issues a warn if the user is not AFK
- `/warn-remove` - removes warns
- `/capt-create` - creates an Attack / Deff registration
- `/capt-toggle` - opens or closes registration
- `/mcl-create` - creates an MCL / VZZ registration
- `/afk-refresh` - clears the AFK list and redraws the AFK panel
- `/settings-profile-role` - adds or removes profile access roles
- `/ticket-accept` - accepts the current ticket and writes logs
- `/videos_panel` - posts the replay panel

## Icon Notes

For custom server icons like `orl.png`, the simplest path is a Discord custom emoji:

- format: `PNG`
- background: transparent
- size: `128x128` or `256x256`
- weight: under Discord emoji upload limit

Then set the emoji directly in `config.json`, for example `"<:orl:123456789012345678>"`.

## Design Config

You can fully tune visuals in `config.json`:

- `emojis` - button and text icons
- `images.ticketPanel` - main ticket banner
- `images.globalPanel` - shared banner for all main panels
- `images.linksPanel` - links banner
- `images.interactionPanel` - interaction banner
- `images.afkPanel` - AFK banner
- `images.warnPanel` - warn banner
- `images.captPanel` - capt banner
- `images.mclPanel` - MCL banner
- `images.cheatCheckPanel` - cheat-check request banner
- `images.panelThumbnail` - fallback thumbnail for panels
- `images.ticketThumbnail`, `images.linksThumbnail`, `images.interactionThumbnail`, `images.afkThumbnail`, `images.warnThumbnail`, `images.captThumbnail`, `images.mclThumbnail`, `images.cheatCheckThumbnail`, `images.replayThumbnail` - per-panel thumbnails
- `images.leaveCard` - leave popup thumbnail
- `images.profileCard` - profile popup thumbnail
- `images.reportCard` - report popup thumbnail
- `replays.dbPath` - path to the existing `video.db`
- `replays.panelChannelId` - auto-managed replay panel channel
- `replays.requestChannelId` - channel where replay request threads are created
- `replays.logChannelId` - channel for new replay-check messages and reviews
- `replays.reviewerRoleIds` - roles allowed to review and browse replay queues
