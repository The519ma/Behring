# Baserow Localhost Tunnel Fix

This note captures the working fix for accessing Baserow through an SSH tunnel from the Mac while Baserow runs in Docker inside the Linux VM.

## Problem

Direct requests to the container through the VM host worked, but tunneled access through `http://localhost:8080` returned:

```text
404 Site not found
```

The root cause was the Baserow container being configured with:

```env
BASEROW_PUBLIC_URL=http://192.168.64.2:8080
```

That made Caddy accept the VM IP host header, but reject `localhost:8080`.

## Verified Diagnosis

Inside the VM, this returned `404`:

```bash
curl -I http://127.0.0.1:8080
```

But this returned a redirect to login:

```bash
curl -I -H 'Host: 192.168.64.2:8080' http://127.0.0.1:8080
```

That proved:

- Docker port mapping was working
- Baserow was running
- the failure was host-header matching

## Container Details

From `docker inspect`, the working container details were:

- container name: `baserow`
- Docker volume: `baserow_data`
- port mapping: `8080:80`

## Fix

Recreate the Baserow container with:

```env
BASEROW_PUBLIC_URL=http://localhost:8080
```

Commands run inside the Linux VM:

```bash
docker stop baserow
docker rm baserow
docker run -d \
  --name baserow \
  -p 8080:80 \
  -v baserow_data:/baserow/data \
  -e BASEROW_PUBLIC_URL=http://localhost:8080 \
  baserow/baserow
```

## Verification

Inside the VM, this should return a redirect instead of `404`:

```bash
curl -I -H 'Host: localhost:8080' http://127.0.0.1:8080
```

Expected result:

```text
HTTP/1.1 302 Found
Location: /login
```

## Tunnel Command

Run this from the Mac:

```bash
ssh -L 8080:127.0.0.1:8080 behringihcls@192.168.64.2
```

Then open:

- <http://localhost:8080>

## Notes

- After this change, localhost tunnel access is the intended browser path.
- Direct browser access via `http://192.168.64.2:8080` may no longer be the preferred host.
- This fix is separate from the Node-RED middleware work.
