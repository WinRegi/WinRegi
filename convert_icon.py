from PIL import Image
import os

img = Image.open("d:/Projects/winregii/resources/icon.png")
img.save("d:/Projects/winregii/resources/icon.ico", format="ICO", sizes=[(256, 256)])
print("Converted to icon.ico")
