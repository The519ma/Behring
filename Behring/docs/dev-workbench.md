# Dev Workbench Launcher

This setup gives you repeatable one-click startup for the local Behring workspace.

## What It Starts

- local Node-RED in a Terminal window
- Baserow SSH tunnel
- OpenELIS SSH tunnel
- browser tabs for Node-RED, Baserow, and OpenELIS

## First-Time Setup

1. The repo now includes a ready-to-run [config/dev-launch.env](/Users/varshsmac/Documents/Behring/config/dev-launch.env).
2. Create [config/env.local](/Users/varshsmac/Documents/Behring/config/env.local) from [config/env.local.example](/Users/varshsmac/Documents/Behring/config/env.local.example) and put your real `BASEROW_BASE_URL`, `BASEROW_TOKEN`, and `BASEROW_TABLE_ID` there.
3. Edit [config/dev-launch.env](/Users/varshsmac/Documents/Behring/config/dev-launch.env) only if your VM usernames, hosts, or ports change.
4. Use [config/dev-launch.example.env](/Users/varshsmac/Documents/Behring/config/dev-launch.example.env) as a reset template if needed.
5. Make sure SSH key access or saved SSH credentials work for both VM users.

Default assumptions already encoded:

- Baserow VM: `behringihcls@192.168.64.2`
- OpenELIS VM: `behringihcls2@192.168.64.3`
- Baserow local URL: `http://localhost:8080`
- OpenELIS local URL: `https://127.0.0.1:9443`
- Node-RED local URL: `http://127.0.0.1:1880`

## Daily Use

Double-click:

- [Behring Dev Workbench.command](/Users/varshsmac/Documents/Behring/Behring%20Dev%20Workbench.command)

Or run:

```bash
./scripts/start-dev-workbench.sh
```

## Individual Commands

Start only Baserow tunnel:

```bash
./scripts/start-baserow-tunnel.sh
```

Start only OpenELIS tunnel:

```bash
./scripts/start-openelis-tunnel.sh
```

Open browser tabs only:

```bash
./scripts/open-dev-links.sh
```

Stop tunnels:

```bash
./scripts/stop-baserow-tunnel.sh
./scripts/stop-openelis-tunnel.sh
```

## Notes

- Tunnels use SSH control sockets under `.tmp/ssh-sockets/` so rerunning the start scripts does not create duplicate tunnels.
- The workbench script opens Node-RED in Terminal using `npm run nodered`.
- The workbench now sources `config/env.local` before starting Node-RED, so the live Baserow adapter can read rows directly.
- The Baserow and OpenELIS launch steps now wait for the local tunneled URL to respond before opening the browser tab.
- If a browser warns about the local OpenELIS certificate, continue to the site as before.
