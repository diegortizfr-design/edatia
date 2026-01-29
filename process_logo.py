from PIL import Image
import os

def process_logo(input_path, output_dir):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()

        # Version 1: Transparent Background, Original Colors
        newData = []
        for item in datas:
            # Check if pixel is white (or very close to white)
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                newData.append((255, 255, 255, 0)) # Transparent
            else:
                newData.append(item)
        
        img_clean = Image.new("RGBA", img.size)
        img_clean.putdata(newData)
        clean_path = os.path.join(output_dir, "logo_clean.png")
        img_clean.save(clean_path, "PNG")
        print(f"Created {clean_path}")

        # Version 2: Transparent Background, White Logo (For dark backgrounds)
        whiteData = []
        for item in datas:
            if item[0] > 240 and item[1] > 240 and item[2] > 240:
                whiteData.append((255, 255, 255, 0)) # Transparent
            else:
                # Make non-white pixels pure white, preserving approximate alpha if needed (assuming solid logo)
                whiteData.append((255, 255, 255, 255)) 
        
        img_white = Image.new("RGBA", img.size)
        img_white.putdata(whiteData)
        white_path = os.path.join(output_dir, "logo_white.png")
        img_white.save(white_path, "PNG")
        print(f"Created {white_path}")

    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    # Adjust paths as per environment
    input_path = r"c:\Users\diego\Desktop\erpod\frontend\assets\images\logo.png"
    output_dir = r"c:\Users\diego\Desktop\erpod\frontend\assets\images"
    process_logo(input_path, output_dir)
