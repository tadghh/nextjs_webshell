import { spawn } from 'child_process';

// Validate that command is only ls or cat with safe arguments
function validateCommand(input) {
  const trimmed = input.trim();



  // Basic injection prevention


  // Parse command
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  // Validate ls arguments
  if (cmd === 'ls') {
    const validLsFlags = ['-l', '-a', '-la', '-al', '-h', '-lh', '-hl', '-lah', '-alh', '-hal'];
    const flags = args.filter(arg => arg.startsWith('-'));
    const paths = args.filter(arg => !arg.startsWith('-'));



    return { valid: true, command: cmd, args: args };
  }

  // Validate cat arguments (only file paths, no flags)
  if (cmd === 'cat') {


    return { valid: true, command: cmd, args: args };
  }

  return { valid: false, error: 'Unknown command' };

}
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { command } = req.body;

  if (!command) {
    res.write(`data: ${JSON.stringify({ error: 'Command required', type: 'error' })}\n\n`);
    res.end();
    return;
  }

  // Validate command
  const validation = validateCommand(command);
  if (!validation.valid) {
    res.write(`data: ${JSON.stringify({
      error: validation.error,
      type: 'error',
      command: command
    })}\n\n`);
    res.end();
    return;
  }

  try {
    // Send start event
    res.write(`data: ${JSON.stringify({
      type: 'start',
      command: command,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Execute command
    const child = spawn(validation.command, validation.args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Stream stdout
    child.stdout.on('data', (data) => {
      res.write(`data: ${JSON.stringify({
        type: 'stdout',
        data: data.toString()
      })}\n\n`);
    });

    // Stream stderr
    child.stderr.on('data', (data) => {
      res.write(`data: ${JSON.stringify({
        type: 'stderr',
        data: data.toString()
      })}\n\n`);
    });

    // Handle process completion
    child.on('close', (code) => {
      res.write(`data: ${JSON.stringify({
        type: 'end',
        exitCode: code,
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
    });

    // Handle errors
    child.on('error', (error) => {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message
      })}\n\n`);
      res.end();
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!child.killed) {
        child.kill();
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: 'Command timeout'
        })}\n\n`);
        res.end();
      }
    }, 30000);

  } catch (error) {
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message
    })}\n\n`);
    res.end();
  }
}