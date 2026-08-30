from pathlib import Path
from PIL import Image, ImageOps

project = Path('/home/ubuntu/kharcha')
source = Path('/home/ubuntu/webdev-static-assets/kharcha-logo-transparent.png')
res = project / 'android-app' / 'app' / 'src' / 'main' / 'res'

logo = Image.open(source).convert('RGBA')

# Splash artwork: keep the full transparent logo centered with no forced background.
splash = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
icon = ImageOps.contain(logo, (384, 384), method=Image.Resampling.LANCZOS)
splash.alpha_composite(icon, ((512 - icon.width) // 2, (512 - icon.height) // 2))
(res / 'drawable').mkdir(parents=True, exist_ok=True)
splash.save(res / 'drawable' / 'splash.png', optimize=True)

# Notification icons must be simple white-on-transparent assets. Use the logo silhouette
# as a conservative monochrome approximation for debug/installable builds.
mono = Image.new('RGBA', logo.size, (0, 0, 0, 0))
alpha = logo.getchannel('A')
white = Image.new('RGBA', logo.size, (255, 255, 255, 255))
white.putalpha(alpha)
mono = white
notification = ImageOps.contain(mono, (96, 96), method=Image.Resampling.LANCZOS)
notification.save(res / 'drawable' / 'ic_notification_icon.png', optimize=True)

# Provide density-independent fallback launcher resources for pre-Android-26 devices
# and for the adaptive icon's @mipmap/ic_maskable reference.
mipmap = res / 'mipmap-mdpi'
mipmap.mkdir(parents=True, exist_ok=True)
# Launcher icons use a clean white square background with the full logo safely centered.
launcher = Image.new('RGBA', (512, 512), (255, 255, 255, 255))
launcher_icon = ImageOps.contain(logo, (376, 376), method=Image.Resampling.LANCZOS)
launcher.alpha_composite(launcher_icon, ((512 - launcher_icon.width) // 2, (512 - launcher_icon.height) // 2))
launcher.save(mipmap / 'ic_launcher.png', optimize=True)
launcher.save(mipmap / 'ic_maskable.png', optimize=True)
