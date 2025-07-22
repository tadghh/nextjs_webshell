import { useState } from 'react';

export default function Home() {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);

  const presetCommands = [
    // Basic system info
    'whoami',
    'id',
    'pwd',
    'uname -a',
    'cat /etc/os-release',

    // Process and environment
    'ps aux',
    'env',
    'mount',
    'df -h',

    // Network discovery
    'ip addr',
    'netstat -tulpn',
    'ss -tulpn',

    // Container detection
    'cat /proc/1/cgroup',
    'ls -la /.dockerenv',
    'cat /proc/self/mountinfo',

    // Container breakout attempts
    'docker ps',
    'docker images',
    'docker run --rm -it alpine sh',

    // Privileged operations
    'mount -t proc proc /host/proc',
    'nsenter -t 1 -m -u -i -n -p sh',
    'chroot /host',

    // File system exploration
    'ls -la /',
    'cat /proc/mounts',
    'findmnt',
    'lsblk',

    // Capability testing
    'capsh --print',
    'getcap -r /',

    // Escape sequences
    'echo "Testing escape: \\$(whoami)"',
    '$(whoami)',
    '`whoami`',

    // Dangerous operations (should be blocked)
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
      padding: '20px'
    }}>
      <h1 style={{ color: '#ff6b6b' }}>🔒 Container Breakout Security Test</h1>
      <p style={{ color: '#ffd93d' }}>
        Testing application for container escape vulnerabilities
      </p>

      <div style={{ marginBottom: '20px' }}>
        <h3>Preset Commands:</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '5px',
          marginBottom: '20px'
        }}>
          {presetCommands.map((cmd, idx) => (
            <button
              key={idx}
              onClick={() => executeCommand(cmd)}
              disabled={loading}
              style={{
                background: '#333',
                color: '#00ff00',
                border: '1px solid #555',
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '12px',
                textAlign: 'left'
              }}
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>

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
          <div style={{ color: '#666' }}>No commands executed yet...</div>
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
        <p>⚠️ This application intentionally attempts dangerous operations to test container security.</p>
        <p>Use only in isolated testing environments with proper monitoring.</p>
      </div>
    </div>
  );
}