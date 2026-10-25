"""Push Sites source with a short-lived credential supplied over stdin only."""
import sys
import json
import os
import base64
import subprocess
import termios
from pathlib import Path

terminal = sys.stdin.isatty()
settings = termios.tcgetattr(sys.stdin) if terminal else None
if terminal:
    hidden = settings.copy()
    hidden[3] &= ~termios.ECHO
    termios.tcsetattr(sys.stdin, termios.TCSANOW, hidden)
print('Ready for Sites credential JSON on stdin (input is hidden).', flush=True)
try:
    credential = json.loads(sys.stdin.readline())
finally:
    if terminal:
        termios.tcsetattr(sys.stdin, termios.TCSANOW, settings)
remote = credential['remote_url']
branch = credential['branch']
token = credential.get('token')
env = os.environ.copy()
env['GIT_TERMINAL_PROMPT'] = '0'
if credential.get('auth_mode') == 'http_extra_header':
    if not token:
        raise RuntimeError('Missing short-lived Git credential')
    authorization = base64.b64encode(('x-access-token:' + token).encode()).decode()
    env['GIT_CONFIG_COUNT'] = '1'
    env['GIT_CONFIG_KEY_0'] = 'http.' + remote + '.extraheader'
    env['GIT_CONFIG_VALUE_0'] = 'Authorization: Basic ' + authorization

def git(*arguments, capture=False):
    process = subprocess.run(['git', *arguments], env=env, text=True, capture_output=True)
    if process.returncode:
        # Git's remote contains no credential. Mask all secret forms defensively.
        message = (process.stderr or process.stdout or 'Git operation failed')
        for secret in [token, env.get('GIT_CONFIG_VALUE_0'), env.get('GIT_CONFIG_VALUE_0','').removeprefix('Authorization: Basic ')]:
            if secret:
                message = message.replace(secret, '[redacted]')
        print(message[-3000:], file=sys.stderr)
        raise SystemExit(process.returncode)
    return process.stdout.strip() if capture else None

if not Path('.git').exists():
    git('init', '-b', branch)
git('config', 'user.name', 'OverflowBar Website')
git('config', 'user.email', 'website@overflowbar.invalid')
remotes = git('remote', capture=True).splitlines()
if 'origin' in remotes:
    existing = git('remote', 'get-url', 'origin', capture=True)
    if existing != remote:
        raise RuntimeError('Existing repository is bound to a different Site')
else:
    git('remote', 'add', 'origin', remote)
git('add', '.')
if git('status', '--porcelain', capture=True):
    git('commit', '-m', 'Build the OverflowBar product website')
git('push', '-u', 'origin', 'HEAD:' + branch)
sha = git('rev-parse', 'HEAD', capture=True)
published = git('ls-remote', 'origin', 'refs/heads/' + branch, capture=True).split()[0]
if sha != published:
    raise RuntimeError('Pushed Site source does not match HEAD')
print(json.dumps({'project_id': 'appgprj_6add694f08688191a640aacd686fcb2d', 'commit_sha': sha}), flush=True)
