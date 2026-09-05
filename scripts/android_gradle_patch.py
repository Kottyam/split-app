from pathlib import Path

path = Path("android-app/app/build.gradle")
text = path.read_text()
dep = "    implementation 'androidx.webkit:webkit:1.12.1'"
if dep not in text:
    marker = "    implementation 'androidx.biometric:biometric:1.1.0'"
    text = text.replace(marker, marker + "\n" + dep)
path.write_text(text)
