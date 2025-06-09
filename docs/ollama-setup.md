# Ollama Local Setup Guide

This guide explains how to configure Ollama for direct browser connections in OmniChat.

## Prerequisites

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull at least one model: `ollama pull llama3.3`

## Enable CORS for Browser Access

By default, Ollama only accepts connections from localhost and doesn't allow cross-origin requests from browsers. To enable browser connections:

### Option 1: Environment Variable (Recommended)

Set the `OLLAMA_ORIGINS` environment variable before starting Ollama:

```bash
# On macOS/Linux
export OLLAMA_ORIGINS="*"
ollama serve

# On Windows
set OLLAMA_ORIGINS=*
ollama serve
```

### Option 2: Systemd Service (Linux)

If running Ollama as a systemd service:

1. Edit the service file:

   ```bash
   sudo systemctl edit ollama
   ```

2. Add the environment variable:

   ```ini
   [Service]
   Environment="OLLAMA_ORIGINS=*"
   ```

3. Restart the service:
   ```bash
   sudo systemctl restart ollama
   ```

### Option 3: LaunchAgent (macOS)

If Ollama runs automatically on macOS:

1. Edit `~/Library/LaunchAgents/com.ollama.ollama.plist`
2. Add the environment variable to the `EnvironmentVariables` dict:
   ```xml
   <key>EnvironmentVariables</key>
   <dict>
     <key>OLLAMA_ORIGINS</key>
     <string>*</string>
   </dict>
   ```
3. Reload the service:
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.ollama.ollama.plist
   launchctl load ~/Library/LaunchAgents/com.ollama.ollama.plist
   ```

## Security Considerations

- Setting `OLLAMA_ORIGINS="*"` allows any website to access your local Ollama instance
- For production use, specify only trusted origins:
  ```bash
  export OLLAMA_ORIGINS="https://yourdomain.com,http://localhost:3000"
  ```

## Verify Setup

1. Ensure Ollama is running with CORS enabled
2. In OmniChat, go to Settings and set Ollama URL (default: `http://localhost:11434`)
3. The model selector should show "Connected" next to Ollama models
4. Select an Ollama model and start chatting!

## Troubleshooting

### "Not available" in Model Selector

- Check if Ollama is running: `curl http://localhost:11434/api/tags`
- Verify CORS is enabled (check browser console for CORS errors)
- Try restarting Ollama with the correct environment variable

### Models Not Showing

- Pull models first: `ollama pull llama3.3`
- Refresh the page after pulling new models

### Connection Refused

- Ensure Ollama is listening on the correct port (default: 11434)
- Check firewall settings if using a custom port
