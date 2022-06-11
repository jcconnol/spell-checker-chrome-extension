text = open('dictionary.txt', 'r+')
newFile = open('newDictionary.txt', 'r+')

for line in text.readlines():
    line = line.strip().upper()
    newLine = line.replace(line, "    \""+line+"\":\"1\",\n")
    newFile.write(newLine)
    print(newLine)
text.close()