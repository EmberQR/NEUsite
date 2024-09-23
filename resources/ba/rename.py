import os

current_directory = os.getcwd()

for filename in os.listdir(current_directory):
    
    if filename.endswith('.md.txt'):
        
        new_filename = filename[:-4]  

        os.rename(os.path.join(current_directory, filename), os.path.join(current_directory, new_filename))
        print(f"重命名: {filename} -> {new_filename}")

print("文件重命名完成！")
