type FileType = {
    name: string,
    file_type: number,
    iconclass: string,
    language: string,
    suffix: string
}


export class FileTypeManager {
    static filetypes: FileType[] = [
        { name: "Java-Quelltext", file_type: 0, iconclass: "java", language: "myJava", suffix: ".java" },
        { name: "Textdatei", file_type: 1, iconclass: "text", language: "text", suffix: ".txt" },
        { name: "Textdatei", file_type: 1, iconclass: "json", language: "json", suffix: ".json" },
        { name: "Textdatei", file_type: 1, iconclass: "xml", language: "xml", suffix: ".xml" }
    ];

    static fileTypeToIconClass(file_type: number): string {
        for(let ft of this.filetypes){
            if(ft.file_type == file_type) return ft.iconclass;
        }
        return "java";
    }

    static suffixToFileType(suffix: string): FileType {
        for(let ft of this.filetypes){
            if(ft.suffix == suffix) return ft;
        }
        return this.filetypes[0];
    }

    static filenameToFileType(filename: string): FileType {
        for(let ft of this.filetypes){
            if(filename.endsWith(ft.suffix)) return ft;
        }
        return this.filetypes[0];
    }


}