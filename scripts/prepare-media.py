from pathlib import Path
import subprocess
import shutil

root = Path(__file__).resolve().parent.parent
assets = root / 'assets'
assets.mkdir(exist_ok=True)
short = '/workspace/attachments/6b77a973-8bd7-480a-8db0-c6359e6d36dd/export-1792814595309.mp4'
selection = '/workspace/attachments/88c95955-b8eb-4290-92ae-7c1e03e903a5/export-1792813725484.mp4'
promo = '/workspace/attachments/026f5a95-ec9c-46ce-96d5-7c4dd57060ed/overflowbar-review-v4.1.mp4'

def render(source, name, start, duration, filters):
    command = ['ffmpeg', '-v', 'error', '-ss', str(start), '-i', source, '-t', str(duration), '-an', '-vf', filters + ',fps=30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-threads', '2', '-y', str(assets / name)]
    subprocess.run(command, check=True)
    print(name, (assets / name).stat().st_size, flush=True)

def still(source, name, time, filters):
    subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(time), '-i', source, '-frames:v', '1', '-vf', filters, '-c:v', 'libwebp', '-quality', '86', '-threads', '1', '-y', str(assets / name)], check=True)
    print(name, (assets / name).stat().st_size, flush=True)

hero_crop = 'crop=900:400:1800:50,scale=1440:640'
render(short, 'reveal.mp4', 0.65, 2.75, hero_crop)
still(short, 'row-closed.webp', .7, hero_crop)
still(short, 'row-open.webp', 7, hero_crop)
render(selection, 'selection.mp4', 3.15, 2.5, 'crop=2020:1420:490:230,scale=1120:-2')
still(selection, 'selection.webp', 4.5, 'crop=2020:1420:490:230,scale=1120:-2')
render(promo, 'original-menu.mp4', 21.4, 4.2, 'crop=1920:680:0:180,scale=1280:-2')
still(promo, 'original-menu.webp', 24, 'crop=1920:680:0:180,scale=1280:-2')
shutil.copy('/workspace/OverflowBar/assets/overflowbar-icon.png', assets / 'app-icon.png')
