# nine9s-discord-webhook

Forward [nine9s.cloud](https://nine9s.cloud) webhooks to [Discord](https://discord.com) via [Cloudflare Workers](https://workers.cloudflare.com/).

---

<img width="439" alt="Screenshot 2021-08-27 at 17 50 48" src="https://user-images.githubusercontent.com/1682504/131154610-d9110806-5175-4202-9b71-797cde51ff4d.png">

---

## Deploy your own

This project can be deployed to Cloudflare Workers. To do so, click the following button:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/fspoettel/nine9s-discord-webhook)

Once the project is deployed, add the necessary configuration detailed below.

## Configuration

The following secrets need to be provided to the Cloudflare Worker:

- `NINE9S_WEBHOOK_SECRET` - Webhook Secret displayed [here](https://nine9s.cloud/profile#webhooks)
- `DISCORD_WEBHOOK_URL` - Discord Webhook URL. See [here](https://support.discord.com/hc/en-us/articles/228383668) for instructions
