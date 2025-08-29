import { spawn } from 'child_process';

function validateCommand(input) {
  const trimmed = input.trim();




  const parts = trimmed.split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  if (cmd === 'ls') {
    const validLsFlags = ['-l', '-a', '-la', '-al', '-h', '-lh', '-hl', '-lah', '-alh', '-hal'];
    const flags = args.filter(arg => arg.startsWith('-'));
    const paths = args.filter(arg => !arg.startsWith('-'));




    return { valid: true, command: cmd, args: args };
  }

  if (cmd === 'cat') {



    return { valid: true, command: cmd, args: args };
  }

  return { valid: false, error: 'Unknown command' };

}
export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });


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
    res.write(`data: ${JSON.stringify({
      type: 'start',
      command: command,
      timestamp: new Date().toISOString()
    })}\n\n`);

    const child = spawn(validation.command, validation.args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    child.stdout.on('data', (data) => {
      res.write(`data: ${JSON.stringify({
        type: 'stdout',
        data: data.toString()
      })}\n\n`);
    });

    child.stderr.on('data', (data) => {
      res.write(`data: ${JSON.stringify({
        type: 'stderr',
        data: data.toString()
      })}\n\n`);
    });

    child.on('close', (code) => {
      res.write(`data: ${JSON.stringify({
        type: 'end',
        exitCode: code,
        timestamp: new Date().toISOString()
      })}\n\n`);
      res.end();
    });

    child.on('error', (error) => {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message
      })}\n\n`);
      res.end();
    });

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