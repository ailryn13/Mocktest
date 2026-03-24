import os

def clean_all(base_path):
    # Fix file contents first
    for root, dirs, files in os.walk(base_path):
        for name in files:
            path = os.path.join(root, name)
            try:
                with open(path, 'rb') as f:
                    content = f.read()
                if b'\r' in content:
                    print(f"Cleaning content of {path}")
                    with open(path, 'wb') as f:
                        f.write(content.replace(b'\r', b''))
            except Exception as e:
                print(f"Error cleaning {path}: {e}")

    # Fix filenames (bottom-up to avoid invalidating paths)
    for root, dirs, files in os.walk(base_path, topdown=False):
        for name in files + dirs:
            if '\r' in name:
                old = os.path.join(root, name)
                new = os.path.join(root, name.replace('\r', ''))
                print(f"Renaming {old} -> {new}")
                if os.path.exists(new):
                    # If target exists and is a directory, merge? Or skip?
                    # For simplicity, if it's a file, overwrite.
                    if os.path.isfile(new):
                        os.remove(new)
                    else:
                        continue 
                os.rename(old, new)

if __name__ == "__main__":
    clean_all("/home/ubuntu/mocktest")
