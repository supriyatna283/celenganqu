from PIL import Image
import os
import math

def get_dominant_color(img):
    # Resize to 1x1 to get average color
    img_1x1 = img.resize((1, 1), resample=Image.Resampling.LANCZOS)
    color = img_1x1.getpixel((0, 0))
    if len(color) == 4: # RGBA
        r, g, b, a = color
    else:
        r, g, b = color
    return f"#{r:02x}{g:02x}{b:02x}"

def main():
    icon_path = 'icon-app.png'
    public_dir = 'public'
    
    if not os.path.exists(public_dir):
        os.makedirs(public_dir)
        
    try:
        img = Image.open(icon_path)
        img = img.convert('RGBA')
        
        # Get dominant color
        color = get_dominant_color(img)
        print(f"DOMINANT_COLOR={color}")
        
        # Create sizes
        sizes = [
            (192, 'pwa-192x192.png'),
            (512, 'pwa-512x512.png'),
            (180, 'apple-touch-icon.png')
        ]
        
        for size, filename in sizes:
            resized = img.resize((size, size), resample=Image.Resampling.LANCZOS)
            resized.save(os.path.join(public_dir, filename))
            print(f"Generated {filename}")
            
        # Create favicon.ico (16x16, 32x32, 48x48)
        img.save(os.path.join(public_dir, 'favicon.ico'), format='ICO', sizes=[(16,16), (32,32), (48,48)])
        print("Generated favicon.ico")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
