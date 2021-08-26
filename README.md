# nine9s-discord-webhook

Forward [nine9s.cloud](https://nine9s.cloud) webhooks to [discord](https://discord.com) via [Cloudflare Workers](https://workers.cloudflare.com/).

## Configuration

The following secrets need to be provided to the Cloudflare Worker:

- `NINE9S_WEBHOOK_SECRET` - Webhook Secret displayed [here](https://nine9s.cloud/profile#webhooks)
- `DISCORD_WEBHOOK_URL` - Discord Webhook URL. See [here](https://support.discord.com/hc/en-us/articles/228383668) for instructions
